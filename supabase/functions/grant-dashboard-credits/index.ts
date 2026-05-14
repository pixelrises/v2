import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getRequiredEnvMap } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (payload: Record<string, unknown>, status = 200) =>
  Response.json(payload, {
    status,
    headers: corsHeaders,
  });

type Payload = {
  amount?: number;
  userId?: string;
  reason?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const env = getRequiredEnvMap([
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ] as const);
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Connexion requise." }, 401);
    }

    const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user?.id) {
      return json({ success: false, error: "Connexion requise." }, 401);
    }

    const { data: role } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      return json({ success: false, error: "Acces admin requis." }, 403);
    }

    const body = request.method === "POST" ? ((await request.json()) as Payload) : {};
    const amount = Math.max(1, Math.min(5000, Number(body.amount || 0)));
    const targetUserId = String(body.userId || "");

    if (!targetUserId || !amount) {
      return json({ success: false, error: "Utilisateur et montant requis." }, 400);
    }

    const { data, error } = await serviceClient.rpc("apply_credit_transaction", {
      p_user_id: targetUserId,
      p_delta: amount,
      p_source_type: "admin_manual_add",
      p_source_id: crypto.randomUUID(),
      p_metadata: {
        reason: body.reason || "admin_adjustment",
        adjusted_by: user.id,
      },
      p_created_by: user.id,
    });

    if (error) throw error;

    return json({
      success: true,
      userId: targetUserId,
      credits: (data as { credits?: number } | null)?.credits ?? null,
      added: amount,
    });
  } catch (error) {
    console.error("grant-dashboard-credits error:", error instanceof Error ? error.message : "unknown_error");
    return json(
      {
        success: false,
        error: "Impossible de modifier les credits pour le moment.",
      },
      400,
    );
  }
});
