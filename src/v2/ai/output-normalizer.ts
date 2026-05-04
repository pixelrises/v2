import type { ProviderAdapterResult } from "./provider-adapter";
import { validateAIOutput } from "./validation-layer";

export const normalizeProviderOutput = (result: ProviderAdapterResult) => ({
  ...result,
  output: validateAIOutput(result.output),
});
