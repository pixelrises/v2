import fs from "node:fs";
import path from "node:path";

const loadEnvFile = (relativePath) => {
  const envPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(envPath)) return;

  const rawEnv = fs.readFileSync(envPath, "utf8");
  for (const line of rawEnv.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const supabaseUrl =
  process.env.SUPABASE_FUNCTIONS_URL?.trim() ||
  `${requiredEnv("VITE_SUPABASE_URL").replace(/\/$/, "")}/functions/v1`;
const publishableKey = requiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
const realQaEnabled = process.env.PIXELRISES_GENERATOR_REAL_QA === "1";
const dailyRealBudget = Math.max(
  0,
  Math.min(8, Number.parseInt(process.env.PIXELRISES_GENERATOR_DAILY_REAL_BUDGET || "0", 10) || 0),
);

const cases = [
  {
    id: "restaurant-paris",
    city: "Paris",
    expectedNiche: "restaurant",
    objectiveHint: "prendre-rendez-vous",
    form: {
      businessName: "Maison Rivoli",
      businessType: "Restaurant",
      city: "Paris",
      targetAudience: "Couples, actifs et visiteurs qui veulent r\u00e9server une table \u00e9l\u00e9gante sans perdre de temps",
      services: "R\u00e9servation de table, menu du soir, d\u00e9jeuner d'affaires, \u00e9v\u00e9nements priv\u00e9s",
      objective: "Prendre des r\u00e9servations",
      positioning: "Professionnel",
      style: "\u00c9l\u00e9gant",
      colors: "Noir profond, cr\u00e8me, dor\u00e9 discret",
      cta: "R\u00e9server une table",
      description: "Restaurant parisien \u00e9l\u00e9gant avec cuisine maison, service soign\u00e9 et r\u00e9servation simple en ligne.",
    },
  },
  {
    id: "coach-lyon",
    city: "Lyon",
    expectedNiche: "coach",
    objectiveHint: "prendre-rendez-vous",
    form: {
      businessName: "Pulse Coaching Lyon",
      businessType: "Coach sportif",
      city: "Lyon",
      targetAudience: "Adultes actifs qui veulent retrouver de l'\u00e9nergie, perdre du poids et garder un cadre motivant",
      services: "Coaching individuel, bilan forme, suivi nutrition, programme transformation",
      objective: "Prendre rendez-vous",
      positioning: "Premium",
      style: "Dynamique",
      colors: "Bleu \u00e9lectrique, graphite, blanc",
      cta: "R\u00e9server un bilan",
      description: "Coaching sportif premium \u00e0 Lyon avec m\u00e9thode claire, suivi r\u00e9gulier et rendez-vous faciles \u00e0 planifier.",
    },
  },
  {
    id: "immobilier-marseille",
    city: "Marseille",
    expectedNiche: "immobilier",
    objectiveHint: "renforcer-credibilite",
    form: {
      businessName: "Azur Patrimoine",
      businessType: "Agence immobili\u00e8re",
      city: "Marseille",
      targetAudience: "Propri\u00e9taires et acheteurs qui veulent une agence fiable pour vendre ou trouver un bien sereinement",
      services: "Estimation, vente de biens, mandat, accompagnement acheteur, valorisation immobili\u00e8re",
      objective: "Renforcer la cr\u00e9dibilit\u00e9",
      positioning: "Premium",
      style: "Premium",
      colors: "Bleu nuit, ivoire, dor\u00e9",
      cta: "Demander une estimation",
      description: "Agence immobili\u00e8re premium \u00e0 Marseille, sp\u00e9cialis\u00e9e dans l'estimation claire et l'accompagnement rassurant.",
    },
  },
  {
    id: "service-local-lille",
    city: "Lille",
    expectedNiche: "local-services",
    objectiveHint: "attirer-clients",
    form: {
      businessName: "Lille Habitat Service",
      businessType: "Service local",
      city: "Lille",
      targetAudience: "Particuliers et petites entreprises qui veulent une intervention fiable, rapide et expliqu\u00e9e clairement",
      services: "D\u00e9pannage, entretien, diagnostic, devis, intervention \u00e0 domicile",
      objective: "Attirer des clients",
      positioning: "Professionnel",
      style: "Moderne",
      colors: "Orange, anthracite, blanc",
      cta: "Demander un devis",
      description: "Service local \u00e0 Lille avec intervention rapide, devis clair et priorit\u00e9 \u00e0 la confiance client.",
    },
  },
  {
    id: "location-voiture-paris",
    city: "Paris",
    expectedNiche: "car-rental",
    objectiveHint: "vendre-plus",
    form: {
      businessName: "Drive Paris Club",
      businessType: "Location de voiture",
      city: "Paris",
      targetAudience: "Voyageurs, professionnels et habitants qui veulent r\u00e9server une voiture rapidement sans agence compliqu\u00e9e",
      services: "Location courte dur\u00e9e, r\u00e9servation en ligne, remise des cl\u00e9s, v\u00e9hicules citadins, assistance",
      objective: "Vendre plus",
      positioning: "Accessible",
      style: "Moderne",
      colors: "Noir, jaune, blanc",
      cta: "R\u00e9server une voiture",
      description: "Location de voiture \u00e0 Paris avec r\u00e9servation rapide, v\u00e9hicules disponibles et parcours simple sur mobile.",
    },
  },
  {
    id: "photographe-paris-social",
    city: "Paris",
    expectedNiche: "creative-services",
    objectiveHint: "prendre-rendez-vous",
    form: {
      businessName: "Studio Flash Paris",
      businessType: "Photographe",
      city: "Paris",
      targetAudience: "Jeunes entrepreneurs, createurs TikTok et particuliers qui veulent des photos modernes sans seance trop rigide",
      services: "Shooting portrait, mini-session lifestyle, contenu TikTok/Instagram, retouche naturelle, galerie privee",
      objective: "Prendre rendez-vous",
      positioning: "Professionnel",
      style: "Tres moderne, jeune, TikTok, social, dynamique",
      colors: "Rose, violet, noir",
      cta: "Reserver une seance sur WhatsApp",
      description:
        "Je veux un site pour un photographe a Paris, style rose/violet/noir, tres moderne, jeune, TikTok, avec bouton WhatsApp visible. Le site doit vendre des seances photo et montrer un univers creatif, pas une agence web ni un bureau corporate.",
    },
  },
  {
    id: "beaute-bordeaux",
    city: "Bordeaux",
    expectedNiche: "beauty",
    objectiveHint: "prendre-rendez-vous",
    form: {
      businessName: "Maison Glow",
      businessType: "Institut de beaute",
      city: "Bordeaux",
      targetAudience: "Femmes actives qui veulent une experience beaute soignee, rassurante et facile a reserver",
      services: "Soin visage, drainage, maquillage evenement, diagnostic peau, carte cadeau",
      objective: "Prendre rendez-vous",
      positioning: "Premium",
      style: "Elegant, doux, premium, minimaliste",
      colors: "Ivoire, champagne, terracotta doux",
      cta: "Prendre rendez-vous",
      description:
        "Institut de beaute premium a Bordeaux. Le site doit donner envie de reserver, rassurer sur l'accompagnement et montrer une ambiance douce, lumineuse et haut de gamme.",
    },
  },
  {
    id: "formation-b2b-nantes",
    city: "Nantes",
    expectedNiche: "education",
    objectiveHint: "generer-leads",
    form: {
      businessName: "ScaleOps Academy",
      businessType: "Formation B2B",
      city: "Nantes",
      targetAudience: "Dirigeants de PME et managers qui veulent structurer leurs process commerciaux sans recruter tout de suite",
      services: "Audit commercial, formation equipe, playbook de vente, ateliers CRM, accompagnement 30 jours",
      objective: "Generer des leads",
      positioning: "Professionnel",
      style: "Moderne, clair, SaaS, bento, expert",
      colors: "Bleu profond, vert signal, blanc casse",
      cta: "Demander un diagnostic",
      description:
        "Landing B2B pour vendre une formation commerciale a des PME. Le site doit expliquer l'offre vite, montrer la methode, lever les objections et pousser une demande de diagnostic.",
    },
  },
];

const requiredKeys = [
  "heroTitle",
  "heroSubtitle",
  "servicesTitle",
  "benefitsTitle",
  "ctaTitle",
  "ctaSubtitle",
  "ctaButton",
  "problemTitle",
  "problemContent",
  "reassuranceTitle",
  "reassuranceContent",
  "localSeoTitle",
  "localSeoContent",
  "sectionOrder",
  "services",
  "benefits",
  "testimonials",
  "processSteps",
  "faqItems",
  "metadata",
  "design",
  "visuals",
];

const requiredMetadataKeys = ["seoTitle", "metaDescription", "seoKeywords", "niche", "offer", "differentiators"];
const requiredDesignKeys = [
  "colors",
  "style",
  "layout_type",
  "animation_style",
  "visual_direction",
  "typography",
  "image_style",
  "spacing_style",
  "button_style",
  "card_style",
  "section_style",
];

const forbiddenPatterns = [
  /lorem ipsum/i,
  /\bnous sommes les meilleurs\b/i,
  /\bopenai\b/i,
  /\bgemini\b/i,
  /\bclaude\b/i,
  /\bindicateur\b/i,
  /\bsolution sur mesure\b/i,
  /\bexpertise premium\b/i,
  /\baccompagnement complet\b/i,
  /\bscore qualit[e\u00e9]\b/i,
  /\banalyse interne\b/i,
  /\bdebug\b/i,
];

const genericPatterns = [
  /\boffre claire\b/i,
  /\bplus credible\b/i,
  /\bplus rassurant\b/i,
  /\bsite vendable\b/i,
  /\bpresence premium\b/i,
  /\bpresence web moderne\b/i,
  /\bboostez votre activite\b/i,
  /\bsolution adaptee a vos besoins\b/i,
  /\bsans friction\b/i,
  /\bimage de marque\b/i,
  /\bpasser de l[â€™']?interet\b/i,
  /\bpasser de l[â€™']?intÃ©rÃªt\b/i,
  /\bpasser de l\s+interet\b/i,
  /\bpasser de l\s+intÃ©rÃªt\b/i,
  /\btransformer l[â€™']?interet\b/i,
  /\btransformer l[â€™']?intÃ©rÃªt\b/i,
  /\btransformer l\s+interet\b/i,
  /\btransformer l\s+intÃ©rÃªt\b/i,
  /\bconvertir les visiteurs\b/i,
  /\bgenerer des leads\b/i,
  /\bgÃ©nÃ©rer des leads\b/i,
  /\bobtenir plus de clients\b/i,
  /\bstrategie de conversion\b/i,
  /\bstratÃ©gie de conversion\b/i,
  /\bparcours client\b/i,
  /\binformation claire et utile\b/i,
  /\bpreuve lisible\b/i,
  /\bparcours pense\b/i,
  /\bparcours pensÃ©\b/i,
  /\bprochaine etape claire\b/i,
  /\bprochaine Ã©tape claire\b/i,
  /\bcomprendre la valeur\b/i,
  /\bacheter plus sereinement\b/i,
  /\bchoisir plus sereinement\b/i,
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const summarizeSections = (content) => content.sectionOrder.join(" > ");
const smokeReportPath = path.resolve(process.cwd(), "tmp", "generator-smoke-last.json");
const requestedCaseIds = new Set(
  (process.env.PIXELRISES_SMOKE_ONLY || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);

const getSmokeBearerToken = async () => {
  const explicitToken = process.env.PIXELRISES_SMOKE_BEARER_TOKEN?.trim();
  if (explicitToken) return explicitToken;

  const email = process.env.PIXELRISES_SMOKE_EMAIL?.trim();
  const password = process.env.PIXELRISES_SMOKE_PASSWORD?.trim();
  if (!email || !password) return "";

  const authEndpoint = `${requiredEnv("VITE_SUPABASE_URL").replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
  const response = await fetch(authEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Smoke auth failed with status ${response.status}. Rotate the test password if it was exposed.`);
  }

  return String(payload.access_token);
};

const nicheAliases = {
  restaurant: ["restaurant", "bistro", "bistronomie", "gastronomie", "table"],
  coach: ["coach", "coaching", "sport", "fitness", "forme"],
  immobilier: ["immobilier", "agence immobiliere", "agence immobiliÃ¨re", "real estate", "patrimoine"],
  "local-services": ["service local", "depannage", "dÃ©pannage", "intervention", "artisan", "habitat"],
  "car-rental": ["location de voiture", "location voiture", "voiture", "vehicule", "vÃ©hicule", "auto", "car rental"],
  "creative-services": ["creative", "creation", "photographe", "photographie", "photo", "studio", "portfolio"],
  beauty: ["beaute", "beauty", "institut", "spa", "esthetique", "soin", "wellness"],
  education: ["education", "formation", "academy", "b2b", "learning", "coaching business", "consulting"],
};

const nicheMatches = (actual, expected) => {
  const actualKey = normalize(actual);
  const aliases = nicheAliases[expected] || [expected];
  return aliases.some((alias) => actualKey.includes(normalize(alias)));
};

const validateCase = (payload, testCase) => {
  if (!payload.content || typeof payload.content !== "object") {
    throw new Error("Missing content object");
  }

  if (!payload.summary || typeof payload.summary !== "object") {
    throw new Error("Missing generation summary");
  }

  const content = payload.content;
  for (const key of requiredKeys) {
    if (!(key in content)) {
      throw new Error(`Missing required key: ${key}`);
    }
  }

  for (const key of requiredMetadataKeys) {
    if (!(key in (content.metadata || {}))) {
      throw new Error(`Missing metadata key: ${key}`);
    }
  }

  for (const key of requiredDesignKeys) {
    if (!(key in (content.design || {}))) {
      throw new Error(`Missing design key: ${key}`);
    }
  }

  if (String(content.metadata.seoTitle || "").length < 18) {
    throw new Error("SEO title too weak");
  }

  if (String(content.metadata.metaDescription || "").length < 70) {
    throw new Error("Meta description too weak");
  }

  if (!Array.isArray(content.sectionOrder) || content.sectionOrder.length < 6) {
    throw new Error("Section order too short");
  }

  if (content.sectionOrder[0] !== "hero" || content.sectionOrder.at(-1) !== "final_cta") {
    throw new Error(`Invalid section sequence: ${summarizeSections(content)}`);
  }

  if (!Array.isArray(content.services) || content.services.length < 3) {
    throw new Error("Services list too short");
  }

  if (!Array.isArray(content.benefits) || content.benefits.length < 3) {
    throw new Error("Benefits list too short");
  }

  if (!Array.isArray(content.processSteps) || content.processSteps.length < 3) {
    throw new Error("Process list too short");
  }

  if (!Array.isArray(content.faqItems) || content.faqItems.length < 3) {
    throw new Error("FAQ list too short");
  }

  if (!Array.isArray(content.testimonials) || content.testimonials.length < 2) {
    throw new Error("Testimonials list too short");
  }

  if (!payload.summary.seo?.title || !payload.summary.seo?.description) {
    throw new Error("Generation summary is missing SEO details");
  }

  if (!payload.summary.ctas?.primary || !payload.summary.ctas?.secondary) {
    throw new Error("Generation summary is missing CTA details");
  }

  if (!payload.summary.design?.description || !payload.summary.design?.visualDirection) {
    throw new Error("Generation summary is missing design details");
  }

  const visibleStrings = [
    content.heroTitle,
    content.heroSubtitle,
    content.problemTitle,
    content.problemContent,
    content.servicesTitle,
    content.benefitsTitle,
    content.ctaTitle,
    content.ctaSubtitle,
    content.ctaButton,
    ...content.services.flatMap((item) => [item.name, item.description]),
    ...content.benefits.flatMap((item) => [item.title, item.description]),
    ...content.testimonials.flatMap((item) => [item.name, item.role, item.text]),
  ];
  const joined = visibleStrings.join(" ");

  if (forbiddenPatterns.some((pattern) => pattern.test(joined))) {
    throw new Error("Forbidden wording found");
  }

  const genericHits = genericPatterns.filter((pattern) => pattern.test(joined)).length;
  const heroGenericHits = genericPatterns.filter((pattern) =>
    pattern.test(`${content.heroTitle} ${content.heroSubtitle} ${content.ctaTitle} ${content.ctaSubtitle}`),
  ).length;
  if (genericHits >= 3 || heroGenericHits > 0) {
    throw new Error("Too many generic phrases detected");
  }

  const heroBlock = normalize(
    `${content.heroTitle} ${content.heroSubtitle} ${content.ctaButton} ${content.heroSecondaryCta || ""}`,
  );
  if (heroBlock.length < 80) {
    throw new Error("Hero block too weak");
  }

  const heroTitleKey = normalize(content.heroTitle);
  const titleContextTokens = [
    ...normalize(testCase.form.businessName).split(" "),
    ...normalize(testCase.form.businessType).split(" "),
    normalize(testCase.city),
  ].filter((token) => token.length >= 4);
  if (!titleContextTokens.some((token) => heroTitleKey.includes(token))) {
    throw new Error("Hero title lacks business, niche or city context");
  }

  if (normalize(content.ctaButton).length < 8) {
    throw new Error("CTA too weak");
  }

  const city = normalize(testCase.city);
  const localBlock = normalize(
    `${content.heroTitle} ${content.heroSubtitle} ${content.localSeoTitle} ${content.localSeoContent} ${(content.localSeoItems || []).join(" ")}`,
  );
  if (!localBlock.includes(city)) {
    throw new Error(`City not found in local SEO content: ${testCase.city}`);
  }

  const serviceNames = new Set(content.services.map((item) => normalize(item.name)));
  if (serviceNames.size !== content.services.length) {
    throw new Error("Duplicate or overly similar service names");
  }

  const visualPrompts = [
    content.visuals?.hero?.prompt,
    ...(content.visuals?.gallery || []).map((item) => item.prompt || item.alt || item.url),
  ].map(normalize).filter(Boolean);

  if (visualPrompts.length < 4 || new Set(visualPrompts).size < 4) {
    throw new Error("Visual prompts are missing or duplicated");
  }

  if (!nicheMatches(content.metadata?.niche, testCase.expectedNiche)) {
    throw new Error(`Unexpected niche returned: ${content.metadata?.niche}`);
  }

  const sectionSignature = summarizeSections(content);
  return {
    heroTitle: content.heroTitle,
    heroSubtitle: content.heroSubtitle,
    niche: content.metadata.niche,
    ctaButton: content.ctaButton,
    sections: sectionSignature,
    objective: content.metadata?.objective || testCase.form.objective,
  };
};

const run = async () => {
  if (!realQaEnabled) {
    console.warn("Generator smoke test skipped: PIXELRISES_GENERATOR_REAL_QA is not 1. No credits were consumed.");
    return;
  }

  if (dailyRealBudget <= 0) {
    console.warn("Generator smoke test skipped: PIXELRISES_GENERATOR_DAILY_REAL_BUDGET is 0. No credits were consumed.");
    return;
  }

  const bearerToken = await getSmokeBearerToken();
  if (!bearerToken) {
    console.warn("Generator smoke test skipped: smoke credentials are not configured. No credits were consumed.");
    return;
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/generate-site`;
  const results = [];
  let consumedCases = 0;

  for (const testCase of cases) {
    if (requestedCaseIds.size > 0 && !requestedCaseIds.has(testCase.id)) {
      continue;
    }

    if (consumedCases >= dailyRealBudget) {
      console.log(`Budget reached: ${dailyRealBudget} real QA generation(s). Remaining cases skipped.`);
      break;
    }

    try {
      consumedCases += 1;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
          apikey: publishableKey,
        },
        body: JSON.stringify({ form: testCase.form }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = `[${testCase.id}] ${payload.error || response.statusText}`;
        if ([401, 402, 403].includes(response.status)) {
          throw new Error(error);
        }
        results.push({ id: testCase.id, status: "failed", error });
        console.error(`FAIL ${testCase.id}: ${error}`);
        continue;
      }

      const summary = validateCase(payload, testCase);
      results.push({
        id: testCase.id,
        status: "passed",
        siteId: payload.siteId || "",
        previewUrl: payload.previewUrl || "",
        ...summary,
        design: {
          style: payload.content?.design?.style,
          layout_type: payload.content?.design?.layout_type,
          visual_direction: payload.content?.design?.visual_direction,
          designArchetype: payload.content?.design?.designArchetype,
        },
        sectionOrder: payload.content?.sectionOrder || [],
        services: (payload.content?.services || []).map((item) => item.name),
        visuals: [
          payload.content?.visuals?.hero?.url,
          ...(payload.content?.visuals?.gallery || []).map((item) => item.url),
        ].filter(Boolean),
      });
      console.log(`OK ${testCase.id}: ${summary.heroTitle}`);
    } catch (error) {
      results.push({
        id: testCase.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`FAIL ${testCase.id}: ${error instanceof Error ? error.message : String(error)}`);
      if (/\bUnauthorized\b|\bcredits\b|\bCr[eé]dits insuffisants\b|\bPayment Required\b/i.test(String(error))) {
        break;
      }
    }
  }

  fs.mkdirSync(path.dirname(smokeReportPath), { recursive: true });
  fs.writeFileSync(
    smokeReportPath,
    JSON.stringify(
      {
        endpoint,
        createdAt: new Date().toISOString(),
        realQaEnabled,
        dailyRealBudget,
        consumedCases,
        results,
      },
      null,
      2,
    ),
  );
  console.log(`\nSmoke report saved: ${smokeReportPath}`);

  const passedResults = results.filter((entry) => entry.status === "passed");
  const failedResults = results.filter((entry) => entry.status !== "passed");

  const heroSet = new Set(passedResults.map((entry) => normalize(entry.heroTitle)));
  const nicheSet = new Set(passedResults.map((entry) => normalize(entry.niche)));
  const sectionSet = new Set(passedResults.map((entry) => normalize(entry.sections)));

  if (heroSet.size !== passedResults.length) {
    throw new Error("Generator variety check failed: hero titles are too similar");
  }

  if (nicheSet.size !== passedResults.length) {
    throw new Error("Generator variety check failed: niches are not clearly differentiated");
  }

  if (passedResults.length >= 3 && sectionSet.size < 3) {
    throw new Error("Generator variety check failed: section structures are too similar");
  }

  if (failedResults.length > 0) {
    throw new Error(`${failedResults.length} generator smoke case(s) failed. See ${smokeReportPath}`);
  }

  console.log("\nGenerator smoke test passed.");
  console.table(results);
};

run().catch((error) => {
  console.error("\nGenerator smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
