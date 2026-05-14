import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getRequiredEnvMap } from "../_shared/env.ts";
import { redactErrorMessage } from "../_shared/billing.ts";

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

    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return json(
        {
          error: "Aucun abonnement Stripe actif a gerer pour le moment.",
          code: "portal_not_available",
        },
        404,
      );
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
    const origin = req.headers.get("origin") || Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://pixelrises.fr";
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/billing`,
    });

    return json({ url: session.url });
  } catch (error) {
    console.error("customer-portal error:", redactErrorMessage(error));
    return json({ error: redactErrorMessage(error) }, 500);
  }
});
