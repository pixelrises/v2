import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPaymentReturnIntent,
  getPaymentReturnIntent,
  setPaymentReturnIntent,
} from "@/lib/payment-return-intent";

const STORAGE_KEY = "pixelrises:payment-return-intent";

describe("payment return intent", () => {
  beforeEach(() => {
    clearPaymentReturnIntent();
  });

  it("stores only the Stripe return destination, never a local activation flag", () => {
    setPaymentReturnIntent({
      siteId: "site-123",
      intent: "publish",
      returnPath: "/dashboard?manage=site-123&managerTab=publish",
    });

    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();

    const payload = JSON.parse(raw || "{}") as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual([
      "createdAt",
      "intent",
      "returnPath",
      "siteId",
    ]);
    expect(payload).not.toHaveProperty("activated");
    expect(payload).not.toHaveProperty("siteActivated");
    expect(payload).not.toHaveProperty("unlocked");
  });

  it("rejects unsafe return paths outside the dashboard", () => {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        siteId: "site-123",
        intent: "publish",
        returnPath: "/admin",
        createdAt: Date.now(),
      }),
    );

    expect(getPaymentReturnIntent()).toBeNull();
  });
});
