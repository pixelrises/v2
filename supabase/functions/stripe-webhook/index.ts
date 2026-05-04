import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getRequiredEnvMap } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PRICE_TO_CREDITS: Record<string, number> = {
  "price_1TOQD8Ro0fDYDUP3kzJA5CrL": 10,
  "price_1TOQEIRo0fDYDUP3gOijNdUZ": 25,
  "price_1TOQEwRo0fDYDUP3BrzOoPEM": 60,
  "price_1TLA8ARo0fDYDUP3fbZmq3nR": 10,
  "price_1TLADZRo0fDYDUP3dk4Rpcfq": 25,
  "price_1TLAEwRo0fDYDUP3zmetuEq5": 60,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logErrorResponse = (message: string, status = 500) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const env = getRequiredEnvMap([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const);

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return logErrorResponse("Missing signature", 400);
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return logErrorResponse("Invalid signature", 400);
    }

    console.info("stripe-webhook received", {
      id: event.id,
      type: event.type,
    });

    const { data: existing } = await supabase
      .from("stripe_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const logEvent = async (
      status: "ok" | "skip" | "error",
      info: Record<string, unknown>,
    ) => {
      try {
        await supabase.from("stripe_events").insert({
          id: event.id,
          type: event.type,
          payload: { status, info, object: event.data.object } as never,
        });
      } catch (error) {
        console.error("Failed to record stripe_event:", error);
      }
    };

    let userId: string | null = null;
    let customerEmail: string | null = null;
    let priceId: string | null = null;
    let grantSourceType: string | null = null;
    let grantSourceId: string | null = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      userId = (session.metadata?.user_id as string) || session.client_reference_id || null;
      customerEmail = session.customer_details?.email || session.customer_email || null;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      priceId = lineItems.data[0]?.price?.id || (session.metadata?.price_id as string) || null;
      grantSourceType = "stripe_checkout_session";
      grantSourceId = session.id;
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const billingReason = (invoice as { billing_reason?: string }).billing_reason;

      if (billingReason === "subscription_create") {
        await logEvent("skip", {
          reason: "subscription_create handled by checkout.session.completed",
        });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      customerEmail = invoice.customer_email;
      priceId = invoice.lines.data[0]?.price?.id || null;
      grantSourceType = "stripe_invoice";
      grantSourceId = invoice.id;

      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : null;

      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          userId = (subscription.metadata?.user_id as string) || null;
        } catch (error) {
          console.warn("Could not retrieve subscription metadata", error);
        }
      }
    } else {
      await logEvent("skip", { reason: `Unhandled event type: ${event.type}` });
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!priceId) {
      await logEvent("skip", { reason: "Missing priceId" });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creditsToAdd = PRICE_TO_CREDITS[priceId];
    if (!creditsToAdd) {
      await logEvent("skip", { reason: "Unknown priceId", priceId });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resolvedUserId = userId;
    let resolvedVia: "metadata" | "email" | null = userId ? "metadata" : null;

    if (!resolvedUserId && customerEmail) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        throw listError;
      }

      const match = usersData.users.find(
        (candidate) => candidate.email?.toLowerCase() === customerEmail!.toLowerCase(),
      );

      if (match) {
        resolvedUserId = match.id;
        resolvedVia = "email";
      }
    }

    if (!resolvedUserId) {
      await logEvent("error", {
        reason: "User not resolved",
        priceId,
        customerEmail,
      });
      return new Response(JSON.stringify({
        received: true,
        warning: "User not resolved",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!grantSourceType || !grantSourceId) {
      await logEvent("error", {
        reason: "Missing credit grant source",
        priceId,
        customerEmail,
      });
      return new Response(JSON.stringify({
        received: true,
        warning: "Grant source missing",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: grantResult, error: grantError } = await supabase.rpc(
      "apply_credit_transaction",
      {
        p_user_id: resolvedUserId,
        p_delta: creditsToAdd,
        p_source_type: grantSourceType,
        p_source_id: grantSourceId,
        p_metadata: {
          stripe_event_id: event.id,
          stripe_event_type: event.type,
          price_id: priceId,
          customer_email: customerEmail,
          resolved_via: resolvedVia,
          credits_added: creditsToAdd,
        },
      },
    );

    if (grantError) {
      throw grantError;
    }

    const applied = Boolean((grantResult as { applied?: boolean } | null)?.applied);
    const duplicateGrant = Boolean(
      (grantResult as { duplicate?: boolean } | null)?.duplicate,
    );
    const updatedCredits = Number(
      (grantResult as { credits?: number } | null)?.credits ?? 0,
    );

    if (!applied && duplicateGrant) {
      await logEvent("skip", {
        reason: "Duplicate credit grant",
        userId: resolvedUserId,
        priceId,
        creditsAdded: creditsToAdd,
        sourceType: grantSourceType,
        sourceId: grantSourceId,
      });

      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logEvent("ok", {
      userId: resolvedUserId,
      via: resolvedVia,
      priceId,
      creditsAdded: creditsToAdd,
      newCredits: updatedCredits,
      sourceType: grantSourceType,
      sourceId: grantSourceId,
    });

    console.info("stripe-webhook credited", {
      eventId: event.id,
      userId: resolvedUserId,
      creditsAdded: creditsToAdd,
      priceId,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return logErrorResponse(
      error instanceof Error ? error.message : "Processing failed",
    );
  }
});
