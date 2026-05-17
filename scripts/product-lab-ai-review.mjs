#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { filterActionableProductLabProposals } from "./product-lab-governance.mjs";
import { classifyProductLabDomain, productLabProposalDomains, redactSecrets } from "./product-lab-core.mjs";

loadEnv({ path: path.join(process.cwd(), ".env.local"), override: false, quiet: true });
loadEnv({ path: path.join(process.cwd(), ".env"), override: false, quiet: true });

const queuePath = path.join(process.cwd(), "public", "product-lab-review.json");
const smokePath = path.join(process.cwd(), "tmp", "generator-smoke-last.json");
const statePath = path.join(process.cwd(), "product-lab", "state", "last-run-summary.json");

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value) => normalize(value).replace(/\s+/g, "-") || "item";

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
};

const getGatewayAuthDiagnostics = () => {
  const sources = [
    ["AI_GATEWAY_API_KEY", process.env.AI_GATEWAY_API_KEY],
    ["API_GATEWAY_VERCEL", process.env.API_GATEWAY_VERCEL],
    ["VERCEL_AI_GATEWAY_API_KEY", process.env.VERCEL_AI_GATEWAY_API_KEY],
    ["VERCEL_OIDC_TOKEN", process.env.VERCEL_OIDC_TOKEN],
  ]
    .filter(([, value]) => Boolean(String(value ?? "").trim()))
    .map(([name]) => name);

  return {
    configured: sources.length > 0,
    source: sources[0] || "missing",
    sources,
    usesOidc: sources.includes("VERCEL_OIDC_TOKEN"),
    usesStaticKey: sources.some((source) => source !== "VERCEL_OIDC_TOKEN"),
  };
};

const publicAiReviewModelLabel = "Pixelrises AI Gateway";

const classifyAiReviewFailure = (error) => {
  const rawMessage = redactSecrets(error instanceof Error ? error.message : String(error ?? ""));
  const normalized = normalize(rawMessage);
  if (
    normalized.includes("credit") ||
    normalized.includes("payment") ||
    normalized.includes("billing") ||
    normalized.includes("top up") ||
    normalized.includes("402")
  ) {
    return {
      status: "credits_required",
      message: "Analyse IA indisponible pour ce run: credits ou acces AI Gateway a verifier.",
      action: "Ajouter des credits AI Gateway ou verifier que le projet Vercel v2 a acces au modele choisi.",
    };
  }
  if (
    normalized.includes("auth") ||
    normalized.includes("unauthorized") ||
    normalized.includes("invalid api key") ||
    normalized.includes("401")
  ) {
    return {
      status: "auth_required",
      message: "Analyse IA indisponible pour ce run: authentification AI Gateway a verifier.",
      action:
        "Verifier le secret AI_GATEWAY_API_KEY ou API_GATEWAY_VERCEL dans l'environnement GitHub Actions v2.",
    };
  }
  if (normalized.includes("rate") || normalized.includes("quota") || normalized.includes("limit")) {
    return {
      status: "rate_limited",
      message: "Analyse IA indisponible pour ce run: limite AI Gateway atteinte.",
      action: "Augmenter le budget/limite AI Gateway ou relancer plus tard.",
    };
  }
  if (normalized.includes("model") || normalized.includes("not found") || normalized.includes("404")) {
    return {
      status: "model_unavailable",
      message: "Analyse IA indisponible pour ce run: modele AI Gateway a verifier.",
      action: "Verifier PRODUCT_LAB_AI_MODEL dans GitHub Actions ou choisir un modele disponible dans Vercel AI Gateway.",
    };
  }
  return {
    status: "failed",
    message: "Analyse IA indisponible pour ce run. Le Product Lab conserve les propositions locales securisees.",
    action: "Consulter le rapport du run sans exposer de secret, puis relancer apres correction.",
  };
};

const extractJsonArray = (text) => {
  const cleaned = String(text ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const compactSmokeReport = () => {
  const report = readJson(smokePath, null);
  if (!report) return null;
  const cases = Array.isArray(report.results) ? report.results : Array.isArray(report.cases) ? report.cases : [];
  return {
    status: report.status || report.ok || "unknown",
    passed: cases.filter((item) => item?.ok || item?.status === "passed").length,
    failed: cases.filter((item) => item?.ok === false || item?.status === "failed").length,
    sampleFailures: cases
      .filter((item) => item?.ok === false || item?.status === "failed")
      .slice(0, 4)
      .map((item) => ({
        id: item.id || item.slug || item.name || "case",
        reason: redactSecrets(item.error || item.reason || item.message || "failed"),
      })),
  };
};

const buildPrompt = (queue, summary, smoke) => `
Tu es le Product Lab de Pixelrises V2.

Objectif fondateur:
- transformer une idee en projet concret;
- garder une UX premium noir/or, simple pour debutants et puissante pour avances;
- ameliorer Site Builder, Game Builder, Agent Builder, AI Spaces, credits, integrations, analytics;
- ne jamais proposer d'action sensible automatique;
- ignorer totalement la V1.

Contexte du dernier run:
${JSON.stringify(
  {
    sourceRun: queue.sourceRun,
    summary: queue.summary,
    currentProposals: queue.items?.map((item) => ({
      title: item.title,
      module: item.module,
      description: item.description,
      concernedFiles: item.concernedFiles,
    })),
    lastRun: summary,
    generatorSmoke: smoke,
  },
  null,
  2,
)}

Genere jusqu'a 8 propositions d'amelioration V2 vraiment actionnables.
Contraintes:
- pas de phrase vague;
- pas de refonte globale;
- pas de Stripe/auth/RLS/live deploy sans validation humaine;
- chaque proposition doit avoir un module, un impact, un risque, un avant, un apres, et des fichiers probables;
- chaque proposition doit avoir un domain parmi: marketing, systeme, seo, generateur, ia;
- si le smoke donne un vrai signal, priorise ce signal;
- reponds uniquement en JSON valide.

Schema attendu:
[
  {
    "title": "Titre concret",
    "domain": "marketing|systeme|seo|generateur|ia",
    "module": "Site Builder|Product Lab|AI Spaces|Game Builder|Agent Builder|Dashboard|Code Health|Analytics|Integrations / Templates|Multi-IA / Systeme|Product Vision",
    "description": "Action precise et testable",
    "priority": "Critique|Important|Amelioration",
    "impact": "Eleve|Moyen|Faible",
    "risk": "Faible|Moyen|Eleve",
    "difficulty": "Faible|Moyenne|Elevee",
    "inspiration": "Lovable / v0 / Linear / Vercel / Supabase / Stripe",
    "beforeState": "Etat actuel",
    "afterState": "Etat attendu",
    "concernedFiles": ["src/..."]
  }
]
`;

const normalizeAIItem = (item, index, queue) => {
  const title = typeof item?.title === "string" ? item.title.trim() : "";
  const module = typeof item?.module === "string" ? item.module.trim() : "Product Lab";
  const description = typeof item?.description === "string" ? item.description.trim() : "";
  if (!title || !description) return null;
  const requestedDomain = normalize(item?.domain);
  const domain =
    productLabProposalDomains.includes(requestedDomain)
      ? requestedDomain
      : classifyProductLabDomain({ ...item, module, title, description });

  const runId = queue?.sourceRun?.runId || [queue?.sourceRun?.date, queue?.sourceRun?.theme].filter(Boolean).join("-");
  return {
    id: `${slugify(runId)}-ai-${index + 1}-${slugify(module)}-${slugify(title)}`,
    title,
    module,
    domain,
    simpleSummary: `${module}: ${description}`,
    priority: ["Critique", "Important", "Amelioration"].includes(item.priority) ? item.priority : "Important",
    impact: ["Eleve", "Moyen", "Faible"].includes(item.impact) ? item.impact : "Eleve",
    risk: ["Faible", "Moyen", "Eleve"].includes(item.risk) ? item.risk : "Faible",
    difficulty: ["Faible", "Moyenne", "Elevee"].includes(item.difficulty) ? item.difficulty : "Moyenne",
    status: "Propose par IA Product Lab",
    inspiration: typeof item.inspiration === "string" ? item.inspiration : "Pixelrises Product Lab / Vercel",
    decision: "human_validation",
    description,
    scoreImpact: item.impact === "Eleve" ? 30 : item.impact === "Moyen" ? 18 : 10,
    sourceReport: queue?.sourceRun?.reportPath || "reports/product-lab/daily/",
    automationPolicy:
      "Validation humaine requise. Product Lab peut proposer, mais ne doit pas appliquer sans decision admin.",
    concernedFiles: Array.isArray(item.concernedFiles)
      ? item.concernedFiles.filter((file) => typeof file === "string").slice(0, 6)
      : [],
    beforeState: typeof item.beforeState === "string" ? item.beforeState : "A verifier dans le dernier run Product Lab.",
    afterState: typeof item.afterState === "string" ? item.afterState : "Amelioration visible et testable apres validation.",
    dataState: "real",
  };
};

const annotateQueue = (queue, aiReview) => ({
  ...queue,
  summary: {
    ...queue.summary,
    aiReview,
  },
});

const printDiagnostics = () => {
  const aiReviewEnabled = process.env.PRODUCT_LAB_AI_REVIEW !== "0";
  const model = process.env.PRODUCT_LAB_AI_MODEL || "openai/gpt-5.4";
  const diagnostics = getGatewayAuthDiagnostics();
  const safeModelLabel = model.includes("/") ? model : "invalid-model-format";

  console.log(
    [
      "Product Lab AI Gateway diagnostics:",
      `enabled=${aiReviewEnabled ? "yes" : "no"}`,
      `configured=${diagnostics.configured ? "yes" : "no"}`,
      `source=${diagnostics.source}`,
      `oidc_present=${diagnostics.usesOidc ? "yes" : "no"}`,
      `static_key_present=${diagnostics.usesStaticKey ? "yes" : "no"}`,
      `model=${safeModelLabel}`,
    ].join(" "),
  );

  if (!aiReviewEnabled) {
    console.log("Product Lab AI review is disabled by PRODUCT_LAB_AI_REVIEW=0.");
    return;
  }

  if (!diagnostics.configured) {
    console.log("Product Lab AI review is not configured yet: add AI_GATEWAY_API_KEY or API_GATEWAY_VERCEL.");
    return;
  }

  if (!model.includes("/")) {
    console.log("Product Lab AI model format should be provider/model, for example openai/gpt-5.4.");
    return;
  }

  console.log("Product Lab AI review configuration is present. This diagnostic does not spend AI credits.");
};

const main = async () => {
  const queue = readJson(queuePath, null);
  if (!queue || !Array.isArray(queue.items)) {
    throw new Error("Product Lab AI review failed: public/product-lab-review.json missing or invalid.");
  }

  const aiReviewEnabled = process.env.PRODUCT_LAB_AI_REVIEW !== "0";
  const requireAI = process.env.PRODUCT_LAB_REQUIRE_AI_REVIEW === "true";
  const model = process.env.PRODUCT_LAB_AI_MODEL || "openai/gpt-5.4";
  const gatewayDiagnostics = getGatewayAuthDiagnostics();
  const hasGatewayKey = gatewayDiagnostics.configured;

  if (!aiReviewEnabled || !hasGatewayKey) {
    writeJson(
      queuePath,
      annotateQueue(queue, {
        status: aiReviewEnabled ? "skipped_missing_gateway" : "disabled",
        model: publicAiReviewModelLabel,
        authSource: gatewayDiagnostics.source,
        action: aiReviewEnabled
          ? "Ajouter AI_GATEWAY_API_KEY ou API_GATEWAY_VERCEL dans GitHub Actions environnement v2."
          : "Reactiver PRODUCT_LAB_AI_REVIEW si tu veux l'analyse IA enrichie.",
        generated: 0,
        generatedAt: new Date().toISOString(),
      }),
    );
    console.log(
      `Product Lab AI review ${aiReviewEnabled ? "skipped: missing AI Gateway configuration" : "disabled"}.`,
    );
    if (requireAI) process.exit(1);
    return;
  }

  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      process.env.AI_GATEWAY_API_KEY =
        process.env.API_GATEWAY_VERCEL || process.env.VERCEL_AI_GATEWAY_API_KEY || "";
    }

    const { generateText } = await import("ai");
    const summary = readJson(statePath, {});
    const smoke = compactSmokeReport();
    const result = await generateText({
      model,
      prompt: buildPrompt(queue, summary, smoke),
      maxOutputTokens: 1800,
      providerOptions: {
        gateway: {
          cacheControl: "max-age=0",
          tags: ["feature:product-lab", "scope:v2"],
        },
      },
    });
    const parsedItems = extractJsonArray(result.text);
    const aiItems = filterActionableProductLabProposals(
      parsedItems.map((item, index) => normalizeAIItem(item, index, queue)).filter(Boolean),
    );

    if (!aiItems.length) {
      writeJson(
        queuePath,
        annotateQueue(queue, {
          status: "empty",
          model: publicAiReviewModelLabel,
          authSource: gatewayDiagnostics.source,
          action: "Relancer le Product Lab; si cela se repete, verifier le prompt et les signaux QA disponibles.",
          generated: 0,
          generatedAt: new Date().toISOString(),
        }),
      );
      console.log("Product Lab AI review returned no actionable proposal.");
      if (requireAI) process.exit(1);
      return;
    }

    const maxItems = Number.parseInt(process.env.PRODUCT_LAB_MAX_REVIEW_ITEMS || "8", 10);
    const existing = queue.items.filter(
      (item) => !aiItems.some((aiItem) => normalize(aiItem.module) === normalize(item.module) && normalize(aiItem.title) === normalize(item.title)),
    );
    const items = [...aiItems, ...existing].slice(0, Number.isFinite(maxItems) && maxItems > 0 ? maxItems : 8);
    const updatedQueue = annotateQueue(
      {
        ...queue,
        generatedAt: new Date().toISOString(),
        summary: {
          ...queue.summary,
          total: items.length,
          actionableTotal: items.length,
          dailySummary: `Analyse IA Product Lab: ${items.length} proposition(s) V2 actionnable(s) a trancher.`,
        },
        items,
      },
      {
        status: "generated",
        model: publicAiReviewModelLabel,
        authSource: gatewayDiagnostics.source,
        generated: aiItems.length,
        generatedAt: new Date().toISOString(),
        usage: result.usage
          ? {
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
              totalTokens: result.usage.totalTokens,
            }
          : undefined,
      },
    );

    writeJson(queuePath, updatedQueue);
    console.log(`Product Lab AI review complete: ${aiItems.length} AI proposal(s) generated.`);
  } catch (error) {
    const failure = classifyAiReviewFailure(error);
    writeJson(
      queuePath,
      annotateQueue(queue, {
        status: failure.status,
        model: publicAiReviewModelLabel,
        authSource: gatewayDiagnostics.source,
        generated: 0,
        generatedAt: new Date().toISOString(),
        error: failure.message,
        action: failure.action,
      }),
    );
    console.warn(`Product Lab AI review failed safely: ${failure.message}`);
    if (requireAI) process.exit(1);
  }
};

if (process.argv[2] === "diagnose") {
  printDiagnostics();
  process.exit(0);
}

main().catch((error) => {
  console.error(`Product Lab AI review crashed safely: ${redactSecrets(error instanceof Error ? error.message : String(error))}`);
  process.exit(process.env.PRODUCT_LAB_REQUIRE_AI_REVIEW === "true" ? 1 : 0);
});
