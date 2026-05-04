import { supabase } from "@/integrations/supabase/client";

const ADMIN_BOOTSTRAP_TIMEOUT_MS = 4500;

const withTimeout = async <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), ADMIN_BOOTSTRAP_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const tryBootstrapAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("bootstrap-admin"),
      { data: null, error: new Error("Bootstrap admin timeout") },
    );
    if (error) return false;
    return Boolean(data?.isAdmin);
  } catch {
    return false;
  }
};
