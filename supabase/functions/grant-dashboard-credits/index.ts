import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getRequiredEnvMap } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getRequiredEnvMap([
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Payload = {
  amount?: number;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = request.method === "POST" ? ((await request.json()) as Payload) : {};
    const amount = Math.max(1, Number(body.amount || 20));

    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 50,
    });

    if (usersError) throw usersError;

    const latestUser = [...users]
      .filter((user) => user.last_sign_in_at)
      .sort(
        (a, b) =>
          new Date(b.last_sign_in_at || 0).getTime() -
          new Date(a.last_sign_in_at || 0).getTime(),
      )[0];

    if (!latestUser) {
      throw new Error("Aucun utilisateur connecté récent trouvé.");
    }

    const { data: existingCredits, error: creditsError } = await supabase
      .from("user_credits")
      .select("credits, total_used")
      .eq("user_id", latestUser.id)
      .maybeSingle();

    if (creditsError) throw creditsError;

    const nextCredits = Number(existingCredits?.credits || 0) + amount;

    const { error: upsertError } = await supabase.from("user_credits").upsert(
      {
        user_id: latestUser.id,
        credits: nextCredits,
        total_used: Number(existingCredits?.total_used || 0),
      },
      { onConflict: "user_id" },
    );

    if (upsertError) throw upsertError;

    return Response.json(
      {
        success: true,
        email: latestUser.email,
        userId: latestUser.id,
        credits: nextCredits,
        added: amount,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
});
