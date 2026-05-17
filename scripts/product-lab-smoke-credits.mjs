#!/usr/bin/env node
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
loadEnv({ path: path.join(root, ".env.local"), override: false, quiet: true });
loadEnv({ path: path.join(root, ".env"), override: false, quiet: true });

const firstEnv = (...names) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
};

const redactEmail = (email) => {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "smoke-user";
  return `${local.slice(0, 2)}***@${domain}`;
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const supabaseUrl = firstEnv("SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const serviceRoleKey = firstEnv("SUPABASE_SERVICE_ROLE_KEY", "PIXELRISES_SUPABASE_SERVICE_ROLE_KEY");
const smokeEmail = firstEnv("PIXELRISES_SMOKE_EMAIL");
const dailyBudget = Math.max(0, Math.min(10, toInt(process.env.PIXELRISES_GENERATOR_DAILY_REAL_BUDGET, 10)));
const creditsPerCase = Math.max(1, toInt(process.env.PRODUCT_LAB_SMOKE_CREDITS_PER_CASE, 5));
const configuredMin = toInt(process.env.PRODUCT_LAB_SMOKE_MIN_CREDITS, 0);
const minimumCredits = Math.max(configuredMin, dailyBudget * creditsPerCase + creditsPerCase * 2);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Product Lab smoke credits skipped: Supabase URL or service role key missing.");
}

if (!smokeEmail) {
  throw new Error("Product Lab smoke credits skipped: PIXELRISES_SMOKE_EMAIL missing.");
}

if (minimumCredits <= 0) {
  console.log("Product Lab smoke credits skipped: minimum credit target is 0.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const findUserByEmail = async (email) => {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Unable to list auth users: ${error.message}`);
    const user = data.users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
};

const user = await findUserByEmail(smokeEmail);
if (!user?.id) {
  throw new Error(`Product Lab smoke credits failed: smoke user ${redactEmail(smokeEmail)} not found.`);
}

const { data: creditRow, error: creditError } = await supabase
  .from("user_credits")
  .select("credits,total_used")
  .eq("user_id", user.id)
  .maybeSingle();

if (creditError) {
  throw new Error(`Unable to read smoke user credits: ${creditError.message}`);
}

const currentCredits = Number(creditRow?.credits ?? 0);
if (currentCredits >= minimumCredits) {
  console.log(
    `Product Lab smoke credits ready for ${redactEmail(smokeEmail)}: ${currentCredits}/${minimumCredits} credits.`,
  );
  process.exit(0);
}

const delta = minimumCredits - currentCredits;
const sourceId = `product-lab-smoke-${process.env.GITHUB_RUN_ID || new Date().toISOString().slice(0, 10)}-${user.id}`;
const { data: rpcData, error: rpcError } = await supabase.rpc("apply_credit_transaction", {
  p_user_id: user.id,
  p_delta: delta,
  p_source_type: "product_lab_smoke_refill",
  p_source_id: sourceId,
  p_metadata: {
    reason: "Product Lab generator smoke QA controlled refill",
    daily_budget: dailyBudget,
    min_credits: minimumCredits,
  },
  p_created_by: null,
});

if (rpcError) {
  throw new Error(`Unable to refill smoke user credits: ${rpcError.message}`);
}

console.log(
  `Product Lab smoke credits refilled for ${redactEmail(smokeEmail)}: +${delta}, new balance ${
    rpcData?.credits ?? minimumCredits
  }.`,
);
