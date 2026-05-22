import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getRequiredEnvMap } from "../_shared/env.ts";
import { createAIChatCompletion } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_RATE_LIMIT = 60;
const RATE_WINDOW_HOURS = 1;

const getRateLimit = () => {
  const configuredLimit = Number(Deno.env.get("ANALYZE_URL_RATE_LIMIT") || "");
  if (Number.isFinite(configuredLimit) && configuredLimit >= 10 && configuredLimit <= 300) {
    return Math.floor(configuredLimit);
  }

  return DEFAULT_RATE_LIMIT;
};

const redactLogValue = (value: unknown) => {
  const message = value instanceof Error ? value.message : String(value ?? "unknown_error");

  return message
    .replace(/\b(sk|pk|whsec|ghp|github_pat|sb_secret|vck)_[0-9A-Za-z_-]{8,}\b/g, "[redacted]")
    .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [redacted]")
    .replace(/key=[^&\s]+/gi, "key=[redacted]");
};

const DIAGNOSIS_JSON_SCHEMA = `{
  "score_global": 1,
  "expert_score": 72,
  "category_scores": {
    "seo": 68,
    "conversion": 74,
    "trust": 61,
    "performance": 78,
    "responsive": 70
  },
  "situation": "2 phrases maximum décrivant la situation actuelle et son impact business",
  "problemes": [
    "problème concret 1",
    "problème concret 2",
    "problème concret 3"
  ],
  "points_forts": [
    "point fort si pertinent"
  ],
  "missing_elements": [
    "element concret manquant pour un site plus credible, visible ou vendeur"
  ],
  "expert_verdict": "Verdict expert court, nuance et actionnable",
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
  ],
  "evidence": [
    "signal observe 1",
    "signal observe 2"
  ],
  "conversion_brief": "Brief court de conversion : promesse, preuve, CTA, parcours",
  "copy_angle": "Angle de message recommande",
  "audit_limitations": [
    "perimetre verifie ou point a confirmer"
  ],
  "confidence_level": "high ou medium ou limited"
}`;

type Diagnosis = {
  score_global: number;
  expert_score?: number;
  category_scores?: {
    seo: number;
    conversion: number;
    trust: number;
    performance: number;
    responsive: number;
  };
  situation: string;
  problemes: string[];
  points_forts?: string[];
  missing_elements?: string[];
  expert_verdict?: string;
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
  evidence?: string[];
  conversion_brief?: string;
  copy_angle?: string;
  audit_limitations?: string[];
  confidence_level?: "high" | "medium" | "limited";
};

const OFFER_PRICES: Record<Diagnosis["recommandation_offre"], number> = {
  Essentiel: 490,
  Professionnel: 790,
  Premium: 1190,
};

const OFFER_RANK: Record<Diagnosis["recommandation_offre"], number> = {
  Essentiel: 1,
  Professionnel: 2,
  Premium: 3,
};

function parseBudgetCeiling(budget: unknown) {
  const value = String(budget || "");
  const numbers = value.match(/\d+/g)?.map(Number) || [];
  if (numbers.length === 0) return 0;
  if (/plus|more|\+/i.test(value)) return 99999;
  return Math.max(...numbers);
}

function budgetRecommendation(budget: unknown): Diagnosis["recommandation_offre"] {
  const ceiling = parseBudgetCeiling(budget);
  if (ceiling > 1000) return "Premium";
  if (ceiling >= 600) return "Professionnel";
  return "Essentiel";
}

function enforceBudgetRecommendation(diagnosis: Diagnosis, budget: unknown): Diagnosis {
  const expected = budgetRecommendation(budget);
  const proposed = diagnosis.recommandation_offre;
  const ceiling = parseBudgetCeiling(budget);
  const proposedPrice = OFFER_PRICES[proposed] || 0;
  const mustUseExpected =
    (ceiling && proposedPrice > ceiling) ||
    (OFFER_RANK[proposed] || 0) < (OFFER_RANK[expected] || 0);

  if (!mustUseExpected) return diagnosis;

  return {
    ...diagnosis,
    recommandation_offre: expected,
    raison_offre:
      expected === "Professionnel"
        ? "La formule Professionnel correspond mieux au budget déclaré et au niveau de cadrage nécessaire pour corriger la clarté, la preuve et la conversion."
        : expected === "Premium"
          ? "La formule Premium est plus cohérente avec l'ambition et le budget déclarés pour produire une présence plus différenciante."
          : diagnosis.raison_offre,
  };
}

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

  if (data.request_count >= getRateLimit()) {
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

function clampScore(value: unknown, fallback: number, min = 1, max = 100) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(max, Math.max(min, Math.round(score)));
}

function parseCategoryScores(value: unknown): Diagnosis["category_scores"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const scores = value as Record<string, unknown>;

  return {
    seo: clampScore(scores.seo, 50),
    conversion: clampScore(scores.conversion, 50),
    trust: clampScore(scores.trust, 50),
    performance: clampScore(scores.performance, 50),
    responsive: clampScore(scores.responsive, 50),
  };
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
      expert_score: clampScore(parsed.expert_score, Math.round(Number(parsed.score_global || 5) * 10)),
      category_scores: parseCategoryScores(parsed.category_scores),
      situation: String(parsed.situation || ""),
      problemes: parsed.problemes.map(String).filter(Boolean).slice(0, 3),
      points_forts: Array.isArray(parsed.points_forts)
        ? parsed.points_forts.map(String).filter(Boolean).slice(0, 2)
        : [],
      missing_elements: Array.isArray(parsed.missing_elements)
        ? parsed.missing_elements.map(String).filter(Boolean).slice(0, 8)
        : [],
      expert_verdict: typeof parsed.expert_verdict === "string" ? parsed.expert_verdict : "",
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
      evidence: Array.isArray(parsed.evidence)
        ? parsed.evidence.map(String).filter(Boolean).slice(0, 5)
        : [],
      conversion_brief: typeof parsed.conversion_brief === "string" ? parsed.conversion_brief : "",
      copy_angle: typeof parsed.copy_angle === "string" ? parsed.copy_angle : "",
      audit_limitations: Array.isArray(parsed.audit_limitations)
        ? parsed.audit_limitations.map(String).filter(Boolean).slice(0, 3)
        : [],
      confidence_level: ["high", "medium", "limited"].includes(parsed.confidence_level)
        ? parsed.confidence_level
        : "medium",
    };
  } catch {
    return null;
  }
}

async function generateStructuredDiagnosis(prompt: string): Promise<Diagnosis | null> {
  const model =
    Deno.env.get("AI_GATEWAY_DIAGNOSTIC_MODEL")?.trim() ||
    Deno.env.get("AI_GATEWAY_COPY_MODEL")?.trim() ||
    Deno.env.get("AI_GATEWAY_OPENAI_MODEL")?.trim() ||
    Deno.env.get("AI_GATEWAY_BALANCED_MODEL")?.trim() ||
    "openai/gpt-4o-mini";

  const response = await createAIChatCompletion({
    model,
    temperature: 0.2,
    max_tokens: 1500,
    messages: [
      {
        role: "system",
        content:
          "Tu es l'auditeur diagnostic Pixelrises. Réponds uniquement avec un objet JSON valide, sans markdown, sans texte autour, sans secret, sans trace technique. Tu ne dois jamais inventer de preuve, de chiffre, d'avis client ou d'observation non fournie.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    throw new Error(`AI_PROVIDER_${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((item) => item?.text ?? "").join("\n")
    : String(content ?? "");
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

function cleanSignalText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function collectHtmlText(html: string, pattern: RegExp, limit = 8) {
  const results: string[] = [];
  for (const match of html.matchAll(pattern)) {
    const value = cleanSignalText(match[1] || "");
    if (value && value.length >= 2 && value.length <= 140 && !results.includes(value)) {
      results.push(value);
    }
    if (results.length >= limit) break;
  }
  return results;
}

type UrlResponseMeta = {
  responseTimeMs?: number;
  statusCode?: number;
  contentType?: string;
  htmlBytes?: number;
};

function extractHtmlSignals(html: string, meta: UrlResponseMeta = {}) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1]?.trim() ||
    "";
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]?.trim() || "";
  const viewport = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i)?.[0] || "";
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  const formCount = (html.match(/<form\b/gi) || []).length;
  const buttonCount = (html.match(/<button\b|role=["']button["']/gi) || []).length;
  const linkCount = (html.match(/<a\b/gi) || []).length;
  const imageCount = (html.match(/<img\b/gi) || []).length;
  const imageWithoutAltCount = (html.match(/<img(?![^>]*\balt=)/gi) || []).length;
  const visibleText = stripHtml(html).slice(0, 3500);
  const h1Texts = collectHtmlText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, 4);
  const h2Texts = collectHtmlText(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi, 8);
  const buttonTexts = collectHtmlText(html, /<button[^>]*>([\s\S]*?)<\/button>/gi, 8);
  const linkTexts = collectHtmlText(html, /<a[^>]*>([\s\S]*?)<\/a>/gi, 12);
  const ctaTexts = [...buttonTexts, ...linkTexts]
    .filter((item) => /(contact|devis|appel|audit|diagnostic|rendez|reserver|réserver|acheter|commander|start|book|call|quote|buy)/i.test(item))
    .slice(0, 8);
  const hasContactSignal = /(mailto:|tel:|wa\.me|whatsapp|contact|prendre rendez|devis)/i.test(html);
  const hasTrustProofSignal = /(avis|temoignage|témoignage|client|cas client|reference|référence|portfolio|realisation|réalisation|garantie|certification|google reviews?|etoile|étoile)/i.test(visibleText);
  const hasLocalSeoSignal = /(paris|lyon|marseille|lille|bordeaux|nantes|rennes|toulouse|nice|montpellier|ville|local|proximite|proximité)/i.test(visibleText);
  const hasLegalTrustSignal = /(mentions legales|mentions légales|politique de confidentialite|politique de confidentialité|cgv|cgu|siret|siren)/i.test(visibleText);
  const hasStructuredData = /application\/ld\+json/i.test(html);
  const hasOpenGraph = /property=["']og:/i.test(html);
  const hasViewportMeta = Boolean(viewport);
  const isLikelyClientRendered =
    visibleText.length < 700 &&
    (/<div[^>]+id=["']root["']/i.test(html) ||
      /<script[^>]+type=["']module["']/i.test(html) ||
      /\/assets\/.+\.js/i.test(html) ||
      /__next|data-reactroot|vite/i.test(html));

  return {
    auditScope: isLikelyClientRendered ? "html_server_limited_client_rendered" : "html_server_content",
    title,
    description,
    canonical,
    hasViewportMeta,
    h1Count,
    h2Count,
    h1Texts,
    h2Texts,
    formCount,
    buttonCount,
    linkCount,
    imageCount,
    ctaTexts,
    hasContactSignal,
    hasTrustProofSignal,
    hasLocalSeoSignal,
    hasLegalTrustSignal,
    hasStructuredData,
    hasOpenGraph,
    imageWithoutAltCount,
    responseTimeMs: meta.responseTimeMs || 0,
    statusCode: meta.statusCode || 0,
    contentType: meta.contentType || "",
    htmlBytes: meta.htmlBytes || html.length,
    textLength: visibleText.length,
    isLikelyClientRendered,
    visibleText,
  };
}

type HtmlSignals = ReturnType<typeof extractHtmlSignals>;

function addUnique(items: string[], value: string) {
  if (!items.includes(value)) items.push(value);
}

function buildExpertAuditMetrics(signals: HtmlSignals) {
  const missingElements: string[] = [];
  const evidence: string[] = [];
  const limitations: string[] = [];

  let seo = 20;
  if (signals.title) {
    seo += signals.title.length >= 25 && signals.title.length <= 70 ? 18 : 10;
    evidence.push(`Title detecte : "${signals.title.slice(0, 90)}"`);
  } else {
    addUnique(missingElements, "Un title SEO clair avec activite, zone et benefice principal.");
  }

  if (signals.description) {
    seo += signals.description.length >= 70 && signals.description.length <= 170 ? 16 : 9;
    evidence.push(`Meta description detectee : "${signals.description.slice(0, 120)}"`);
  } else {
    addUnique(missingElements, "Une meta description orientee clic, promesse et preuve.");
  }

  if (signals.h1Count > 0) {
    seo += 14;
    evidence.push(`H1 detecte(s) : ${signals.h1Texts.slice(0, 2).join(" | ") || signals.h1Count}`);
  } else if (signals.isLikelyClientRendered) {
    addUnique(missingElements, "Un H1 visible dans le rendu et idealement expose clairement au HTML serveur.");
  } else {
    addUnique(missingElements, "Un H1 unique qui annonce clairement l'offre.");
  }

  if (signals.h2Count >= 2) seo += 8;
  else addUnique(missingElements, "Des H2 structures pour presenter problemes, solution, preuves, FAQ et action.");

  if (signals.canonical) seo += 6;
  else addUnique(missingElements, "Une URL canonique pour clarifier l'indexation Google.");

  if (signals.hasStructuredData) seo += 10;
  else addUnique(missingElements, "Des donnees structurees Schema.org pour aider Google a comprendre l'activite.");

  if (signals.hasOpenGraph) seo += 5;
  else addUnique(missingElements, "Des balises Open Graph propres pour les partages sociaux et la credibilite.");

  if (signals.imageCount > 0 && signals.imageWithoutAltCount === 0) seo += 9;
  if (signals.imageWithoutAltCount > 0) {
    addUnique(missingElements, `${signals.imageWithoutAltCount} image(s) sans alt descriptif pour l'accessibilite et le SEO.`);
  }

  let conversion = 18;
  if (signals.ctaTexts.length > 0) {
    conversion += 24;
    evidence.push(`CTA detecte(s) : ${signals.ctaTexts.slice(0, 4).join(" | ")}`);
  } else {
    addUnique(missingElements, "Un CTA principal visible et coherent avec l'objectif commercial.");
  }
  if (signals.formCount > 0 || signals.hasContactSignal) conversion += 18;
  else addUnique(missingElements, "Un chemin de contact simple : formulaire, telephone, WhatsApp ou prise de rendez-vous.");
  if (signals.visibleText.length >= 900) conversion += 10;
  else addUnique(missingElements, "Un contenu plus explicite sur le probleme client, la methode et le resultat attendu.");
  if (signals.h1Texts.length > 0 && signals.h2Texts.length > 1) conversion += 10;
  if (signals.hasTrustProofSignal) conversion += 10;
  else addUnique(missingElements, "Des preuves visibles : avis, cas clients, references, realisations ou garanties.");

  let trust = 18;
  if (signals.hasContactSignal) trust += 22;
  else addUnique(missingElements, "Des informations de contact rassurantes et faciles a trouver.");
  if (signals.hasTrustProofSignal) trust += 24;
  if (signals.hasLegalTrustSignal) trust += 12;
  else addUnique(missingElements, "Des signaux de confiance : mentions legales, politique de confidentialite ou informations entreprise.");
  if (signals.hasStructuredData) trust += 10;
  if (signals.hasOpenGraph) trust += 8;

  let performance = 45;
  if (signals.responseTimeMs && signals.responseTimeMs < 800) performance += 28;
  else if (signals.responseTimeMs && signals.responseTimeMs < 1800) performance += 18;
  else if (signals.responseTimeMs) {
    performance += 8;
    addUnique(missingElements, "Un temps de reponse serveur plus rapide pour limiter la friction avant lecture.");
  }
  if (signals.htmlBytes < 180000) performance += 12;
  else addUnique(missingElements, "Un HTML initial plus leger ou mieux optimise pour reduire le poids percu.");
  if (!signals.isLikelyClientRendered) performance += 8;
  else {
    limitations.push("Le site semble rendu cote client : l'audit automatique lit le HTML serveur et les signaux accessibles, pas un Lighthouse complet.");
  }

  let responsive = 35;
  if (signals.hasViewportMeta) responsive += 35;
  else addUnique(missingElements, "Une balise viewport mobile pour garantir une base responsive correcte.");
  if (signals.ctaTexts.length > 0) responsive += 10;
  if (signals.visibleText.length >= 500) responsive += 8;
  limitations.push("Le responsive et les Core Web Vitals doivent etre confirmes par un test navigateur/Lighthouse avant affirmation definitive.");

  if (signals.hasLocalSeoSignal) {
    seo += 6;
    evidence.push("Signal local detecte dans le contenu.");
  }

  if (signals.responseTimeMs) {
    evidence.push(`Reponse HTTP ${signals.statusCode || "OK"} en ${signals.responseTimeMs} ms, HTML lu : ${signals.htmlBytes} octets.`);
  }

  const categoryScores = {
    seo: clampScore(seo, 50),
    conversion: clampScore(conversion, 50),
    trust: clampScore(trust, 50),
    performance: clampScore(performance, 50),
    responsive: clampScore(responsive, 50),
  };
  const expertScore = clampScore(
    Math.round(
      categoryScores.seo * 0.22 +
        categoryScores.conversion * 0.28 +
        categoryScores.trust * 0.2 +
        categoryScores.performance * 0.15 +
        categoryScores.responsive * 0.15,
    ),
    55,
  );

  return {
    expertScore,
    categoryScores,
    missingElements: missingElements.slice(0, 8),
    evidence: evidence.slice(0, 5),
    limitations: limitations.slice(0, 3),
  };
}

function dedupeDiagnosticList(items: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const key = item
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/["'`]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 84);

    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function applyExpertMetrics(diagnosis: Diagnosis, metrics: ReturnType<typeof buildExpertAuditMetrics>): Diagnosis {
  const mergedEvidence = dedupeDiagnosticList(
    [...metrics.evidence, ...(diagnosis.evidence || [])].filter(Boolean),
    5,
  );
  const mergedLimitations = dedupeDiagnosticList(
    [...metrics.limitations, ...(diagnosis.audit_limitations || [])].filter(Boolean),
    3,
  );
  const mergedMissingElements = dedupeDiagnosticList(
    [...metrics.missingElements, ...(diagnosis.missing_elements || [])].filter(Boolean),
    8,
  );

  return {
    ...diagnosis,
    expert_score: metrics.expertScore,
    score_global: Math.max(1, Math.min(10, Math.round(metrics.expertScore / 10))),
    category_scores: metrics.categoryScores,
    missing_elements: mergedMissingElements,
    evidence: mergedEvidence,
    audit_limitations: mergedLimitations,
    expert_verdict:
      diagnosis.expert_verdict ||
      "Le site possede une base exploitable, mais il doit renforcer sa promesse, ses preuves et son parcours de conversion pour gagner en credibilite.",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    getRequiredEnvMap(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const);

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
Renseigne site_accessible=false, analysis_source="questionnaire_brief", audit_brief, expertise_angle, how_pixelrises_helps, manual_checks, evidence, conversion_brief, copy_angle, audit_limitations et confidence_level="medium".
Le rapport doit mettre en valeur l'expertise Pixelrises : stratégie, structure, copywriting, design, preuves, conversion et lancement.
Ne prétends jamais avoir audité une URL si aucune URL n'a été analysée. Dans evidence, cite seulement les réponses du questionnaire.

Réponds en respectant cette structure :
${DIAGNOSIS_JSON_SCHEMA}`);

      if (!diagnosis) {
        return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
      }

      return jsonResponse({ diagnosis: enforceBudgetRecommendation(diagnosis, budget) });
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
    let responseTimeMs = 0;
    let statusCode = 0;
    let contentType = "";
    try {
      const fetchStartedAt = Date.now();
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Pixelrises-Analyzer/1.0 (+https://pixelrises.fr)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      responseTimeMs = Date.now() - fetchStartedAt;
      statusCode = response.status;
      contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        return jsonResponse(
          { error: "Le site n'a pas pu être lu correctement. Aucun diagnostic automatique n'a été généré." },
          422,
        );
      }

      htmlContent = await response.text();
      htmlContent = htmlContent.substring(0, 8000);
      const preliminarySignals = extractHtmlSignals(htmlContent, {
        responseTimeMs,
        statusCode,
        contentType,
        htmlBytes: htmlContent.length,
      });
      if (
        preliminarySignals.visibleText.length < 80 &&
        !preliminarySignals.title &&
        !preliminarySignals.description &&
        !preliminarySignals.isLikelyClientRendered
      ) {
        return jsonResponse(
          { error: "Le site ne fournit pas assez de contenu lisible pour un diagnostic fiable. Aucun rapport n'a été simulé." },
          422,
        );
      }
    } catch {
      return jsonResponse(
        { error: "L'analyse réelle du site a été interrompue ou bloquée. Aucun rapport automatique n'a été généré." },
        422,
      );
    }

    const htmlSignals = extractHtmlSignals(htmlContent, {
      responseTimeMs,
      statusCode,
      contentType,
      htmlBytes: htmlContent.length,
    });
    const expertMetrics = buildExpertAuditMetrics(htmlSignals);

    const diagnosis = await generateStructuredDiagnosis(`Tu es un consultant digital senior de Pixelrises, une agence web premium orientée conversion.

Le prospect possède déjà un site web à analyser.
Objectif principal : ${objectif || "non précisé"}
Budget : ${budget || "non précisé"}
Réponse à la question "avez-vous déjà un site" : ${hasSite || "non précisé"}

Analyse vraiment le HTML fourni et les signaux extraits. Tu dois agir comme un audit consultant, pas comme un générateur de texte.
Identifie les vrais problèmes de clarté, crédibilité, hiérarchie, réassurance, conversion, SEO local, copywriting, performance observable, responsive et orientation business.
Chaque problème doit être relié à une observation concrète issue des signaux fournis : title, meta description, H1/H2, CTA, formulaires, liens, images sans alt ou texte visible.
Tu dois produire une note expert sur 100, des notes par domaine (seo, conversion, trust, performance, responsive) et une liste "missing_elements" avec les éléments manquants pour se rapprocher d'un site optimisé, crédible, visible sur Google et capable de convertir.
Les scores automatiques ci-dessous sont la base de vérité : tu peux les expliquer, mais pas les contredire ni inventer de mesure Lighthouse/Core Web Vitals.
Si auditScope vaut "html_server_limited_client_rendered", explique clairement que l'audit vérifie le HTML serveur et les signaux accessibles sans navigateur rendu. Ne conclus pas que la page rendue n'a aucun CTA ou aucun H1 : formule plutôt "le HTML serveur ne les expose pas clairement, à confirmer sur le rendu visuel".
Rédige un brief copywriting exploitable : message à clarifier, preuve à ajouter, CTA à renforcer, ordre des sections à corriger.
Sois honnête, utile et concret. Pas de phrases génériques, pas de promesse inventée, pas de faux avis, pas de fausses statistiques.
Adapte la recommandation à l'objectif et au budget.

Site analysé : ${parsedUrl.hostname}

Scores et manques calculés automatiquement :
${JSON.stringify(expertMetrics, null, 2)}

Signaux techniques extraits :
${JSON.stringify(htmlSignals, null, 2)}

HTML brut limite :
${htmlContent.slice(0, 4500)}

Renseigne site_accessible=true, analysis_source="live_url_audit", tested_url="${parsedUrl.toString()}", expert_score, category_scores, missing_elements, expert_verdict, audit_brief, expertise_angle, how_pixelrises_helps, manual_checks, evidence, conversion_brief, copy_angle, audit_limitations et confidence_level.
Le rapport doit expliquer les soucis réels du site, comment les corriger, quelle logique de copy appliquer, et pourquoi l'expertise Pixelrises aide à transformer le site en outil de confiance et conversion.
Dans evidence, cite 3 à 5 signaux observés précisément. Dans audit_limitations, indique sobrement le périmètre vérifié si le rendu client n'est pas visible depuis le HTML serveur.

Réponds en respectant cette structure :
${DIAGNOSIS_JSON_SCHEMA}`);

    if (!diagnosis) {
      return jsonResponse({ error: "Le diagnostic n'a pas pu être structuré correctement." }, 502);
    }

    const diagnosisWithMetrics = applyExpertMetrics(diagnosis, expertMetrics);
    return jsonResponse({ diagnosis: enforceBudgetRecommendation(diagnosisWithMetrics, budget) });
  } catch (error) {
    console.error("analyze-url error:", redactLogValue(error));

    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return jsonResponse({ error: "Service temporairement surchargé. Réessayez dans quelques instants." }, 429);
    }

    return jsonResponse({ error: "Une erreur interne est survenue. Veuillez réessayer." }, 500);
  }
});
