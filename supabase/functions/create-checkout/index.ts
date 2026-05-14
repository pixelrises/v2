import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getRequiredEnvMap } from "../_shared/env.ts";
import { redactErrorMessage, resolveCheckoutSelection } from "../_shared/billing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getRequiredEnvMap([
      "STRIPE_SECRET_KEY",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Connexion requise." }, 401);
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return json({ error: "Connexion requise." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const selection = resolveCheckoutSelection(body);
    const userId = userData.user.id;
    const userEmail = userData.user.email || undefined;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });

    const { data: existingSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existingSubscription?.stripe_customer_id || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    await supabaseAdmin.from("user_subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        plan_key: selection.planKey || "free",
        status: "checkout_started",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const origin = req.headers.get("origin") || Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://pixelrises.fr";
    const checkoutMode = selection.kind === "subscription" ? "subscription" : "payment";
    const metadata = {
      ...selection.metadata,
      user_id: userId,
      price_id: selection.priceId,
    };

    const session = await stripe.checkout.sessions.create({
      mode: checkoutMode,
      line_items: [{ price: selection.priceId, quantity: 1 }],
      customer: customerId,
      client_reference_id: userId,
      metadata,
      ...(checkoutMode === "subscription"
        ? {
            subscription_data: {
              metadata,
            },
          }
        : {
            payment_intent_data: {
              metadata,
            },
          }),
      success_url: `${origin}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?payment=cancelled`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("create-checkout error:", redactErrorMessage(error));
    return json({ error: redactErrorMessage(error) }, 500);
  }
});
