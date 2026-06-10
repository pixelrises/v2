import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import PixelrisesErrorBoundary from "@/components/PixelrisesErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

const Index = lazy(() => import("./pages/Index"));
const Remboursement = lazy(() => import("./pages/Remboursement"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const CGV = lazy(() => import("./pages/CGV"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const Cookies = lazy(() => import("./pages/Cookies"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PixelrisesAI = lazy(() => import("./pages/PixelrisesAI"));
const Demo = lazy(() => import("./pages/Demo"));
const EspaceIA = lazy(() => import("./pages/EspaceIA"));
const PublicAISpace = lazy(() => import("./pages/PublicAISpace"));
const AISpaces = lazy(() => import("./pages/AISpaces"));
const AISpaceDetail = lazy(() => import("./pages/AISpaceDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Agence = lazy(() => import("./pages/Agence"));
const Realisations = lazy(() => import("./pages/Realisations"));
const Diagnostic = lazy(() => import("./pages/Diagnostic"));
const Create = lazy(() => import("./pages/Create"));
const SiteBuilder = lazy(() => import("./pages/SiteBuilder"));
const AgentBuilder = lazy(() => import("./pages/AgentBuilder"));
const GameBuilder = lazy(() => import("./pages/GameBuilder"));
const Games = lazy(() => import("./pages/Games"));
const Projects = lazy(() => import("./pages/Projects"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalyticsDetail = lazy(() => import("./pages/AnalyticsDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Templates = lazy(() => import("./pages/Templates"));
const Agents = lazy(() => import("./pages/Agents"));
const Integrations = lazy(() => import("./pages/Integrations"));
const IntegrationDetail = lazy(() => import("./pages/IntegrationDetail"));
const Automations = lazy(() => import("./pages/Automations"));
const PaymentVerification = lazy(() => import("./pages/PaymentVerification"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Preview = lazy(() => import("./pages/Preview"));
const NotificationsPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.NotificationsPage })));
const SupportPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.SupportPage })));
const SupportRequestPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.SupportRequestPage })));
const ProfilePage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.ProfilePage })));
const SecurityPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.SecurityPage })));
const RoadmapPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.RoadmapPage })));
const IntegrationDocsPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.IntegrationDocsPage })));
const CustomConnectorPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.CustomConnectorPage })));
const WebhooksPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.WebhooksPage })));
const WorkspacePage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.WorkspacePage })));
const BuilderToolPage = lazy(() => import("./pages/UtilityPages").then((mod) => ({ default: mod.BuilderToolPage })));
const PublicPricing = lazy(() => import("./pages/PublicPricing"));
const BillingPage = lazy(() => import("./pages/BillingPages").then((mod) => ({ default: mod.BillingPage })));
const CreditsPage = lazy(() => import("./pages/BillingPages").then((mod) => ({ default: mod.CreditsPage })));
const AdminBillingPage = lazy(() => import("./pages/BillingPages").then((mod) => ({ default: mod.AdminBillingPage })));

const queryClient = new QueryClient();
const RouteFallback = () => (
  <div className="min-h-screen bg-background app-grid-bg flex items-center justify-center">
    <div className="premium-shell px-6 py-4 text-sm text-muted-foreground">
      Chargement de Pixelrises...
    </div>
  </div>
);

const HashScroll = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const targetId = decodeURIComponent(hash.slice(1));
    const scrollToTarget = () => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const frame = window.requestAnimationFrame(() => {
      scrollToTarget();
      window.setTimeout(scrollToTarget, 250);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <PixelrisesErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <HashScroll />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ai" element={<PixelrisesAI />} />
                <Route path="/demo" element={<Navigate to="/dashboard-demo" replace />} />
                <Route path="/dashboard-demo" element={<Demo />} />
                <Route path="/ai-center" element={<Navigate to="/ai-spaces" replace />} />
                <Route path="/espace-ia" element={<EspaceIA />} />
                <Route path="/espace-ia/:spaceSlug" element={<PublicAISpace />} />
                <Route path="/general-ai" element={<Navigate to="/ai-spaces/general" replace />} />
                <Route path="/business-ai" element={<Navigate to="/ai-spaces/business" replace />} />
                <Route path="/student-ai" element={<Navigate to="/ai-spaces/student" replace />} />
                <Route path="/creator-ai" element={<Navigate to="/ai-spaces/creator" replace />} />
                <Route path="/management-ai" element={<Navigate to="/ai-spaces/management" replace />} />
                <Route path="/enterprise-ai" element={<Navigate to="/ai-spaces/enterprise" replace />} />
                <Route path="/ai-spaces" element={<AISpaces />} />
                <Route path="/ai-spaces/:spaceId" element={<AISpaceDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signin" element={<Navigate to="/auth" replace />} />
                <Route path="/signup" element={<Navigate to="/auth" replace />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/connexion" element={<Navigate to="/auth" replace />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/agence" element={<Agence />} />
                <Route path="/agence/:section" element={<Agence />} />
                <Route path="/realisations" element={<Realisations />} />
                <Route path="/realisations/:section" element={<Realisations />} />
                <Route path="/diagnostic" element={<Diagnostic />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cockpit" element={<Navigate to="/dashboard" replace />} />
                <Route path="/create" element={<Create />} />
                <Route path="/builder/site" element={<SiteBuilder />} />
                <Route path="/builders/site" element={<SiteBuilder />} />
                <Route path="/builder/agent" element={<AgentBuilder />} />
                <Route path="/builder/game" element={<GameBuilder />} />
                <Route path="/builders/game" element={<GameBuilder />} />
                <Route path="/builder/tools/:toolId" element={<BuilderToolPage />} />
                <Route path="/games" element={<Games />} />
                <Route path="/games/new" element={<GameBuilder />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/analytics/:section" element={<AnalyticsDetail />} />
                <Route path="/business-score" element={<Navigate to="/analytics/business-score" replace />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/billing" element={<BillingPage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/agents/new" element={<AgentBuilder />} />
                <Route path="/agents/studio" element={<AgentBuilder />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/integrations/docs" element={<IntegrationDocsPage />} />
                <Route path="/integrations/custom" element={<CustomConnectorPage />} />
                <Route path="/integrations/:integrationId" element={<IntegrationDetail />} />
                <Route path="/integrations/:integrationId/:mode" element={<IntegrationDetail />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/automations/webhooks" element={<WebhooksPage />} />
                <Route path="/automations/connectors/new" element={<CustomConnectorPage />} />
                <Route path="/automations/integrations/docs" element={<IntegrationDocsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/support/new" element={<SupportRequestPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/roadmap" element={<RoadmapPage />} />
                <Route path="/pricing" element={<PublicPricing />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/billing" element={<AdminBillingPage />} />
                <Route path="/payment-verification" element={<PaymentVerification />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/preview/:id" element={<Preview />} />
                <Route path="/s/:slug" element={<Preview />} />
                <Route path="/portfolio" element={<Navigate to="/" replace />} />
                <Route path="/remboursement" element={<Remboursement />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/cgv" element={<CGV />} />
                <Route path="/confidentialite" element={<Confidentialite />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </PixelrisesErrorBoundary>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
