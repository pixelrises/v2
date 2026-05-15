import { describe, expect, it } from "vitest";
import { getPublishedSiteSlugFromHostname } from "@/lib/published-site";

describe("published site domain routing", () => {
  it("does not treat the V2 app domain as a published customer site", () => {
    expect(getPublishedSiteSlugFromHostname("v2.pixelrises.fr")).toBeNull();
  });

  it("still resolves non-reserved customer subdomains", () => {
    expect(getPublishedSiteSlugFromHostname("restaurant.pixelrises.fr")).toBe("restaurant");
  });
});
