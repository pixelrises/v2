import type {
  CustomAgentProject,
  GameProject,
  NormalizedSiteProject,
  ProjectType,
  QualityGateCheck,
  QualityGateResult,
} from "./types";
import { genericSiteCopyPatterns, resolveSiteBlueprint } from "./site-blueprints";

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const buildResult = (projectType: ProjectType, checks: QualityGateCheck[]): QualityGateResult => {
  const requiredChecks = checks.filter((check) => check.severity === "required");
  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / Math.max(1, checks.length)) * 100);
  const requiredFixes = requiredChecks.filter((check) => !check.passed).map((check) => check.message);
  const warnings = checks
    .filter((check) => check.severity === "recommended" && !check.passed)
    .map((check) => check.message);

  return {
    projectType,
    passed: requiredFixes.length === 0,
    score,
    checks,
    requiredFixes,
    warnings,
  };
};

export const validateSiteProject = (project: NormalizedSiteProject): QualityGateResult => {
  const firstPage = project.pages?.[0];
  const sections = firstPage?.sections ?? [];
  const hero = sections.find((section) => section.type === "hero") ?? sections[0];
  const allVisibleText = JSON.stringify(project).toLowerCase();
  const normalizedText = normalize(JSON.stringify(project));
  const blueprint = resolveSiteBlueprint({
    businessName: project.meta.businessName,
    niche: project.meta.niche,
    city: project.meta.city,
    goal: project.meta.goal,
    offer: project.business.offer,
    targetAudience: project.meta.targetAudience,
    style: project.meta.style,
  });
  const uniqueLayouts = new Set(sections.map((section) => section.layout).filter(Boolean));
  const hasGenericCopy = genericSiteCopyPatterns.some((pattern) => pattern.test(allVisibleText));
  const normalizedNicheWords = normalize(project.meta.niche)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);
  const specificitySignals = [
    normalize(project.meta.businessName),
    normalize(project.meta.city),
    ...normalizedNicheWords,
    ...project.conversion.recommendedSections.map(normalize),
  ].filter((value) => value.length >= 3);
  const specificityHitCount = specificitySignals.filter((signal) => normalizedText.includes(signal)).length;
  const blueprintLayoutHit = sections.some((section) => section.layout.includes(blueprint.key));

  return buildResult("site", [
    {
      id: "site-json",
      label: "JSON canonique",
      passed: project.meta?.projectType === "site" && hasText(project.meta.projectId),
      severity: "required",
      message: "Le projet site doit avoir un projectId et projectType=site.",
    },
    {
      id: "site-hero",
      label: "Hero spécifique",
      passed: hasText(hero?.title) && !hero.title.toLowerCase().includes("lorem"),
      severity: "required",
      message: "Le hero doit contenir un titre spécifique sans placeholder.",
    },
    {
      id: "site-cta",
      label: "CTA clair",
      passed: hasText(project.strategy.primaryCTA) && sections.some((section) => hasText(section.cta?.label)),
      severity: "required",
      message: "Un CTA principal doit être présent dans la stratégie et les sections.",
    },
    {
      id: "site-seo",
      label: "SEO rempli",
      passed: hasText(project.seo.title) && hasText(project.seo.description) && hasText(project.seo.h1),
      severity: "required",
      message: "Le titre SEO, la description SEO et le H1 sont obligatoires.",
    },
    {
      id: "site-sections",
      label: "Structure complète",
      passed: sections.length >= 5,
      severity: "recommended",
      message: "Ajouter au moins cinq sections renforce la crédibilité et la conversion.",
    },
    {
      id: "site-no-generic-copy",
      label: "Anti-template generique",
      passed: !hasGenericCopy,
      severity: "required",
      message: "Le site contient une phrase trop generique ou un reste de template.",
    },
    {
      id: "site-layout-diversity",
      label: "Layouts varies par niche",
      passed: uniqueLayouts.size >= Math.min(4, sections.length),
      severity: "required",
      message: "Les sections doivent utiliser plusieurs layouts adaptes a la niche, pas le meme template repete.",
    },
    {
      id: "site-niche-specificity",
      label: "Specificite niche",
      passed: specificityHitCount >= 3,
      severity: "required",
      message: "Le contenu doit citer le business, la ville, la niche ou les enjeux concrets du brief.",
    },
    {
      id: "site-blueprint-fit",
      label: "Blueprint adapte",
      passed: blueprintLayoutHit || project.design.components.some((component) => blueprint.components.includes(component)),
      severity: "recommended",
      message: "Le layout devrait suivre un blueprint vraiment adapte a la niche detectee.",
    },
    {
      id: "site-no-placeholder",
      label: "Aucun placeholder visible",
      passed: !["placeholder", "lorem", "debug", "todo"].some((token) => allVisibleText.includes(token)),
      severity: "required",
      message: "Le rendu ne doit pas contenir placeholder, lorem, debug ou todo.",
    },
  ]);
};

export const validateAgentProject = (agent: CustomAgentProject): QualityGateResult =>
  buildResult("agent", [
    {
      id: "agent-role",
      label: "Rôle clair",
      passed: hasText(agent.role) && hasText(agent.goal),
      severity: "required",
      message: "L'agent doit avoir un rôle et un objectif clair.",
    },
    {
      id: "agent-instructions",
      label: "Instructions non vides",
      passed: hasText(agent.instructions) && hasText(agent.avoid),
      severity: "required",
      message: "Les instructions principales et limites doivent être renseignées.",
    },
    {
      id: "agent-safe-defaults",
      label: "Permissions sûres",
      passed:
        agent.permissions.readProject &&
        agent.permissions.suggestChanges &&
        !agent.permissions.editWithApproval &&
        !agent.permissions.publishWithApproval,
      severity: "required",
      message: "Par défaut, un agent peut lire/proposer mais ne peut pas modifier ou publier sans validation.",
    },
    {
      id: "agent-context",
      label: "Contexte projet",
      passed: hasText(agent.projectContext.projectId) && hasText(agent.projectContext.goal),
      severity: "recommended",
      message: "Ajouter un contexte projet rend les réponses plus utiles.",
    },
  ]);

export const validateGameProject = (game: GameProject): QualityGateResult =>
  buildResult("game", [
    {
      id: "game-platform",
      label: "Plateforme claire",
      passed: hasText(game.meta.platform) && hasText(game.meta.gameType),
      severity: "required",
      message: "La plateforme et le type de jeu sont obligatoires.",
    },
    {
      id: "game-loop",
      label: "Gameplay loop",
      passed: hasText(game.gameplay.loop) && hasItems(game.gameplay.mechanics),
      severity: "required",
      message: "Le blueprint doit expliquer la boucle de jeu et les mécaniques.",
    },
    {
      id: "game-scripts",
      label: "Scripts expliqués",
      passed: hasItems(game.scripts) && game.scripts.every((script) => hasText(script.explanation)),
      severity: "required",
      message: "Les snippets doivent être accompagnés d'une explication.",
    },
    {
      id: "game-checklist",
      label: "Checklist publication",
      passed: hasItems(game.publishing.checklist) && hasItems(game.publishing.warnings),
      severity: "required",
      message: "Le Game Builder bêta doit fournir une checklist et des avertissements de publication.",
    },
    {
      id: "game-no-auto-publish",
      label: "Pas de publication automatique",
      passed: game.publishing.warnings.some((warning) => warning.toLowerCase().includes("publie")),
      severity: "required",
      message: "Le blueprint doit préciser qu'aucune publication automatique n'est effectuée.",
    },
  ]);
