import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getRequiredEnvMap } from "../_shared/env.ts";
import {
  buildStripePayloadSummary,
  getPlanByKey,
  getPlanByPriceId,
  redactErrorMessage,
} from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toIso = (timestamp?: number | null) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let event: Stripe.Event | null = null;

  try {
    const env = getRequiredEnvMap([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const);

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return json({ error: "Signature manquante." }, 400);
    }

    const body = await req.text();

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      console.error("Stripe signature verification failed: invalid_signature");
      return json({ error: "Signature Stripe invalide." }, 400);
    }

    const recordEvent = async (
      status: "ok" | "skip" | "error",
      details: Record<string, unknown> = {},
      errorMessage?: string,
    ) => {
      await supabase.from("stripe_events").upsert(
        {
          id: event!.id,
          stripe_event_id: event!.id,
          type: event!.type,
          status,
          error: errorMessage || null,
          payload_summary: buildStripePayloadSummary(event!.id, event!.type, details),
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    };

    const { data: existingEvent } = await supabase
      .from("stripe_events")
      .select("id, status")
      .or(`id.eq.${event.id},stripe_event_id.eq.${event.id}`)
      .maybeSingle();

    if (existingEvent) {
      return json({ received: true, duplicate: true });
    }

    const resolveUserId = async ({
      metadataUserId,
      customerId,
      customerEmail,
    }: {
      metadataUserId?: string | null;
      customerId?: string | null;
      customerEmail?: string | null;
    }) => {
      if (metadataUserId) return { userId: metadataUserId, via: "metadata" };

      if (customerId) {
        const { data: subscription } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (subscription?.user_id) {
          return { userId: subscription.user_id as string, via: "customer" };
        }
      }

      if (customerEmail) {
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const match = usersData.users.find(
          (candidate) => candidate.email?.toLowerCase() === customerEmail.toLowerCase(),
        );

        if (match) return { userId: match.id, via: "email" };
      }

      return { userId: null, via: null };
    };

    const grantCredits = async ({
      userId,
      credits,
      sourceType,
      sourceId,
      metadata,
    }: {
      userId: string;
      credits: number;
      sourceType: string;
      sourceId: string;
      metadata: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.rpc("apply_credit_transaction", {
        p_user_id: userId,
        p_delta: credits,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_metadata: {
          ...metadata,
          stripe_event_id: event!.id,
          stripe_event_type: event!.type,
        },
      });

      if (error) throw error;
      return data as { applied?: boolean; duplicate?: boolean; credits?: number } | null;
    };

    const syncSubscription = async ({
      userId,
      customerId,
      subscriptionId,
      planKey,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      trialEnd,
    }: {
      userId: string;
      customerId?: string | null;
      subscriptionId?: string | null;
      planKey: string;
      status: string;
      currentPeriodStart?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
      trialEnd?: string | null;
    }) => {
      await supabase.from("user_subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          plan_key: planKey,
          status,
          current_period_start: currentPeriodStart || null,
          current_period_end: currentPeriodEnd || null,
          cancel_at_period_end: Boolean(cancelAtPeriodEnd),
          trial_end: trialEnd || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    };

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const customerEmail = session.customer_details?.email || session.customer_email || null;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const priceId = lineItems.data[0]?.price?.id || (session.metadata?.price_id as string | undefined) || null;
      const plan =
        getPlanByKey(session.metadata?.plan_key) ||
        getPlanByPriceId(priceId);
      const { userId, via } = await resolveUserId({
        metadataUserId: session.metadata?.user_id || session.client_reference_id,
        customerId,
        customerEmail,
      });

      if (!userId) {
        await recordEvent("error", { reason: "user_not_resolved", customerId, priceId }, "user_not_resolved");
        return json({ received: true, warning: "User not resolved" });
      }

      if (!priceId || !plan?.monthlyCredits) {
        await recordEvent("skip", { reason: "unknown_price", priceId, userId });
        return json({ received: true, skipped: true });
      }

      let subscriptionStatus = "active";
      let currentPeriodStart: string | null = null;
      let currentPeriodEnd: string | null = null;
      let cancelAtPeriodEnd = false;
      let trialEnd: string | null = null;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subscriptionPeriods = subscription as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };
        subscriptionStatus = subscription.status;
        currentPeriodStart = toIso(subscriptionPeriods.current_period_start);
        currentPeriodEnd = toIso(subscriptionPeriods.current_period_end);
        cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
        trialEnd = toIso(subscription.trial_end);
      }

      await syncSubscription({
        userId,
        customerId,
        subscriptionId,
        planKey: plan.key,
        status: subscriptionStatus,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        trialEnd,
      });

      const grantResult = await grantCredits({
        userId,
        credits: plan.monthlyCredits,
        sourceType: "stripe_checkout_session",
        sourceId: session.id,
        metadata: {
          plan_key: plan.key,
          price_id: priceId,
          resolved_via: via,
          reason: "subscription_initial_grant",
        },
      });

      await recordEvent("ok", {
        userId,
        planKey: plan.key,
        priceId,
        creditsAdded: plan.monthlyCredits,
        duplicateGrant: Boolean(grantResult?.duplicate),
      });

      return json({ received: true });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      };
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      const priceId = subscription.items.data[0]?.price?.id || null;
      const plan =
        getPlanByKey(subscription.metadata?.plan_key) ||
        getPlanByPriceId(priceId);
      const { userId, via } = await resolveUserId({
        metadataUserId: subscription.metadata?.user_id,
        customerId,
        customerEmail: null,
      });

      if (!userId || !plan) {
        await recordEvent("skip", { reason: "subscription_not_resolved", customerId, priceId });
        return json({ received: true, skipped: true });
      }

      await syncSubscription({
        userId,
        customerId,
        subscriptionId: subscription.id,
        planKey: plan.key,
        status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
        currentPeriodStart: toIso(subscription.current_period_start),
        currentPeriodEnd: toIso(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: toIso(subscription.trial_end),
      });

      await recordEvent("ok", {
        userId,
        via,
        planKey: plan.key,
        subscriptionStatus: subscription.status,
      });

      return json({ received: true });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
        billing_reason?: string;
      };
      const billingReason = invoice.billing_reason || null;
      const priceId = invoice.lines.data[0]?.price?.id || null;
      const plan = getPlanByPriceId(priceId);
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id || null;

      if (billingReason === "subscription_create") {
        await recordEvent("skip", {
          reason: "initial_invoice_handled_by_checkout",
          priceId,
          subscriptionId,
        });
        return json({ received: true, skipped: true });
      }

      let subscription: (Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      }) | null = null;

      if (subscriptionId) {
        subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription & {
          current_period_start?: number;
          current_period_end?: number;
        };
      }

      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : typeof subscription?.customer === "string"
          ? subscription.customer
          : null;
      const { userId, via } = await resolveUserId({
        metadataUserId: subscription?.metadata?.user_id,
        customerId,
        customerEmail: invoice.customer_email,
      });

      if (!userId || !plan?.monthlyCredits || !invoice.id) {
        await recordEvent("skip", { reason: "invoice_not_resolved", priceId, customerId });
        return json({ received: true, skipped: true });
      }

      if (subscription) {
        await syncSubscription({
          userId,
          customerId,
          subscriptionId: subscription.id,
          planKey: plan.key,
          status: subscription.status,
          currentPeriodStart: toIso(subscription.current_period_start),
          currentPeriodEnd: toIso(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: toIso(subscription.trial_end),
        });
      }

      const grantResult = await grantCredits({
        userId,
        credits: plan.monthlyCredits,
        sourceType: "stripe_invoice",
        sourceId: invoice.id,
        metadata: {
          plan_key: plan.key,
          price_id: priceId,
          resolved_via: via,
          reason: "subscription_monthly_refill",
        },
      });

      await recordEvent("ok", {
        userId,
        planKey: plan.key,
        priceId,
        creditsAdded: plan.monthlyCredits,
        duplicateGrant: Boolean(grantResult?.duplicate),
      });

      return json({ received: true });
    }

    if (
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.payment_action_required"
    ) {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id || null;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      const { userId } = await resolveUserId({
        metadataUserId: null,
        customerId,
        customerEmail: invoice.customer_email,
      });

      if (userId) {
        await supabase
          .from("user_subscriptions")
          .update({
            status: event.type === "invoice.payment_failed" ? "payment_failed" : "payment_action_required",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }

      await recordEvent("ok", {
        userId,
        subscriptionId,
        paymentStatus: event.type,
      });

      return json({ received: true });
    }

    await recordEvent("skip", { reason: "unhandled_event_type" });
    return json({ received: true, ignored: true });
  } catch (error) {
    console.error("stripe-webhook error:", redactErrorMessage(error));

    if (event) {
      try {
        const env = getRequiredEnvMap(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const);
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("stripe_events").upsert(
          {
            id: event.id,
            stripe_event_id: event.id,
            type: event.type,
            status: "error",
            error: redactErrorMessage(error),
            payload_summary: buildStripePayloadSummary(event.id, event.type, {
              reason: "processing_failed",
            }),
            processed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      } catch {
        // Keep the webhook response redacted even if logging fails.
      }
    }

    return json({ error: redactErrorMessage(error) }, 500);
  }
});
