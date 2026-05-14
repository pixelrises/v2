import type { DataState } from "@/lib/data-state";
import { integrationRegistry, type IntegrationRegistryItem, type RegistryStatus } from "@/modules/registries";

export type IntegrationStatus =
  | "connected"
  | "not_configured"
  | "beta"
  | "coming_soon"
  | "blocked"
  | "error"
  | "dry_run";

export type IntegrationRiskLevel = "low" | "medium" | "high";

export type NormalizedIntegration = IntegrationRegistryItem & {
  normalizedStatus: IntegrationStatus;
  dataState: DataState;
  riskLevel: IntegrationRiskLevel;
  connectedAt?: string;
  lastSyncAt?: string;
  requiredPermissions: string[];
  setupSteps: string[];
  isAvailable: boolean;
  isBeta: boolean;
  isConnected: boolean;
  statusReason: string;
};

const marketingIntegrationIds = new Set(["meta-ads", "google-ads", "tiktok", "instagram", "youtube"]);
const externalActionIntegrationIds = new Set(["gmail", "whatsapp", "telegram", "slack", "zapier", "make", "n8n", "webhooks"]);
const dryRunIntegrationIds = new Set(["analytics-internal", "pixelrises-forms", "vercel-ai-gateway", "supabase"]);

const statusMap: Record<RegistryStatus, IntegrationStatus> = {
  connected: "connected",
  available: "not_configured",
  configure: "not_configured",
  development: "dry_run",
  beta: "beta",
  soon: "coming_soon",
  requested: "coming_soon",
};

export const integrationStatusCopy: Record<IntegrationStatus, { label: string; helper: string }> = {
  connected: {
    label: "Connecté",
    helper: "Connexion active confirmée par une source réelle.",
  },
  not_configured: {
    label: "À configurer",
    helper: "Disponible côté produit, mais nécessite une configuration serveur ou utilisateur.",
  },
  beta: {
    label: "Bêta",
    helper: "Fonction en test, accès limité ou validation nécessaire.",
  },
  coming_soon: {
    label: "Bientôt",
    helper: "Prévu dans la roadmap, non activable aujourd'hui.",
  },
  blocked: {
    label: "Bloqué",
    helper: "Configuration impossible tant qu'une validation ou dépendance manque.",
  },
  error: {
    label: "Erreur",
    helper: "Dernière vérification échouée. Les détails sont redacted.",
  },
  dry_run: {
    label: "Dry-run",
    helper: "Interface prête pour tests internes, aucune action externe réelle.",
  },
};

const inferRisk = (integration: IntegrationRegistryItem): IntegrationRiskLevel => {
  if (marketingIntegrationIds.has(integration.id) || integration.category === "Business") return "high";
  if (externalActionIntegrationIds.has(integration.id) || integration.category === "Communication") return "medium";
  return "low";
};

const inferSetupSteps = (integration: IntegrationRegistryItem, status: IntegrationStatus) => {
  if (status === "connected") {
    return ["Vérifier la dernière synchronisation", "Contrôler les permissions", "Garder les logs redacted"];
  }

  if (status === "coming_soon") {
    return ["Valider le besoin produit", "Définir les permissions minimales", "Préparer une intégration serveur plus tard"];
  }

  if (status === "beta" || status === "dry_run") {
    return ["Tester en environnement contrôlé", "Confirmer le consentement utilisateur", "Bloquer toute action externe automatique"];
  }

  return ["Configurer côté serveur", "Tester sans donnée sensible", "Activer seulement après consentement utilisateur"];
};

export const normalizeIntegration = (integration: IntegrationRegistryItem): NormalizedIntegration => {
  const normalizedStatus = dryRunIntegrationIds.has(integration.id)
    ? "dry_run"
    : integration.status === "connected"
      ? "connected"
      : statusMap[integration.status];
  const riskLevel = inferRisk(integration);
  const isConnected = normalizedStatus === "connected";

  return {
    ...integration,
    normalizedStatus,
    dataState: isConnected ? "real" : normalizedStatus === "coming_soon" ? "empty" : "example",
    riskLevel,
    requiredPermissions: integration.permissions,
    setupSteps: integration.setupSignals?.length ? integration.setupSignals : inferSetupSteps(integration, normalizedStatus),
    isAvailable: ["connected", "not_configured", "dry_run", "beta"].includes(normalizedStatus),
    isBeta: normalizedStatus === "beta",
    isConnected,
    statusReason: integrationStatusCopy[normalizedStatus].helper,
  };
};

export const getNormalizedIntegrations = () => integrationRegistry.map(normalizeIntegration);

export const getIntegrationSummary = (items: NormalizedIntegration[] = getNormalizedIntegrations()) => {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.normalizedStatus] += 1;
      return acc;
    },
    {
      connected: 0,
      not_configured: 0,
      beta: 0,
      coming_soon: 0,
      blocked: 0,
      error: 0,
      dry_run: 0,
    } satisfies Record<IntegrationStatus, number>,
  );

  return {
    total: items.length,
    ...counts,
  };
};

export const canOpenIntegration = (integration: NormalizedIntegration) =>
  integration.normalizedStatus === "connected" || integration.normalizedStatus === "not_configured" || integration.normalizedStatus === "dry_run";

export const canExecuteExternalAction = () => false;
