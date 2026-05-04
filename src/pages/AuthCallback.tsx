import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { consumeAuthRedirectTarget } from "@/lib/auth-redirect";
import { tryBootstrapAdmin } from "@/lib/admin-bootstrap";
import { safeSessionStorage } from "@/lib/browser-storage";

const AUTH_ERROR_KEY = "pixelrises.auth.error";

const resolveRedirectTarget = () => {
  try {
    const raw = new URLSearchParams(window.location.search).get("redirect");
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
      return raw;
    }
  } catch {
    // Ignore malformed redirect params and fall back to the stored target.
  }

  return consumeAuthRedirectTarget();
};

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const resolveCallback = async () => {
      const redirectTarget = resolveRedirectTarget();

      try {
        const params = new URLSearchParams(window.location.search);
        const hasCode = params.has("code");

        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }

        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          await tryBootstrapAdmin();
          navigate(redirectTarget, { replace: true });
          return;
        }

        safeSessionStorage().setItem(
          AUTH_ERROR_KEY,
          "Votre session n'a pas pu être confirmée. Réessayez la connexion."
        );
        navigate("/auth", { replace: true });
      } catch (error) {
        if (import.meta.env.DEV) console.error("Auth callback error:", error);
        safeSessionStorage().setItem(
          AUTH_ERROR_KEY,
          "La connexion Google a échoué. Réessayez dans votre navigateur principal."
        );
        navigate("/auth", { replace: true });
      }
    };

    void resolveCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

