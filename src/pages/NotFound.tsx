import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Sparkles, User, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  const suggestions = [
    { href: "/", label: "Accueil", icon: Home, desc: "Retourner à la page principale" },
    { href: "/ai", label: "Créer mon site", icon: Sparkles, desc: "Créer un site en quelques minutes" },
    { href: "/auth", label: "Connexion", icon: User, desc: "Accéder à votre espace Pixelrises" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <SEOHead
        title="Page introuvable | Pixelrises"
        description="Cette page Pixelrises n'existe pas ou a été déplacée."
        noIndex
      />
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Page introuvable</h1>
        <p className="text-sm text-muted-foreground mb-8">
          La page <span className="text-foreground font-medium">{location.pathname}</span> n'existe pas ou a été déplacée.
        </p>

        <div className="space-y-3 mb-8">
          {suggestions.map((s) => (
            <Link
              key={s.href}
              to={s.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>

        <Button asChild variant="outline" size="sm">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

