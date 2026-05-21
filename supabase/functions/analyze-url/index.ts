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
  "raison_offre": "1 phrase claire expliquant pourquoi cette offre est la plus adaptée",
  "site_accessible": true,
  "analysis_source": "live_url_audit ou blocked_url_brief ou questionnaire_brief",
  "tested_url": "https://site.fr",
  "audit_brief": "Brief consultant expliquant les soucis et comment Pixelrises les corrige",
  "expertise_angle": "Phrase qui met en valeur l'expertise Pixelrises sans promesse exageree",
  "how_pixelrises_helps": "Comment Pixelrises transforme le diagnostic en site plus clair et plus vendeur",
  "manual_checks": [
    "verification manuelle utile 1",
    "verification manuelle utile 2"
  ]
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
  site_accessible?: boolean;
  analysis_source?: "live_url_audit" | "blocked_url_brief" | "questionnaire_brief";
  tested_url?: string;
  audit_brief?: string;
  expertise_angle?: string;
  how_pixelrises_helps?: string;
  manual_checks?: string[];
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
    site_accessible: { type: "boolean" },
    analysis_source: {
      type: "string",
      enum: ["live_url_audit", "blocked_url_brief", "questionnaire_brief"],
    },
    tested_url: { type: "string" },
    audit_brief: { type: "string" },
    expertise_angle: { type: "string" },
    how_pixelrises_helps: { type: "string" },
    manual_checks: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
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
      site_accessible: typeof parsed.site_accessible === "boolean" ? parsed.site_accessible : undefined,
      analysis_source: ["live_url_audit", "blocked_url_brief", "questionnaire_brief"].includes(parsed.analysis_source)
        ? parsed.analysis_source
        : undefined,
      tested_url: typeof parsed.tested_url === "string" ? parsed.tested_url : "",
      audit_brief: typeof parsed.audit_brief === "string" ? parsed.audit_brief : "",
      expertise_angle: typeof parsed.expertise_angle === "string" ? parsed.expertise_angle : "",
      how_pixelrises_helps: typeof parsed.how_pixelrises_helps === "string" ? parsed.how_pixelrises_helps : "",
      manual_checks: Array.isArray(parsed.manual_checks)
        ? parsed.manual_checks.map(String).filter(Boolean).slice(0, 4)
        : [],
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

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHtmlSignals(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
    "";
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  const formCount = (html.match(/<form\b/gi) || []).length;
  const buttonCount = (html.match(/<button\b|role=["']button["']/gi) || []).length;
  const linkCount = (html.match(/<a\b/gi) || []).length;
  const imageWithoutAltCount = (html.match(/<img(?![^>]*\balt=)/gi) || []).length;
  const visibleText = stripHtml(html).slice(0, 3500);

  return {
    title,
    description,
    h1Count,
    h2Count,
    formCount,
    buttonCount,
    linkCount,
    imageWithoutAltCount,
    visibleText,
  };
}

function buildBlockedSitePrompt({
  url,
  objectif,
  budget,
  hasSite,
  reason,
}: {
  url: string;
  objectif: unknown;
  budget: unknown;
  hasSite: unknown;
  reason: string;
}) {
  return `Tu es un consultant digital senior de Pixelrises, une agence web premium orientée conversion.

Le prospect a donné un site, mais l'audit automatique complet est bloqué.
Site testé : ${url}
Raison technique redacted : ${reason}
Objectif principal : ${objectif || "non précisé"}
Budget : ${budget || "non précisé"}
Réponse à la question "avez-vous déjà un site" : ${hasSite || "non précisé"}

Crée un pré-diagnostic stratégique honnête : ne prétends pas avoir lu le site si l'accès est limité.
Important pour la crédibilité côté client :
- ne mets pas le blocage technique au premier plan;
- n'utilise pas de formulation d'échec technique dans situation, problemes ou audit_brief;
- reformule comme une lecture stratégique basée sur l'objectif, le budget, l'URL fournie et les signaux disponibles;
- montre l'expertise Pixelrises sans donner l'impression que l'outil a échoué.
Tu dois quand même aider le prospect avec un plan clair :
- les risques probables à vérifier;
- comment corriger le message, la confiance, le CTA, le SEO local et la conversion;
- comment Pixelrises apporte l'expertise : diagnostic, structure, copywriting, design, preuve, mise en ligne.

Champs obligatoires à renseigner :
- site_accessible: false
- analysis_source: "blocked_url_brief"
- tested_url: l'URL testée
- audit_brief: résumé court de la méthode de correction, sans mentionner le blocage technique
- expertise_angle: phrase valorisant l'expertise Pixelrises sans promesse excessive
- how_pixelrises_helps: comment Pixelrises transforme le brief en site utile
- manual_checks: 3 à 4 vérifications concrètes à faire manuellement.

Réponds en respectant cette structure :
${DIAGNOSIS_JSON_SCHEMA}`;
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
Renseigne site_accessible=false, analysis_source="questionnaire_brief", audit_brief, expertise_angle, how_pixelrises_helps et manual_checks.
Le rapport doit mettre en valeur l'expertise Pixelrises : stratégie, structure, copywriting, design, preuves, conversion et lancement.

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
        headers: {
          "User-Agent": "Pixelrises-Analyzer/1.0 (+https://pixelrises.fr)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        const fallbackDiagnosis = await generateStructuredDiagnosis(
          buildBlockedSitePrompt({
            url: parsedUrl.toString(),
            objectif,
            budget,
            hasSite,
            reason: `HTTP_${response.status}`,
          }),
        );
        if (!fallbackDiagnosis) {
          return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
        }
        return jsonResponse({
          diagnosis: fallbackDiagnosis,
          error: "Pré-diagnostic généré à partir des informations disponibles.",
        });
      }

      htmlContent = await response.text();
      htmlContent = htmlContent.substring(0, 8000);
      if (stripHtml(htmlContent).length < 80) {
        const fallbackDiagnosis = await generateStructuredDiagnosis(
          buildBlockedSitePrompt({
            url: parsedUrl.toString(),
            objectif,
            budget,
            hasSite,
            reason: "empty_or_unreadable_html",
          }),
        );
        if (!fallbackDiagnosis) {
          return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
        }
        return jsonResponse({
          diagnosis: fallbackDiagnosis,
          error: "Pré-diagnostic généré à partir des informations disponibles.",
        });
      }
    } catch {
      const fallbackDiagnosis = await generateStructuredDiagnosis(
        buildBlockedSitePrompt({
          url: parsedUrl.toString(),
          objectif,
          budget,
          hasSite,
          reason: "fetch_blocked_or_timeout",
        }),
      );
      if (!fallbackDiagnosis) {
        return jsonResponse({ error: "Le pré-diagnostic est temporairement indisponible. Réessayez dans quelques instants." });
      }
      return jsonResponse({
        diagnosis: fallbackDiagnosis,
        error: "Pré-diagnostic généré à partir des informations disponibles.",
      });
    }

    const htmlSignals = extractHtmlSignals(htmlContent);

    const diagnosis = await generateStructuredDiagnosis(`Tu es un consultant digital senior de Pixelrises, une agence web premium orientée conversion.

Le prospect possède déjà un site web à analyser.
Objectif principal : ${objectif || "non précisé"}
Budget : ${budget || "non précisé"}
Réponse à la question "avez-vous déjà un site" : ${hasSite || "non précisé"}

Analyse le HTML fourni. Identifie les vrais problèmes de clarté, crédibilité, hiérarchie, réassurance, conversion et orientation business.
Sois honnête, utile et concret. Pas de phrases génériques.
Adapte la recommandation à l'objectif et au budget.

Site analysé : ${parsedUrl.hostname}

Signaux techniques extraits :
${JSON.stringify(htmlSignals, null, 2)}

HTML brut limite :
${htmlContent.slice(0, 4500)}

Renseigne site_accessible=true, analysis_source="live_url_audit", tested_url="${parsedUrl.toString()}", audit_brief, expertise_angle, how_pixelrises_helps et manual_checks.
Le rapport doit expliquer les soucis du site, comment les corriger, et pourquoi l'expertise Pixelrises aide à transformer le site en outil de confiance et conversion.

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
