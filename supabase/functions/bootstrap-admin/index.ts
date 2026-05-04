import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getRequiredEnvMap = <T extends readonly string[]>(keys: T): Record<T[number], string> => {
  const values = {} as Record<T[number], string>;

  for (const key of keys) {
    const value = Deno.env.get(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    values[key] = value;
  }

  return values;
};

const parseAllowedEmails = (value: string) =>
  value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getRequiredEnvMap([
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "ADMIN_ALLOWED_EMAILS",
    ] as const);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user?.id || !userData.user.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedEmails = parseAllowedEmails(env.ADMIN_ALLOWED_EMAILS);
    const email = userData.user.email.toLowerCase();
    const isAllowed = allowedEmails.includes(email);

    if (!isAllowed) {
      return new Response(JSON.stringify({ isAdmin: false, allowed: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: roleError } = await adminClient.from("user_roles").upsert(
      {
        user_id: userData.user.id,
        role: "admin",
      },
      {
        onConflict: "user_id,role",
        ignoreDuplicates: true,
      },
    );

    if (roleError) {
      throw roleError;
    }

    return new Response(JSON.stringify({ isAdmin: true, allowed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("bootstrap-admin error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Bootstrap admin failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
