import { describe, expect, it } from "vitest";
import { getOAuthRedirectUrl } from "@/lib/auth-redirect";
import { resolveRuntimeAppOrigin } from "@/lib/browser-context";

describe("auth redirect", () => {
  it("uses the current deployed app origin for OAuth callbacks", () => {
    expect(getOAuthRedirectUrl()).toBe(`${window.location.origin}/auth/callback`);
    expect(getOAuthRedirectUrl()).not.toBe("https://pixelrises.fr/auth/callback");
  });

  it("keeps Vercel preview origins instead of replacing them with the public V1 domain", () => {
    expect(resolveRuntimeAppOrigin("https://pixelrises-v2-preview.vercel.app/auth")).toBe(
      "https://pixelrises-v2-preview.vercel.app",
    );
  });
});
