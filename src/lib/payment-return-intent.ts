import { safeSessionStorage } from "@/lib/browser-storage";

export type PaymentReturnIntent = {
  siteId: string;
  intent: "publish" | "subscription";
  returnPath: string;
  createdAt: number;
};

const PAYMENT_RETURN_KEY = "pixelrises:payment-return-intent";
const PAYMENT_RETURN_MAX_AGE_MS = 1000 * 60 * 60;

export const setPaymentReturnIntent = (
  intent: Omit<PaymentReturnIntent, "createdAt">,
) => {
  safeSessionStorage().setItem(
    PAYMENT_RETURN_KEY,
    JSON.stringify({ ...intent, createdAt: Date.now() }),
  );
};

export const getPaymentReturnIntent = (): PaymentReturnIntent | null => {
  const raw = safeSessionStorage().getItem(PAYMENT_RETURN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PaymentReturnIntent>;
    const validIntent = parsed.intent === "publish" || parsed.intent === "subscription";
    const validAge =
      typeof parsed.createdAt === "number" &&
      Date.now() - parsed.createdAt < PAYMENT_RETURN_MAX_AGE_MS;

    if (
      typeof parsed.siteId === "string" &&
      typeof parsed.returnPath === "string" &&
      parsed.returnPath.startsWith("/dashboard") &&
      validIntent &&
      validAge
    ) {
      return parsed as PaymentReturnIntent;
    }
  } catch {
    return null;
  }

  return null;
};

export const clearPaymentReturnIntent = () => {
  safeSessionStorage().removeItem(PAYMENT_RETURN_KEY);
};
