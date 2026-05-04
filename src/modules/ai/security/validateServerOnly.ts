import { aiProvidersConfig } from "../config/ai-providers.config";
import type { AIProviderId } from "../schemas/ai-task.schema";

export const validateServerOnly = (providerId: AIProviderId) => {
  const provider = aiProvidersConfig[providerId];
  if (!provider) {
    return { valid: false, message: "Provider inconnu." };
  }

  if (!provider.serverOnly || provider.status === "mock") {
    return { valid: true, message: "Execution locale autorisee car provider mock ou non sensible." };
  }

  return {
    valid: false,
    message: `${provider.displayName} doit passer par une route backend/edge securisee. Aucune cle API cote frontend.`,
  };
};
