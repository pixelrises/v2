import type { NormalizedAIOutput } from "./types";
import type { ProviderAdapterResult } from "./provider-adapter";
import { createEmptyAIOutput, validateAIOutput } from "./validation-layer";

export const fuseAIOutputs = (results: ProviderAdapterResult[]): NormalizedAIOutput => {
  const base = createEmptyAIOutput();
  const recommendations = results.flatMap((result) => result.output.recommendations ?? []);

  const firstPage = results
    .flatMap((result) => result.output.pages ?? [])
    .find((page) => page.sections?.length);

  return validateAIOutput({
    ...base,
    pages: firstPage ? [firstPage] : base.pages,
    recommendations: recommendations.length ? recommendations : base.recommendations,
  });
};
