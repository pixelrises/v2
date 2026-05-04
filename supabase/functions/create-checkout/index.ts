import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getRequiredEnvMap } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONE_TIME_PRICES: Record<string, number> = {
  "price_1TOQD8Ro0fDYDUP3kzJA5CrL": 10,
  "price_1TOQEIRo0fDYDUP3gOijNdUZ": 25,
  "price_1TOQEwRo0fDYDUP3BrzOoPEM": 60,
};

const SUBSCRIPTION_PRICES: Record<string, number> = {
  "price_1TLA8ARo0fDYDUP3fbZmq3nR": 10,
  "price_1TLADZRo0fDYDUP3dk4Rpcfq": 25,
  "price_1TLAEwRo0fDYDUP3zmetuEq5": 60,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getRequiredEnvMap([
      "STRIPE_SECRET_KEY",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
    ] as const);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email || undefined;

    const body = await req.json().catch(() => ({}));
    const priceId = String(body?.priceId || "");
    const mode = body?.mode === "subscription" ? "subscription" : "payment";
    const requestContext = { userId, priceId, mode };

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedPrices = mode === "payment" ? ONE_TIME_PRICES : SUBSCRIPTION_PRICES;
    if (!(priceId in allowedPrices)) {
      return new Response(JSON.stringify({ error: "Price not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    const origin = req.headers.get("origin") || "https://pixelrises.fr";
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        price_id: priceId,
        credit_amount: String(allowedPrices[priceId]),
      },
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                user_id: userId,
                price_id: priceId,
                credit_amount: String(allowedPrices[priceId]),
              },
            },
          }
        : {
            payment_intent_data: {
              metadata: {
                user_id: userId,
                price_id: priceId,
                credit_amount: String(allowedPrices[priceId]),
              },
            },
          }),
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?tab=subscription&checkout=cancel`,
    });

    console.info("create-checkout success", {
      ...requestContext,
      sessionId: session.id,
      origin,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Checkout failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
