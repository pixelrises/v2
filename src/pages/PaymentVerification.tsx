import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Receipt,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { buildAuthRoute, getCurrentRelativeUrl } from "@/lib/auth-redirect";
import { tryBootstrapAdmin } from "@/lib/admin-bootstrap";
import { BILLING_PLANS, CREDIT_PACKS } from "@/lib/billing";
import { reportFrontendError } from "@/lib/monitoring";

interface StripeEvent {
  id: string;
  type: string;
  processed_at: string;
  payload: Record<string, unknown> | null;
}

interface CreditRow {
  user_id: string;
  credits: number;
  total_used: number;
  updated_at: string;
}

const getStripeEventDetails = (event: StripeEvent) =>
  ((event.payload?.info || event.payload?.details || {}) as Record<string, unknown>);

const getPaymentProductLabel = (details: Record<string, unknown>) => {
  const packKey = typeof details.packKey === "string" ? details.packKey : typeof details.pack_key === "string" ? details.pack_key : null;
  const planKey = typeof details.planKey === "string" ? details.planKey : typeof details.plan_key === "string" ? details.plan_key : null;

  if (packKey) {
    const pack = CREDIT_PACKS.find((item) => item.key === packKey);
    if (pack?.credits === null) return `Pack ${pack.label} - credits sur mesure`;
    return pack ? `Pack ${pack.label} - ${pack.credits} crédits` : "Pack crédits";
  }

  if (planKey) {
    const plan = BILLING_PLANS.find((item) => item.key === planKey);
    return plan ? `${plan.name} mensuel` : "Abonnement Pixelrises";
  }

  return "Produit Pixelrises";
};

const STATUS_BADGE: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  ok: {
    label: "Crédité",
    cls: "bg-green-500/15 text-green-400 border-green-500/30",
    Icon: CheckCircle2,
  },
  skip: {
    label: "Ignoré",
    cls: "bg-muted text-muted-foreground border-border",
    Icon: AlertTriangle as typeof CheckCircle2,
  },
  error: {
    label: "Erreur",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    Icon: XCircle as typeof CheckCircle2,
  },
};

const PaymentVerification = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<StripeEvent[]>([]);
  const [credits, setCredits] = useState<CreditRow[]>([]);

  const load = async () => {
    setLoading(true);
    const [evRes, crRes] = await Promise.all([
      supabase
        .from("stripe_events")
        .select("id, type, processed_at, payload")
        .order("processed_at", { ascending: false })
        .limit(100),
      supabase
        .from("user_credits")
        .select("user_id, credits, total_used, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    if (evRes.error) {
      reportFrontendError("payment-verification-events", evRes.error);
      toast({
        title: "Erreur événements",
        description: evRes.error.message,
        variant: "destructive",
      });
    }
    if (crRes.error) {
      reportFrontendError("payment-verification-credits", crRes.error);
      toast({
        title: "Erreur crédits",
        description: crRes.error.message,
        variant: "destructive",
      });
    }

    setEvents((evRes.data as StripeEvent[]) || []);
    setCredits((crRes.data as CreditRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate(buildAuthRoute(getCurrentRelativeUrl()), { replace: true });
        return;
      }

      await tryBootstrapAdmin();

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Accès refusé",
          description: "Réservé aux admins.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setAuthorized(true);
      await load();
    })();

    const channel = supabase
      .channel("stripe_events_live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stripe_events" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const okEvents = useMemo(() => events.filter((event) => event.payload?.status === "ok"), [events]);

  const duplicates = useMemo(() => {
    const byKey = new Map<string, StripeEvent[]>();
    okEvents.forEach((event) => {
      const info = getStripeEventDetails(event);
      const day = String(event.processed_at || "").slice(0, 10);
      const key = `${info.userId || "unknown"}|${info.packKey || info.pack_key || info.planKey || info.plan_key || "unknown"}|${day}`;
      const current = byKey.get(key) || [];
      current.push(event);
      byKey.set(key, current);
    });
    return [...byKey.values()].filter((group) => group.length > 1);
  }, [okEvents]);

  const totalCreditedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return okEvents
      .filter((event) => String(event.processed_at).slice(0, 10) === today)
      .reduce((sum, event) => sum + Number(getStripeEventDetails(event).creditsAdded || 0), 0);
  }, [okEvents]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Vérification des accès...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Vérification des paiements | Pixelrises"
        description="Tableau de contrôle interne des événements Stripe et de l'attribution des crédits Pixelrises."
        path="/payment-verification"
        noIndex
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Vérification paiements
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audit en temps réel des événements Stripe et de l'attribution des crédits.
            </p>
          </div>
          <Button onClick={load} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Événements traités</span>
              <Receipt className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{events.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {okEvents.length} crédités · {events.length - okEvents.length} en attente ou ignorés
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Crédits ajoutés aujourd'hui</span>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-primary">+{totalCreditedToday}</div>
            <div className="text-xs text-muted-foreground mt-1">Sur les paiements validés du jour</div>
          </Card>

          <Card className={`p-5 ${duplicates.length > 0 ? "border-destructive/40" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Doublons détectés</span>
              <AlertTriangle className={`w-4 h-4 ${duplicates.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            </div>
            <div className={`text-3xl font-bold ${duplicates.length > 0 ? "text-destructive" : "text-green-400"}`}>
              {duplicates.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {duplicates.length === 0 ? "Aucun double crédit détecté" : "Action requise : vérifier les événements"}
            </div>
          </Card>
        </div>

        {duplicates.length > 0 && (
          <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
            <h2 className="font-semibold text-destructive flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Doublons potentiels
            </h2>
            <ul className="text-xs space-y-1 text-foreground/80">
              {duplicates.map((group, index) => {
                const info = group[0] ? getStripeEventDetails(group[0]) : {};
                return (
                  <li key={index} className="font-mono">
                    user {String(info.userId || "unknown").slice(0, 8)}... · {getPaymentProductLabel(info)} · <strong className="text-destructive">{group.length}x crédités</strong>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <Card className="p-0 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Derniers événements Stripe</h2>
            <p className="text-xs text-muted-foreground mt-0.5">100 plus récents · mise à jour temps réel</p>
          </div>

          {events.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
              Aucun événement reçu. Vérifie que le webhook Stripe pointe bien vers <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/functions/v1/stripe-webhook</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Produit</th>
                    <th className="px-4 py-2.5 font-medium">User</th>
                    <th className="px-4 py-2.5 font-medium">Crédits</th>
                    <th className="px-4 py-2.5 font-medium">Reçu</th>
                    <th className="px-4 py-2.5 font-medium">Event ID</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const status = event.payload?.status || "skip";
                    const info = getStripeEventDetails(event);
                    const badge = STATUS_BADGE[status] || STATUS_BADGE.skip;
                    const Icon = badge.Icon;

                    return (
                      <tr key={event.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5">
                          <Badge className={`gap-1 ${badge.cls}`} variant="outline">
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{event.type}</td>
                        <td className="px-4 py-2.5 text-xs">{getPaymentProductLabel(info)}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{info.userId ? `${String(info.userId).slice(0, 8)}...` : "—"}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold">{info.creditsAdded ? `+${info.creditsAdded}` : "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(event.processed_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-4 py-2.5 text-[10px] font-mono text-muted-foreground">{event.id.slice(0, 16)}...</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">État des crédits utilisateurs</h2>
            <p className="text-xs text-muted-foreground mt-0.5">50 plus récemment mis à jour</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Crédits dispo</th>
                  <th className="px-4 py-2.5 font-medium">Total utilisé</th>
                  <th className="px-4 py-2.5 font-medium">Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((row) => (
                  <tr key={row.user_id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.user_id.slice(0, 12)}...</td>
                    <td className="px-4 py-2.5 font-semibold">{row.credits}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.total_used}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.updated_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentVerification;
