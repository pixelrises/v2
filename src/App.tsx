import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Create = lazy(() => import("./pages/Create"));
const SiteBuilder = lazy(() => import("./pages/SiteBuilder"));
const AgentBuilder = lazy(() => import("./pages/AgentBuilder"));
const GameBuilder = lazy(() => import("./pages/GameBuilder"));
const Games = lazy(() => import("./pages/Games"));
const Projects = lazy(() => import("./pages/Projects"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Templates = lazy(() => import("./pages/Templates"));
const Agents = lazy(() => import("./pages/Agents"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Automations = lazy(() => import("./pages/Automations"));
const PaymentVerification = lazy(() => import("./pages/PaymentVerification"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Preview = lazy(() => import("./pages/Preview"));

const queryClient = new QueryClient();
const RouteFallback = () => (
  <div className="min-h-screen bg-background app-grid-bg flex items-center justify-center">
    <div className="premium-shell px-6 py-4 text-sm text-muted-foreground">
      Chargement de Pixelrises...
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <PixelrisesErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ai" element={<PixelrisesAI />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<Create />} />
                <Route path="/builder/site" element={<SiteBuilder />} />
                <Route path="/builder/agent" element={<AgentBuilder />} />
                <Route path="/builder/game" element={<GameBuilder />} />
                <Route path="/games" element={<Games />} />
                <Route path="/games/new" element={<GameBuilder />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/agents/new" element={<AgentBuilder />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/admin" element={<Admin />} />
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
