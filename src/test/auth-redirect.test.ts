import { describe, expect, it } from "vitest";
import { getOAuthRedirectUrl } from "@/lib/auth-redirect";
import { isPixelrisesAppHostname, resolveRuntimeAppOrigin } from "@/lib/browser-context";

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

  it("detects V2 app hosts without treating the public landing as an app entry", () => {
    expect(isPixelrisesAppHostname("v2.pixelrises.fr")).toBe(true);
    expect(isPixelrisesAppHostname("pixelrises-v2-preview.vercel.app")).toBe(true);
    expect(isPixelrisesAppHostname("pixelrises.fr")).toBe(false);
    expect(isPixelrisesAppHostname("restaurant.pixelrises.fr")).toBe(false);
  });
});
