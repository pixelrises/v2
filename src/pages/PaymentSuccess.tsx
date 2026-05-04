import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Zap, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { buildAuthRoute } from "@/lib/auth-redirect";
import { reportFrontendError } from "@/lib/monitoring";
import {
  clearPaymentReturnIntent,
  getPaymentReturnIntent,
} from "@/lib/payment-return-intent";

type Status = "polling" | "confirmed" | "timeout";
type CreditRealtimePayload = {
  credits?: number;
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 30000;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("polling");
  const [credits, setCredits] = useState<number | null>(null);
  const [previousCredits, setPreviousCredits] = useState<number | null>(null);
  const [email, setEmail] = useState<string>("");
  const [returningToProject, setReturningToProject] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;
    let timeoutTimer: number | null = null;
    let redirectTimer: number | null = null;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate(buildAuthRoute("/payment-success"), { replace: true });
          return;
        }
        setEmail(user.email || "");

        const { data: initial } = await supabase
          .from("user_credits")
          .select("credits")
          .eq("user_id", user.id)
          .maybeSingle();
        const startCredits = initial?.credits ?? 0;
        if (cancelled) return;
        setPreviousCredits(startCredits);
        setCredits(startCredits);
        const returnIntent = getPaymentReturnIntent();

        const confirmCredits = (newCredits: number) => {
          setCredits(newCredits);
          setStatus("confirmed");

          if (returnIntent) {
            clearPaymentReturnIntent();
            setReturningToProject(true);
            redirectTimer = window.setTimeout(() => {
              navigate(returnIntent.returnPath, { replace: true });
            }, 1200);
          }
        };

        realtimeChannel = supabase
          .channel(`payment_success_${user.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` },
            (payload) => {
              const newCredits =
                (payload.new as CreditRealtimePayload | null)?.credits ?? 0;
              if (newCredits > startCredits) {
                confirmCredits(newCredits);
              }
            },
          )
          .subscribe();

        const poll = async () => {
          if (cancelled) return;
          const { data } = await supabase
            .from("user_credits")
            .select("credits")
            .eq("user_id", user.id)
            .maybeSingle();
          const currentCredits = data?.credits ?? 0;
          setCredits(currentCredits);
          if (currentCredits > startCredits) {
            confirmCredits(currentCredits);
            return;
          }
          pollTimer = window.setTimeout(poll, POLL_INTERVAL_MS);
        };
        poll();

        timeoutTimer = window.setTimeout(() => {
          if (!cancelled) {
            setStatus((prev) => (prev === "confirmed" ? prev : "timeout"));
          }
        }, MAX_POLL_MS);
      } catch (error) {
        reportFrontendError("payment-success", error, undefined, "Impossible de vérifier le paiement.");
        if (!cancelled) {
          setStatus("timeout");
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      if (redirectTimer) window.clearTimeout(redirectTimer);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [navigate]);

  const added = credits !== null && previousCredits !== null ? credits - previousCredits : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Paiement confirmé | Pixelrises"
        description="Confirmation du paiement et mise à jour automatique de votre solde de crédits Pixelrises."
        path="/payment-success"
        noIndex
      />
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 text-center shadow-xl shadow-primary/5">
            <div className="flex justify-center mb-6">
              {status === "polling" && (
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              {status === "confirmed" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-11 h-11 text-green-400" />
                </motion.div>
              )}
              {status === "timeout" && (
                <div className="w-20 h-20 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-orange-400" />
                </div>
              )}
            </div>

            {status === "polling" && (
              <>
                <p className="text-[11px] font-semibold text-primary tracking-[0.2em] uppercase mb-2">
                  Vérification du paiement
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">Confirmation en cours...</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Nous attendons la confirmation de Stripe. Vos crédits seront crédités automatiquement dans quelques secondes.
                </p>
              </>
            )}

            {status === "confirmed" && (
              <>
                <p className="text-[11px] font-semibold text-green-400 tracking-[0.2em] uppercase mb-2">
                  Paiement confirmé
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                  Merci{email ? `, ${email.split("@")[0]}` : ""} !
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  {returningToProject
                    ? "Crédits confirmés, retour vers votre projet."
                    : "Votre achat a bien été enregistré. Votre solde a été mis à jour."}
                </p>
              </>
            )}

            {status === "timeout" && (
              <>
                <p className="text-[11px] font-semibold text-orange-400 tracking-[0.2em] uppercase mb-2">
                  En attente
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mb-3">Confirmation en cours côté Stripe</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Le paiement peut prendre jusqu'à une minute à être confirmé. Vos crédits apparaîtront automatiquement sur votre tableau de bord.
                </p>
              </>
            )}

            <div className="bg-secondary/40 border border-border rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Solde de crédits
                </p>
              </div>
              <motion.p
                key={credits ?? 0}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl sm:text-5xl font-extrabold text-primary"
              >
                {credits ?? "—"}
              </motion.p>
              {status === "confirmed" && added > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-green-400 font-semibold mt-1.5"
                >
                  +{added} crédits ajoutés
                </motion.p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1 gap-2 font-bold" onClick={() => navigate("/ai")}>
                <Sparkles className="w-4 h-4" />
                Créer un site
              </Button>
              <Button size="lg" variant="outline" className="flex-1 gap-2 font-medium" onClick={() => navigate("/dashboard")}>
                Tableau de bord
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {status === "timeout" && (
              <p className="text-[11px] text-muted-foreground mt-5">
                Si le solde ne se met pas à jour, contactez-nous et nous régulariserons immédiatement.
              </p>
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;


