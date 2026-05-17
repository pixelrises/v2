import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getRequiredEnvMap } from "../_shared/env.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT = 5;
const RATE_WINDOW_HOURS = 1;

const redactLogValue = (value: unknown) => {
  const message = value instanceof Error ? value.message : String(value ?? "unknown_error");

  return message
    .replace(/\b(sk|pk|whsec|ghp|github_pat|sb_secret|vck)_[0-9A-Za-z_-]{8,}\b/g, "[redacted]")
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [redacted]")
    .replace(/key=[^&\s]+/gi, "key=[redacted]");
};

const DIAGNOSIS_JSON_SCHEMA = `{
  "score_global": 1,
  "situation": "2 phrases maximum décrivant la situation actuelle et son impact business",
  "problemes": [
    "problème concret 1",
    "problème concret 2",
    "problème concret 3"
  ],
  "points_forts": [
    "point fort si pertinent"
  ],
  "plan_action": [
    "action concrète 1",
    "action concrète 2",
    "action concrète 3"
  ],
  "resultat_attendu": "1 phrase sur le résultat concret attendu",
  "recommandation_offre": "Essentiel ou Professionnel ou Premium",
  "raison_offre": "1 phrase claire expliquant pourquoi cette offre est la plus adaptée"
}`;

type Diagnosis = {
  score_global: number;
  situation: string;
  problemes: string[];
  points_forts?: string[];
  plan_action: string[];
  resultat_attendu: string;
  recommandation_offre: "Essentiel" | "Professionnel" | "Premium";
  raison_offre: string;
};

const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score_global: { type: "integer", minimum: 1, maximum: 10 },
    situation: { type: "string" },
    problemes: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3,
    },
    points_forts: {
      type: "array",
      items: { type: "string" },
      maxItems: 2,
    },
    plan_action: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3,
    },
    resultat_attendu: { type: "string" },
    recommandation_offre: {
      type: "string",
      enum: ["Essentiel", "Professionnel", "Premium"],
    },
    raison_offre: { type: "string" },
  },
  required: [
    "score_global",
    "situation",
    "problemes",
    "plan_action",
    "resultat_attendu",
    "recommandation_offre",
    "raison_offre",
  ],
} as const;

async function isRateLimited(ip: string): Promise<boolean> {
  const env = getRequiredEnvMap(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const);
  const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const windowStart = new Date(Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  await supabaseAdmin.from("edge_rate_limits").delete().lt("window_start", windowStart);

  const { data } = await supabaseAdmin
    .from("edge_rate_limits")
    .select("request_count")
    .eq("ip_address", ip)
    .eq("function_name", "analyze-url")
    .gte("window_start", windowStart)
    .maybeSingle();

  if (!data) {
    await supabaseAdmin.from("edge_rate_limits").insert({
      ip_address: ip,
      function_name: "analyze-url",
      request_count: 1,
      window_start: new Date().toISOString(),
    });
    return false;
  }

  if (data.request_count >= RATE_LIMIT) {
    return true;
  }

  await supabaseAdmin
    .from("edge_rate_limits")
    .update({ request_count: data.request_count + 1 })
    .eq("ip_address", ip)
    .eq("function_name", "analyze-url")
    .gte("window_start", windowStart);

  return false;
}

function isBlockedHost(hostname: string): boolean {
  const BLOCKED_IPV4 = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|0\.0\.0\.0)/i;
  const BLOCKED_IPV6 = /^(\[?::1\]?|\[?::ffff:(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\.|^\[?f[cd][0-9a-f]{2}:|\[?fe[89ab][0-9a-f]:)/i;

  const stripped = hostname.replace(/^\[|\]$/g, "");
  return (
    BLOCKED_IPV4.test(stripped) ||
    BLOCKED_IPV6.test(stripped) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  );
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function parseDiagnosis(content: string): Diagnosis | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.situation || !Array.isArray(parsed.problemes) || !Array.isArray(parsed.plan_action)) {
      return null;
    }

    return {
      score_global: Math.min(10, Math.max(1, Number(parsed.score_global || 1))),
      situation: String(parsed.situation || ""),
      problemes: parsed.problemes.map(String).filter(Boolean).slice(0, 3),
      points_forts: Array.isArray(parsed.points_forts)
        ? parsed.points_forts.map(String).filter(Boolean).slice(0, 2)
        : [],
      plan_action: parsed.plan_action.map(String).filter(Boolean).slice(0, 3),
      resultat_attendu: String(parsed.resultat_attendu || ""),
      recommandation_offre: ["Essentiel", "Professionnel", "Premium"].includes(parsed.recommandation_offre)
        ? parsed.recommandation_offre
        : "Professionnel",
      raison_offre: String(parsed.raison_offre || ""),
    };
  } catch {
    return null;
  }
}

async function generateStructuredDiagnosis(prompt: string): Promise<Diagnosis | null> {
  const env = getRequiredEnvMap(["GEMINI_API_KEY"] as const);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: DIAGNOSIS_RESPONSE_SCHEMA,
          temperature: 0.2,
          maxOutputTokens: 900,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    throw new Error(`GEMINI_NATIVE_${response.status}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseDiagnosis(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    getRequiredEnvMap(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"] as const);

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (await isRateLimited(clientIp)) {
      return jsonResponse({ error: "Trop de requêtes. Réessayez plus tard." }, 429);
    }

    const { url, objectif, budget, hasSite } = await req.json();

    if (!url || typeof url !== "string" || url.trim() === "") {
      const diagnosis = await generateStructuredDiagnosis(`Tu es un consultant digital senior de Pixelrises, une agence web premium orientée conversion.

Le prospect n'a pas encore de site web.
Objectif principal : ${objectif || "non précisé"}
Budget : ${budget || "non précisé"}
Réponse à la question "avez-vous déjà un site" : ${hasSite || "non précisé"}

Crée un diagnostic réel, concis, crédible et actionnable en français.
Ne sois ni vague ni théâtral. Ne parle pas comme une publicité.
Adapte la recommandation au budget et à l'objectif.

Réponds en respectant cette structure :
${DIAGNOSIS_JSON_SCHEMA}`);

      if (!diagnosis) {
        return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
      }

      return jsonResponse({ diagnosis });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return jsonResponse({ error: "URL invalide." }, 400);
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (isBlockedHost(hostname)) {
      return jsonResponse({ error: "URL non autorisée." }, 400);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return jsonResponse({ error: "Protocole non autorisé." }, 400);
    }

    let htmlContent = "";
    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: { "User-Agent": "Pixelrises-Analyzer/1.0" },
        redirect: "error",
      });
      htmlContent = await response.text();
      htmlContent = htmlContent.substring(0, 8000);
    } catch {
      return jsonResponse({ error: "Impossible d'accéder au site pour réaliser l'analyse." });
    }

    const diagnosis = await generateStructuredDiagnosis(`Tu es un consultant digital senior de Pixelrises, une agence web premium orientée conversion.

Le prospect possède déjà un site web à analyser.
Objectif principal : ${objectif || "non précisé"}
Budget : ${budget || "non précisé"}
Réponse à la question "avez-vous déjà un site" : ${hasSite || "non précisé"}

Analyse le HTML fourni. Identifie les vrais problèmes de clarté, crédibilité, hiérarchie, réassurance, conversion et orientation business.
Sois honnête, utile et concret. Pas de phrases génériques.
Adapte la recommandation à l'objectif et au budget.

Site analysé : ${parsedUrl.hostname}

HTML :
${htmlContent}

Réponds en respectant cette structure :
${DIAGNOSIS_JSON_SCHEMA}`);

    if (!diagnosis) {
      return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
    }

    return jsonResponse({ diagnosis });
  } catch (error) {
    console.error("analyze-url error:", redactLogValue(error));

    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return jsonResponse({ error: "Service temporairement surchargé. Réessayez dans quelques instants." }, 429);
    }

    return jsonResponse({ error: "Une erreur interne est survenue. Veuillez réessayer." }, 500);
  }
});
