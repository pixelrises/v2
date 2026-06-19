import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const generateSite = readFileSync(
  join(root, "supabase/functions/generate-site/index.ts"),
  "utf8",
);
const aiPage = readFileSync(join(root, "src/pages/PixelrisesAI.tsx"), "utf8");
const previewPage = readFileSync(join(root, "src/pages/Preview.tsx"), "utf8");

describe("Pixelrises generator prompt contract", () => {
  it("injects UserVision into analysis, strategy, blueprint and final generation prompts", () => {
    expect(generateSite).toContain("type UserVision =");
    expect(generateSite).toContain("desiredColors");
    expect(generateSite).toContain("desiredMood");
    expect(generateSite).toContain("desiredCTA");
    expect(generateSite).toContain("whatsappRequested");
    expect(generateSite).toContain("prioritySignals");
    expect(generateSite).toContain("buildUserVisionPromptBlock(userVision)");
    expect(generateSite).toContain("OPTIONS INTERNES ACTIVEES");
    expect(generateSite).toContain(
      "Si une option ci-dessous est active, elle renforce la direction",
    );
    expect(generateSite).toContain("Directions choisies");
    expect(generateSite).toContain(
      "buildBusinessAnalysisUserPrompt(form, heuristicProfile, userVision)",
    );
    expect(generateSite).toContain(
      "buildBusinessStrategyUserPrompt(form, profile, userVision)",
    );
    expect(generateSite).toContain("buildPromptBlueprintUserPrompt(");
    expect(generateSite).toContain("userVision,");
    expect(generateSite).toContain("Tu ne cr\\u00e9es pas un simple site vitrine");
    expect(generateSite).toContain("Ne remplace jamais la vision utilisateur");
    expect(generateSite).toContain(
      "Chaque section doit avoir une fonction commerciale claire",
    );
  });

  it("uses env-driven Gemini generation with stable fallbacks and creative variation libraries", () => {
    expect(generateSite).toContain('const SITE_GENERATION_MODEL =');
    expect(generateSite).toContain('Deno.env.get("AI_GATEWAY_SITE_GENERATION_MODEL")');
    expect(generateSite).toContain('"google/gemini-3-pro-preview"');
    expect(generateSite).toContain('const SITE_GENERATION_FALLBACK_MODEL =');
    expect(generateSite).toContain('Deno.env.get("AI_GATEWAY_SITE_GENERATION_FALLBACK_MODEL")');
    expect(generateSite).toContain('"google/gemini-3-flash-preview"');
    expect(generateSite).toContain('const SITE_GENERATION_STABLE_FALLBACK_MODEL =');
    expect(generateSite).toContain('Deno.env.get("AI_GATEWAY_SITE_GENERATION_STABLE_MODEL")');
    expect(generateSite).toContain('"google/gemini-2.5-pro"');
    expect(generateSite).toContain("const CREATIVE_LAYOUT_RECIPES");
    expect(generateSite).toContain("buildCreativeVariationGuide(form, profile, userVision)");
    expect(generateSite).toContain("buildSiteSpecificityMatrix(form, profile, strategy, userVision)");
    expect(generateSite).toContain("MATRICE ANTI-TEMPLATE PIXELRISES");
    expect(generateSite).toContain("canonicalizeNiche");
    expect(generateSite).toContain("CANONICAL_NICHES");
    expect(generateSite).toContain("Ne jamais transformer les champs du brief en contenus visibles");
    expect(generateSite).toContain("portfolio-gallery-conversion");
    expect(generateSite).toContain("youth-social-pulse");
    expect(generateSite).toContain("design.layout_type doit inclure la recette");
    expect(generateSite).toContain("ensureLayoutSignature");
  });

  it("offers a local prompt simulation path before credit lookup, without Gemini or save", () => {
    expect(generateSite).toContain("debugPromptOnly?: boolean");
    expect(generateSite).toContain("isLocalDevelopmentRequest");
    expect(generateSite).toContain("buildPromptSimulationPayload");
    expect(generateSite).toContain("promptPreview");

    const debugIndex = generateSite.indexOf("if (form.debugPromptOnly)");
    const creditIndex = generateSite.indexOf('.from("user_credits")');

    expect(debugIndex).toBeGreaterThan(0);
    expect(creditIndex).toBeGreaterThan(0);
    expect(debugIndex).toBeLessThan(creditIndex);
  });

  it("does not accept a deterministic fallback as a final generated site", () => {
    expect(generateSite).not.toContain(
      "Strict quality gate still failed; building a deterministic Pixelrises launch candidate.",
    );
    expect(generateSite).not.toContain(
      "const emergencyRaw = buildEmergencySitePayload(form, profile, strategy)",
    );
    expect(generateSite).toContain(
      "Strict quality gate still failed after repair and controlled regeneration.",
    );
  });

  it("does not force car-rental CTA outside real car-rental briefs", () => {
    expect(aiPage).toContain(
      "location de voiture|location voiture|louer une voiture",
    );
    expect(aiPage).not.toContain(
      'if (/\\b(louer|location)\\b/i.test(normalizedPrompt)) return "Réserver une voiture";',
    );
    expect(generateSite).toContain(
      "if (isVehicleBookingCta(currentCta) && !isCarRentalBusiness(form)) return true;",
    );
    expect(generateSite).toContain(
      "if (isPhotographyBusiness(form)) return contextualCta;",
    );
  });

  it("rejects neutral or internal-marketing hero fallbacks", () => {
    expect(generateSite).toContain("/\\binformation claire et utile\\b/i");
    expect(generateSite).toContain("/\\bvotre [^,.!?]{2,32}, votre [^,.!?]{2,32}\\b/i");
    expect(generateSite).toContain("/\\bvotre [^,.!?]{2,32}, notre [^,.!?]{2,32}\\b/i");
    expect(generateSite).toContain("/\\bimmortalisez votre style unique\\b/i");
    expect(generateSite).toContain(
      "Le moteur Pixelrises a genere un titre hero sans contexte metier, ville ou marque.",
    );
    expect(generateSite).toContain("buildEmergencySafeFallback");
    expect(generateSite).toContain("Reservez une voiture");
    expect(generateSite).not.toContain(
      'const finalFallback = fallbackIsUnsafe ? "Information claire et utile."',
    );
  });

  it("scrubs internal strategy notes before saved JSON or preview fallbacks", () => {
    expect(generateSite).toContain("const INTERNAL_DESIGN_NOTE_PATTERNS");
    expect(generateSite).toContain("stripInternalDesignNotes");
    expect(generateSite).toContain("/\\bvision client prioritaire\\b/i");
    expect(generateSite).toContain("/\\bchoix visuels explicites\\b/i");
    expect(generateSite).not.toContain("`Vision client : ${visionDesignNotes.join");
  });

  it("keeps preview client-safe while respecting design and WhatsApp contact signals", () => {
    expect(previewPage).toContain("designArchetype");
    expect(previewPage).toContain("proof-lab|comparison|grid");
    expect(previewPage).toContain("calendar|tunnel|action-map|ladder");
    expect(previewPage).toContain("primaryContactHref");
    expect(previewPage).toContain("https://wa.me/");
    expect(previewPage).toContain("safeSectionOrder");
    expect(previewPage).toContain("isPhotographyContext");
    expect(previewPage).toContain("photographyBlockedImageMarkers");
    expect(previewPage).toContain("Message direct sur WhatsApp");
    expect(previewPage).toContain("isPortfolioServicesLayout");
    expect(previewPage).toContain("Avant de reserver une seance photo");
    expect(previewPage).not.toContain("dangerouslySetInnerHTML");
    expect(previewPage).not.toContain("01 23 45 67 89");
  });

  it("hard-gates photography outputs against office visuals and prompt-field services", () => {
    expect(generateSite).toContain("buildNicheSpecificQualityRules");
    expect(generateSite).toContain("REGLES SPECIFIQUES PHOTOGRAPHE / PORTFOLIO");
    expect(generateSite).toContain("PHOTOGRAPHY_VISUAL_FORBIDDEN_PATTERNS");
    expect(generateSite).toContain("PHOTOGRAPHY_META_SERVICE_PATTERNS");
    expect(generateSite).toContain("isPhotographyVisualPromptWeak");
    expect(generateSite).toContain("isPhotographyServiceNameWeak");
    expect(generateSite).toContain("Le moteur Pixelrises a reutilise le meme titre");
    expect(generateSite).toContain("Le moteur Pixelrises a transforme des champs de prompt en services photo visibles.");
    expect(generateSite).toContain("Shooting reseaux sociaux et contenu court");
    expect(generateSite).toContain("photo-1542038784456-1ea8e935640e");
  });

  it("rejects prompt-field leakage and repeated generic visible blocks across all niches", () => {
    expect(generateSite).toContain("PROMPT_FIELD_VISIBLE_LEAK_PATTERNS");
    expect(generateSite).toContain("isPromptFieldVisibleLeak");
    expect(generateSite).toContain("getNearDuplicateVisibleTexts");
    expect(generateSite).toContain("getNicheVisualQualityIssue");
    expect(generateSite).toContain("Le moteur Pixelrises a choisi des images bureau generiques");
    expect(generateSite).toContain("Le moteur Pixelrises a genere un hero trop annuaire");
    expect(generateSite).toContain("Le moteur Pixelrises a affiche des champs de formulaire ou de prompt dans le site.");
    expect(generateSite).toContain("Le moteur Pixelrises a genere trop de blocs visibles qui se ressemblent.");
    expect(generateSite).toContain("Le moteur Pixelrises a produit des images dupliquees dans la preview.");
  });
});
