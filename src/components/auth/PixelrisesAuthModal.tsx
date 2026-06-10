import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AtSignIcon,
  Lock,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  const shouldReduceMotion = useReducedMotion();
  const [showIntro, setShowIntro] = React.useState(open);

  React.useEffect(() => {
    if (!open) {
      setShowIntro(false);
      return;
    }

    setShowIntro(true);
    const timeout = window.setTimeout(() => setShowIntro(false), shouldReduceMotion ? 760 : 1150);

    return () => window.clearTimeout(timeout);
  }, [open, shouldReduceMotion]);

  if (!open) return null;

  const isSignup = mode === "signup";

  return (
    <motion.section
      className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-[#030303] text-white"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <AuthBackground />
      <AuthOpeningAura reducedMotion={Boolean(shouldReduceMotion)} />
      <AnimatePresence>{showIntro && <AuthIntroSequence reducedMotion={Boolean(shouldReduceMotion)} />}</AnimatePresence>

      <motion.div
        className="fixed left-5 top-5 z-20 sm:left-8 sm:top-8"
        initial={shouldReduceMotion ? false : { opacity: 0, x: -18, y: -10, filter: "blur(10px)" }}
        animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
      <Link
        to="/"
        aria-label="Retour à l'accueil"
        className="inline-flex items-center gap-3 rounded-full border border-yellow-300/20 bg-black/35 px-4 py-2 text-sm font-black tracking-tight text-white shadow-[0_0_50px_rgba(250,204,21,0.08)] backdrop-blur-xl transition hover:border-yellow-300/45 hover:bg-yellow-300/10"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-yellow-300/35 bg-yellow-300/10 text-yellow-300">
          <Sparkles className="h-4 w-4" />
        </span>
        Pixelrises
      </Link>
      </motion.div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-20 sm:px-8">
        <motion.div
          className="relative w-full"
          style={{ maxWidth: 460 }}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 34, scale: 0.96, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.82, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="pointer-events-none absolute -inset-x-6 -top-8 h-28 rounded-full bg-yellow-300/25 blur-3xl"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.65 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.55, 1, 0.72], scale: [0.9, 1.08, 0.98] }}
            transition={{
              duration: shouldReduceMotion ? 0.3 : 3.2,
              repeat: shouldReduceMotion ? 0 : Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />

          <div className="relative overflow-hidden rounded-[30px] border border-yellow-300/25 bg-[linear-gradient(180deg,rgba(22,19,12,0.86),rgba(8,8,8,0.92))] p-6 shadow-[0_40px_140px_rgba(0,0,0,0.72),0_0_80px_rgba(250,204,21,0.12)] backdrop-blur-2xl sm:p-8">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[-55%] z-[1] w-1/2 rotate-12 bg-[linear-gradient(90deg,transparent,rgba(255,231,140,0.2),rgba(255,255,255,0.16),transparent)] blur-sm"
              initial={shouldReduceMotion ? false : { x: "-30%", opacity: 0 }}
              animate={shouldReduceMotion ? { opacity: 0 } : { x: "330%", opacity: [0, 0.82, 0] }}
              transition={{ duration: 1.25, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200/80 to-transparent"
              initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "center" }}
            />
            <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-yellow-300/10 blur-3xl" />

            <button
              type="button"
              aria-label="Fermer et revenir à l'accueil"
              onClick={() => onOpenChange(false)}
              className="absolute right-5 top-5 z-10 rounded-full p-1 text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              className="relative z-10 mx-auto flex w-full flex-col items-center text-center"
              style={{ maxWidth: 370 }}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.55, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.32em] text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.16)]">
                <Sparkles className="h-3.5 w-3.5" />
                Accès bêta privée
              </div>

              <h1 className="text-[28px] font-black leading-tight tracking-[-0.04em] text-white sm:text-[32px]">
                {isSignup ? "Créer un compte Pixelrises" : "Connexion à Pixelrises"}
              </h1>
              <p className="mt-3 text-sm font-medium leading-6 text-white/78">
                Accédez à votre espace IA, vos projets et vos outils.
              </p>

              {authNotice && (
                <div className="mt-5 w-full rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-4 text-left">
                  <div className="flex gap-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white">{authNotice.title}</p>
                      <p className="text-xs leading-5 text-white/65">{authNotice.description}</p>
                      {authNotice.actionHref && authNotice.actionLabel && (
                        <a
                          href={authNotice.actionHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-yellow-300/25 px-3 py-1.5 text-xs font-bold text-yellow-200 transition hover:bg-yellow-300/10"
                        >
                          {authNotice.actionLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isSupabaseConfigured && (
                <div className="mt-5 w-full rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-left text-xs leading-5 text-red-100/85">
                  Authentification à configurer sur cet environnement. Le bouton reste honnête : aucune connexion réelle n'est simulée.
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-7 h-[56px] w-full rounded-2xl border-white/12 bg-white/[0.045] text-[15px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition hover:border-yellow-300/35 hover:bg-yellow-300/10 hover:text-white"
                style={{ height: 56 }}
                onClick={onGoogle}
                disabled={loading}
              >
                <GoogleIcon className="me-3 h-5 w-5 text-white" />
                Continuer avec Google
              </Button>

              <div className="my-5 flex w-full items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-white/15" />
                <span className="rounded-full bg-black/40 px-3 text-[11px] font-black uppercase tracking-[0.34em] text-white/70">
                  Email sécurisé
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-white/15 to-white/15" />
              </div>

              <form onSubmit={onSubmit} className="w-full space-y-4 text-left">
                {isSignup && (
                  <FieldShell
                    id="auth-name"
                    label="Nom complet"
                    icon={<User className="h-4 w-4" />}
                  >
                    <Input
                      id="auth-name"
                      placeholder="Jean Dupont"
                      className={inputClassName}
                      style={inputStyle}
                      value={name}
                      onChange={(event) => onNameChange(event.target.value)}
                    />
                  </FieldShell>
                )}

                <FieldShell id="auth-email" label="Email" icon={<AtSignIcon className="h-4 w-4" />}>
                  <Input
                    id="auth-email"
                    placeholder="Email"
                    className={inputClassName}
                    style={inputStyle}
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    required
                  />
                </FieldShell>

                <FieldShell id="auth-password" label="Mot de passe" icon={<Lock className="h-4 w-4" />}>
                  <Input
                    id="auth-password"
                    placeholder="Mot de passe"
                    className={inputClassName}
                    style={inputStyle}
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    required
                  />
                </FieldShell>

                <Button
                  type="submit"
                  className="mt-2 h-[56px] w-full rounded-2xl bg-gradient-to-r from-[#ffd84d] via-[#f7c600] to-[#ffd84d] text-[15px] font-black text-black shadow-[0_18px_50px_rgba(250,204,21,0.22),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:scale-[1.01] hover:from-[#ffe680] hover:to-[#ffd84d] hover:text-black"
                  style={{ height: 56 }}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    <>
                      {isSignup ? "Créer mon compte" : "Se connecter"}
                      <ArrowRight className="ms-3 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-5 text-xs leading-5 text-white/50">
                Votre espace reste en bêta privée : testez, signalez, améliorez.
              </p>

              <div className="mt-5 flex flex-col items-center gap-3 text-xs font-bold text-white/78">
                <button
                  type="button"
                  onClick={() => onModeChange(isSignup ? "login" : "signup")}
                  className="transition hover:text-yellow-300"
                >
                  {isSignup ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? Créer un compte"}
                </button>
                <Link to="/" className="transition hover:text-yellow-300">
                  Retour à l'accueil
                </Link>
              </div>

              <div className="mt-8 flex w-full items-start gap-3 rounded-2xl border border-white/8 bg-black/25 p-4 text-left text-xs leading-5 text-white/60">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                <span>Aucun paiement live ni intégration externe n'est activé depuis cette page.</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

const inputClassName =
  "h-[56px] rounded-2xl border-white/12 bg-white/[0.055] pl-12 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] placeholder:text-white/48 focus-visible:ring-yellow-300/45";

const inputStyle: React.CSSProperties = {
  height: 56,
  paddingLeft: 48,
};

const FieldShell = ({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="sr-only">
      {label}
    </Label>
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/68">
        {icon}
      </span>
      {children}
    </div>
  </div>
);

const AuthOpeningAura = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <motion.div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_43%,rgba(255,220,85,0.28),rgba(250,204,21,0.1)_24%,transparent_58%)]"
    initial={reducedMotion ? false : { opacity: 0.95, scale: 0.82, filter: "blur(18px)" }}
    animate={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.22, filter: "blur(0px)" }}
    transition={{ duration: 1.15, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
  />
);

const AuthIntroSequence = ({ reducedMotion }: { reducedMotion: boolean }) => {
  if (reducedMotion) {
    return (
      <div
        className="pointer-events-none fixed left-0 top-0 grid h-screen w-screen place-items-center overflow-hidden bg-[#030303]"
        style={{ zIndex: 9999 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,0.38),rgba(250,204,21,0.12)_28%,transparent_62%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_center,rgba(255,214,75,0.9)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute left-1/2 top-1/2 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/80 to-transparent" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-3xl border border-yellow-300/35 bg-yellow-300/10 text-yellow-300 shadow-[0_0_65px_rgba(250,204,21,0.26)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.34em] text-yellow-300">Pixelrises</p>
            <p className="mt-2 text-xs font-semibold text-white/58">Ouverture de votre espace securise</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
    className="pointer-events-none fixed left-0 top-0 grid h-screen w-screen place-items-center overflow-hidden bg-[#030303]"
    style={{ zIndex: 9999 }}
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.42, delay: 0.82, ease: "easeOut" }}
  >
    <motion.div
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,204,21,0.32),rgba(250,204,21,0.1)_28%,transparent_62%)]"
      initial={{ scale: 0.72, opacity: 0 }}
      animate={{ scale: 1.28, opacity: [0, 1, 0.18] }}
      transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_center,rgba(255,214,75,0.9)_1px,transparent_1px)] [background-size:34px_34px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.18 }}
      transition={{ duration: 0.4 }}
    />
    <motion.div
      className="relative flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 18, scale: 0.94, filter: "blur(12px)" }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [18, 0, 0, -10],
        scale: [0.94, 1, 1, 1.03],
        filter: ["blur(12px)", "blur(0px)", "blur(0px)", "blur(6px)"],
      }}
      transition={{ duration: 1.08, times: [0, 0.34, 0.76, 1], ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid h-16 w-16 place-items-center rounded-3xl border border-yellow-300/35 bg-yellow-300/10 text-yellow-300 shadow-[0_0_65px_rgba(250,204,21,0.26)]">
        <Sparkles className="h-7 w-7" />
      </div>
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[0.34em] text-yellow-300">Pixelrises</p>
        <p className="mt-2 text-xs font-semibold text-white/58">Ouverture de votre espace securise</p>
      </div>
    </motion.div>
    <motion.div
      className="absolute left-1/2 top-1/2 h-px w-[80vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-yellow-200/80 to-transparent"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 1.02, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: "center" }}
    />
  </motion.div>
  );
};

const AuthBackground = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
    <motion.div
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(250,204,21,0.18),transparent_34%),radial-gradient(circle_at_7%_27%,rgba(250,204,21,0.16),transparent_22%),radial-gradient(circle_at_83%_18%,rgba(250,204,21,0.13),transparent_21%),linear-gradient(180deg,#040404_0%,#080705_52%,#020202_100%)]"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    />
    <motion.div
      className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_center,rgba(255,214,75,0.9)_1px,transparent_1px)] [background-size:34px_34px]"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 0.18 }}
      transition={{ duration: 1.2, delay: 0.18 }}
    />
    <motion.svg
      className="absolute inset-0 h-full w-full opacity-55"
      viewBox="0 0 1440 1080"
      preserveAspectRatio="xMidYMid slice"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 0.55 }}
      transition={{ duration: 0.9, delay: 0.18 }}
    >
      <defs>
        <linearGradient id="auth-line" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#facc15" stopOpacity="0" />
          <stop offset="0.5" stopColor="#facc15" stopOpacity="0.55" />
          <stop offset="1" stopColor="#facc15" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="auth-dot">
          <stop stopColor="#fff7b0" />
          <stop offset="0.45" stopColor="#facc15" />
          <stop offset="1" stopColor="#facc15" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.path
        d="M-90 210 C180 420 310 260 460 560 S850 840 1050 600 1180 120 1510 90"
        fill="none"
        stroke="url(#auth-line)"
        strokeWidth="1.4"
        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M-80 860 C210 790 300 1030 510 940 S850 820 1065 855 1240 720 1510 725"
        fill="none"
        stroke="url(#auth-line)"
        strokeWidth="1.2"
        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.65, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M1120 -40 L980 210 L1160 365 L1370 180 M980 210 L840 430 L1030 580 L1160 365 M80 280 L300 390 L455 610 M300 390 L140 680 L455 610 M140 680 L310 980"
        fill="none"
        stroke="#facc15"
        strokeOpacity="0.22"
        strokeWidth="1"
        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.55, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
      />
      {[
        [112, 280, 18],
        [300, 390, 8],
        [140, 680, 14],
        [310, 980, 10],
        [455, 610, 6],
        [980, 210, 12],
        [1160, 365, 8],
        [1030, 580, 6],
        [1190, 760, 14],
        [1370, 180, 12],
      ].map(([cx, cy, r]) => (
        <motion.circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="url(#auth-dot)"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0, 1, 0.78], scale: [0.35, 1.08, 1] }}
          transition={{
            duration: shouldReduceMotion ? 0.25 : 0.9,
            delay: shouldReduceMotion ? 0 : 0.38 + Number(cx) / 5200,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
    </motion.svg>
    <motion.div
      className="absolute -bottom-40 left-0 right-0 h-96 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.12),transparent_65%)]"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.38 }}
    />
  </div>
  );
};

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.479 14.265v-3.279h11.049c.108.571.164 1.247.164 1.979 0 2.46-.672 5.502-2.84 7.669C18.744 22.829 16.051 24 12.483 24 5.869 24 .308 18.613.308 12S5.869 0 12.483 0c3.659 0 6.265 1.436 8.223 3.307L18.392 5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65 3.279 3.873 7.171 3.873 12s3.777 8.721 8.606 8.721c3.132 0 4.916-1.258 6.059-2.401.927-.927 1.537-2.251 1.777-4.059l-7.836.004z" />
  </svg>
);
