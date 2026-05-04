import { scoringMetrics } from "./generator-quality-cases.mjs";

const GENERIC_PHRASES = [
  "boostez votre activite",
  "une presence web moderne",
  "solution adaptee",
  "site professionnel pour votre activite",
  "nous vous accompagnons",
  "votre partenaire de confiance",
  "des solutions sur mesure",
  "presence premium",
  "image de marque",
  "obtenir plus de clients",
];

const REQUIRED_GENERATOR_GUARDS = [
  {
    id: "user-vision",
    label: "UserVision prioritaire",
    patterns: ["type UserVision =", "buildUserVision(", "applyUserVisionToProfile", "assertUserVisionRespected"],
    recommendation: "Renforcer UserVision si un champ explicite du brief ne pilote pas le prompt final.",
  },
  {
    id: "prompt-enhancer",
    label: "Prompt Enhancer Pixelrises",
    patterns: ["buildUserVisionPromptBlock", "buildSiteSpecificityMatrix", "MATRICE ANTI-TEMPLATE PIXELRISES"],
    recommendation: "Injecter systematiquement la couche business/conversion/SEO/design dans le prompt Gemini.",
  },
  {
    id: "cta-lock",
    label: "CTA coherent et verrouille",
    patterns: ["resolveVisionLockedCta", "shouldReplaceGeneratedCta", "isVehicleBookingCta"],
    recommendation: "Bloquer les CTA metier incoherents avant sauvegarde.",
  },
  {
    id: "quality-gate",
    label: "Quality gate severe",
    patterns: ["assertGeneratedContentQuality", "Strict quality gate still failed", "controlled Gemini regeneration"],
    recommendation: "Refuser les sorties techniquement valides mais trop generiques.",
  },
  {
    id: "no-fallback-final",
    label: "Pas de faux fallback final",
    patterns: ["buildEmergencySafeFallback", "Strict quality gate still failed after repair and controlled regeneration."],
    recommendation: "Ne jamais presenter un fallback generique comme une vraie generation.",
  },
  {
    id: "preview-safe",
    label: "Preview client-safe",
    patterns: ["safeSectionOrder", "designArchetype", "primaryContactHref"],
    recommendation: "Conserver les fallbacks preview et bloquer prompt/debug/analyse interne.",
  },
  {
    id: "prompt-simulation",
    label: "Simulation prompt sans credits",
    patterns: ["debugPromptOnly", "buildPromptSimulationPayload", "Mode diagnostic indisponible"],
    recommendation: "Maintenir un mode diagnostic local qui ne sauvegarde rien et ne debite rien.",
  },
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const includesLoose = (haystack, needle) => normalize(haystack).includes(normalize(needle));

const countHits = (haystack, values) => values.filter((value) => includesLoose(haystack, value)).length;

const scoreFromRatio = (hits, total) => {
  if (!total) return 10;
  return Math.max(0, Math.min(10, Math.round((hits / total) * 10)));
};

const sourceContainsAll = (source, patterns) => patterns.every((pattern) => source.includes(pattern));

const buildSimulatedPrompt = (testCase) => {
  return [
    "Brief original utilisateur:",
    testCase.prompt,
    "UserVision:",
    `niche=${testCase.expectedNiche}`,
    `ville=${testCase.expectedCity}`,
    `objectif=${testCase.expectedGoal}`,
    `style=${testCase.expectedStyle.join(", ")}`,
    `couleurs=${testCase.expectedColors.join(", ") || "auto"}`,
    `cta=${testCase.expectedCta.join(" | ")}`,
    "Couche Pixelrises:",
    "business, conversion, SEO local, direction design, CTA, structure, regles anti-generique, JSON strict",
    "Chaque section doit comprendre, rassurer, convaincre ou faire passer a l'action.",
  ].join("\n");
};

export const analyzeSourceHealth = (sources) => {
  const generator = sources.generateSite || "";
  const preview = sources.preview || "";
  const aiPage = sources.aiPage || "";
  const smoke = sources.smoke || "";
  const tests = sources.generatorTests || "";
  const allSource = [generator, preview, aiPage, smoke, tests].join("\n");

  const guardResults = REQUIRED_GENERATOR_GUARDS.map((guard) => {
    const hits = guard.patterns.filter((pattern) => allSource.includes(pattern));
    return {
      ...guard,
      score: scoreFromRatio(hits.length, guard.patterns.length),
      hits,
      missing: guard.patterns.filter((pattern) => !hits.includes(pattern)),
      ok: hits.length === guard.patterns.length,
    };
  });

  const genericGateHits = GENERIC_PHRASES.filter((phrase) => includesLoose(generator, phrase));
  const smokeHasRealCalls = /fetch\(endpoint|smoke-generate-site/i.test(smoke);
  const hasGithubDangerCommands = /\bgit\s+(push|reset\s+--hard|checkout\s+--|clean\s+-fd)|vercel\s+--prod|supabase\s+functions\s+deploy/i.test(
    allSource,
  );

  const findings = [];
  for (const guard of guardResults) {
    if (!guard.ok) {
      findings.push({
        severity: guard.score <= 5 ? "P1" : "P2",
        title: `${guard.label} incomplet`,
        file: "supabase/functions/generate-site/index.ts",
        problem: `Elements manquants: ${guard.missing.join(", ")}`,
        recommendation: guard.recommendation,
      });
    }
  }

  if (genericGateHits.length < 5) {
    findings.push({
      severity: "P1",
      title: "Anti-generique trop faible",
      file: "supabase/functions/generate-site/index.ts",
      problem: "Moins de 5 phrases generiques sont explicitement traquees.",
      recommendation: "Ajouter les phrases faibles au prompt et au quality gate.",
    });
  }

  if (!smokeHasRealCalls) {
    findings.push({
      severity: "P2",
      title: "Smoke reel absent",
      file: "scripts/smoke-generate-site.mjs",
      problem: "Le smoke reel n'est pas detecte.",
      recommendation: "Garder un smoke manuel, jamais lance par le nightly sans budget explicite.",
    });
  }

  if (hasGithubDangerCommands) {
    findings.push({
      severity: "P0",
      title: "Commande dangereuse detectee",
      file: "scripts/",
      problem: "Une commande de push/reset/deploy est presente dans les scripts audites.",
      recommendation: "Retirer toute mutation prod automatique de l'automatisation nightly.",
    });
  }

  return {
    guardResults,
    genericGateHits,
    findings,
    score: Math.round(
      guardResults.reduce((sum, guard) => sum + guard.score, 0) / Math.max(1, guardResults.length),
    ),
  };
};

export const scoreQualityCase = (testCase, sources) => {
  const generator = sources.generateSite || "";
  const preview = sources.preview || "";
  const aiPage = sources.aiPage || "";
  const smoke = sources.smoke || "";
  const tests = sources.generatorTests || "";
  const allSource = [generator, preview, aiPage, smoke, tests].join("\n");
  const simulatedPrompt = buildSimulatedPrompt(testCase);

  const requiredHits = countHits(simulatedPrompt, testCase.requiredSignals);
  const styleHits = countHits(simulatedPrompt, testCase.expectedStyle);
  const colorHits = countHits(simulatedPrompt, testCase.expectedColors);
  const ctaHits = countHits([simulatedPrompt, allSource].join("\n"), testCase.expectedCta);
  const hasCtaGuards = allSource.includes("resolveVisionLockedCta") && allSource.includes("shouldReplaceGeneratedCta");
  const archetypeHits = countHits(allSource, testCase.recommendedArchetypes);
  const genericHitsInGuards = GENERIC_PHRASES.filter((phrase) => includesLoose(generator, phrase)).length;

  const metricScores = {
    respectBrief: scoreFromRatio(requiredHits, testCase.requiredSignals.length),
    respectVision: Math.min(
      10,
      Math.round(
        (scoreFromRatio(styleHits, testCase.expectedStyle.length) +
          scoreFromRatio(colorHits, testCase.expectedColors.length) +
          (allSource.includes("assertUserVisionRespected") ? 10 : 4)) /
          3,
      ),
    ),
    heroQuality:
      allSource.includes("isDirectoryStyleHeroTitle") && allSource.includes("hero")
        ? 9
        : allSource.includes("hero")
          ? 6
          : 3,
    ctaCoherence: ctaHits >= 1 && hasCtaGuards ? 10 : ctaHits >= 1 ? 7 : 4,
    designVariety: Math.max(5, Math.min(10, archetypeHits + (allSource.includes("CREATIVE_LAYOUT_RECIPES") ? 4 : 0))),
    structureFit:
      allSource.includes("sectionOrder") && allSource.includes("strategy.prioritySections")
        ? 9
        : allSource.includes("sectionOrder")
          ? 7
          : 3,
    localSeo:
      allSource.includes("local_seo") || allSource.includes("localSeo")
        ? testCase.expectedCity
          ? 9
          : 8
        : 4,
    faqUsefulness:
      allSource.includes("faqItems") && /objection|FAQ|faq/i.test(allSource)
        ? 8
        : allSource.includes("faqItems")
          ? 6
          : 3,
    antiGeneric:
      genericHitsInGuards >= 7 && allSource.includes("Too many generic phrases")
        ? 9
        : genericHitsInGuards >= 5
          ? 8
          : 5,
    globalV1Quality: 0,
  };

  const baseAverage =
    scoringMetrics
      .filter((metric) => metric !== "globalV1Quality")
      .reduce((sum, metric) => sum + metricScores[metric], 0) /
    (scoringMetrics.length - 1);
  metricScores.globalV1Quality = Math.round(baseAverage);

  const total = scoringMetrics.reduce((sum, metric) => sum + metricScores[metric], 0);
  const issues = [];

  if (requiredHits < testCase.requiredSignals.length) {
    issues.push({
      severity: "P1",
      problem: "La simulation ne couvre pas tous les signaux du brief.",
      recommendation: `Verifier l'injection de: ${testCase.requiredSignals
        .filter((signal) => !includesLoose(simulatedPrompt, signal))
        .join(", ")}`,
    });
  }

  if (ctaHits === 0 || !hasCtaGuards) {
    issues.push({
      severity: "P1",
      problem: "Risque de CTA incoherent ou trop proche d'un autre metier.",
      recommendation: "Durcir resolveVisionLockedCta et shouldReplaceGeneratedCta pour cette niche.",
    });
  }

  if (archetypeHits === 0) {
    issues.push({
      severity: "P2",
      problem: "Aucun archetype recommande n'est clairement detecte dans le generateur.",
      recommendation: `Ajouter ou mapper: ${testCase.recommendedArchetypes.join(", ")}`,
    });
  }

  return {
    id: testCase.id,
    label: testCase.label,
    prompt: testCase.prompt,
    simulatedPrompt,
    score: total,
    metricScores,
    threshold: 75,
    passed: total >= 75,
    issues,
  };
};
