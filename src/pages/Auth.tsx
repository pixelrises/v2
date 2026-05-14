import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PixelrisesAuthModal } from "@/components/auth/PixelrisesAuthModal";
import SEOHead from "@/components/SEOHead";
import { toast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { safeSessionStorage } from "@/lib/browser-storage";
import { getOAuthRedirectUrl, storeAuthRedirectTarget } from "@/lib/auth-redirect";
import {
  getSafePublicAuthUrl,
  isLikelyEmbeddedBrowser,
  isLikelyMobileDevice,
  isLocalhostHostname,
} from "@/lib/browser-context";
import { getReadableErrorMessage, reportFrontendError } from "@/lib/monitoring";

type Mode = "login" | "signup";
const AUTH_ERROR_KEY = "pixelrises.auth.error";
const AUTH_SESSION_TIMEOUT_MS = 4000;

const withAuthTimeout = async <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), AUTH_SESSION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const sanitizeRedirectTarget = (): string => {
  try {
    const raw = new URLSearchParams(window.location.search).get("redirect");
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    // Ignore malformed redirect params and fall back to the dashboard.
  }

  return "/dashboard";
};

const shouldSwitchAccount = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get("switch") === "1";
  } catch {
    return false;
  }
};

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTarget = sanitizeRedirectTarget();
  const switchAccount = shouldSwitchAccount();
  const isEmbeddedBrowser = isLikelyEmbeddedBrowser();
  const isMobile = isLikelyMobileDevice();
  const isLocalhostSession =
    typeof window !== "undefined" && isLocalhostHostname(window.location.hostname);

  useEffect(() => {
    const syncAuthEntry = async () => {
      try {
        if (switchAccount) {
          await withAuthTimeout(supabase.auth.signOut(), { error: null });
          return;
        }

        const { data } = await withAuthTimeout(
          supabase.auth.getSession(),
          { data: { session: null }, error: null },
        );
        if (data?.session?.user) {
          navigate(redirectTarget, { replace: true });
        }
      } catch {
        // Keep the auth form accessible even if session refresh is temporarily unavailable.
      }
    };

    void syncAuthEntry();
  }, [navigate, redirectTarget, switchAccount]);

  useEffect(() => {
    const storage = safeSessionStorage();
    const authError = storage.getItem(AUTH_ERROR_KEY);
    if (!authError) return;

    storage.removeItem(AUTH_ERROR_KEY);
    toast({
      title: "Connexion à reprendre",
      description: authError,
      variant: "destructive",
    });
  }, []);

  const buildCallbackUrl = () => {
    const callbackUrl = new URL(getOAuthRedirectUrl());
    callbackUrl.searchParams.set("redirect", redirectTarget);
    return callbackUrl.toString();
  };

  const handleGoogleLogin = async () => {
    if (isEmbeddedBrowser) {
      toast({
        title: "Google bloque ce navigateur intégré",
        description:
          "Ouvrez Pixelrises dans Chrome ou Safari pour continuer avec Google. L'email reste disponible ici.",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Authentification indisponible",
        description: "La connexion doit etre finalisee cote serveur avant d'etre disponible ici.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      storeAuthRedirectTarget(redirectTarget);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildCallbackUrl(),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      reportFrontendError("auth-google-login", error, {
        redirectTarget,
        embeddedBrowser: isEmbeddedBrowser,
      });
      toast({
        title: "Connexion Google impossible",
        description: getReadableErrorMessage(
          error,
          "La connexion Google doit etre finalisee avant d'etre disponible ici.",
        ),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) return;

    if (!isSupabaseConfigured) {
      toast({
        title: "Authentification indisponible",
        description:
          "La connexion doit etre finalisee cote serveur avant d'etre disponible ici.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        storeAuthRedirectTarget(sanitizeRedirectTarget());

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: buildCallbackUrl(),
          },
        });
        if (error) throw error;

        toast({
          title: "Inscription réussie",
          description:
            "Vérifiez votre email pour confirmer votre compte puis revenir sur Pixelrises.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(redirectTarget, { replace: true });
      }
    } catch (error: unknown) {
      reportFrontendError("auth-email-submit", error, {
        mode,
        redirectTarget,
      });
      const message = getReadableErrorMessage(error, "Une erreur est survenue.");
      toast({
        title: "Erreur",
        description:
          message === "Email not confirmed"
            ? "Confirmez votre email avant de vous connecter."
            : message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const authNotice = (() => {
    if (isLocalhostSession && isMobile) {
      return {
        title: "Cette adresse locale ne fonctionne pas sur votre téléphone",
        description:
          "Vous êtes sur localhost. Ouvrez la version publique de Pixelrises pour vous connecter et accéder à votre espace.",
        actionLabel: "Ouvrir pixelrises.fr",
        actionHref: getSafePublicAuthUrl(redirectTarget),
      };
    }

    if (isEmbeddedBrowser) {
      return {
        title: "Google doit s'ouvrir dans Chrome ou Safari",
        description:
          "Le navigateur intégré de certaines apps bloque la connexion Google. Ouvrez Pixelrises dans votre navigateur habituel ou connectez-vous par email.",
        actionLabel: "Ouvrir dans le navigateur",
        actionHref: getSafePublicAuthUrl(redirectTarget),
      };
    }

    return null;
  })();

  return (
    <div className="min-h-screen bg-background app-grid-bg flex items-center justify-center px-5">
      <SEOHead
        title="Mon espace | Pixelrises"
        description="Connectez-vous à votre espace Pixelrises pour créer, optimiser et publier vos sites en toute simplicité."
        path="/auth"
        noIndex
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <PixelrisesAuthModal
          open
          mode={mode}
          loading={loading}
          email={email}
          password={password}
          name={name}
          isSupabaseConfigured={isSupabaseConfigured}
          authNotice={authNotice}
          onOpenChange={(open) => {
            if (!open) navigate("/");
          }}
          onGoogle={handleGoogleLogin}
          onSubmit={handleSubmit}
          onModeChange={setMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onNameChange={setName}
        />
      </motion.div>
    </div>
  );
};

export default Auth;

