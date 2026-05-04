import * as React from "react";
import { Link } from "react-router-dom";
import { AtSignIcon, ArrowRight, Lock, Sparkles, TriangleAlert, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

interface PixelrisesAuthModalProps {
  open: boolean;
  mode: Mode;
  loading: boolean;
  email: string;
  password: string;
  name: string;
  isSupabaseConfigured: boolean;
  authNotice?: {
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  } | null;
  onOpenChange: (open: boolean) => void;
  onGoogle: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onModeChange: (mode: Mode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

export function PixelrisesAuthModal({
  open,
  mode,
  loading,
  email,
  password,
  name,
  isSupabaseConfigured,
  authNotice,
  onOpenChange,
  onGoogle,
  onSubmit,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onNameChange,
}: PixelrisesAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(12,12,14,0.98),rgba(12,12,14,0.94))] p-0 text-foreground shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)] sm:max-w-[560px] sm:rounded-[28px]">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(214,178,85,0.18),transparent_70%)]" />

          <DialogHeader className="space-y-3 border-b border-white/10 px-6 pb-5 pt-6 text-left sm:px-7 sm:pt-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pixelrises AI
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold tracking-tight sm:text-[30px]">
                {mode === "login"
                  ? "Connectez-vous à votre espace"
                  : "Créez votre espace Pixelrises"}
              </DialogTitle>
              <DialogDescription className="max-w-md text-sm text-muted-foreground">
                Accédez à vos projets, vos crédits et votre publication sans friction.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6 sm:px-7">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-50/90">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div className="space-y-1">
                  <p className="font-medium text-amber-50">Accès sécurisé Pixelrises</p>
                  <p className="text-amber-50/80">
                    Le plus rapide : continuer avec Google. Sinon, utilisez votre email.
                  </p>
                  <p className="text-amber-50/80">
                    Nouvel utilisateur : 5 crédits offerts pour tester la plateforme.
                  </p>
                  {!isSupabaseConfigured && (
                    <p className="text-amber-50/80">
                      La configuration d'authentification n'est pas encore complète sur cet environnement.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {authNotice && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary-foreground/90">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{authNotice.title}</p>
                  <p className="text-sm text-muted-foreground">{authNotice.description}</p>
                  {authNotice.actionHref && authNotice.actionLabel && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-xl border-white/10 bg-background/70"
                    >
                      <a href={authNotice.actionHref} target="_blank" rel="noreferrer">
                        {authNotice.actionLabel}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-2xl border-white/10 bg-background/70 text-sm font-medium hover:bg-background"
              onClick={onGoogle}
              disabled={loading}
            >
              <GoogleIcon className="me-2 h-4 w-4" />
              Continuer avec Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-[0.24em]">
                <span className="bg-background px-4 text-muted-foreground">ou</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Entrez votre email pour vous connecter ou créer votre compte Pixelrises.
              </p>

              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Nom complet
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Jean Dupont"
                      className="h-11 rounded-2xl border-white/10 bg-background/65 pl-10"
                      value={name}
                      onChange={(event) => onNameChange(event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <AtSignIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="votre.email@exemple.com"
                    className="h-11 rounded-2xl border-white/10 bg-background/65 pl-10"
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                    className="h-11 rounded-2xl border-white/10 bg-background/65 pl-10"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl text-sm font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <ArrowRight className="me-2 h-4 w-4" />
                    {mode === "login"
                      ? "Continuer avec l'email"
                      : "Créer mon compte et commencer"}
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between gap-4 text-xs">
              <button
                type="button"
                onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {mode === "login"
                  ? "Pas encore de compte ? Créez-le"
                  : "Déjà un compte ? Connectez-vous"}
              </button>

              <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
                Retour à l'accueil
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-4 text-center text-[11px] text-muted-foreground sm:px-7">
            En continuant, vous acceptez notre{" "}
            <Link to="/confidentialite" className="text-foreground hover:underline">
              politique de confidentialité
            </Link>
            .
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);
