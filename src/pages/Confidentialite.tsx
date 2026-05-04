import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const Confidentialite = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Politique de confidentialité | Pixelrises"
        description="Politique de confidentialité Pixelrises : collecte de données, services tiers, cookies et droits des utilisateurs."
        path="/confidentialite"
        keywords={["confidentialité", "RGPD", "Pixelrises"]}
      />

      <header className="bg-secondary/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-bold text-foreground hover:text-primary transition-colors">
            pixelrises
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">
            Politique de <span className="gradient-text">confidentialité</span>
          </h1>

          <div className="space-y-8">
            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Collecte de données</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pixelrises collecte uniquement les informations nécessaires au fonctionnement du service, à la facturation et à la relation client. Certaines données sont traitées par des services tiers sécurisés comme Supabase et Stripe.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le site utilise des cookies techniques et, selon les surfaces, des outils de mesure d'audience pour améliorer le produit. Les détails complémentaires sont disponibles dans la politique de cookies.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Services tiers</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les paiements sont traités par Stripe. Les échanges commerciaux peuvent passer par WhatsApp. L'hébergement applicatif et certaines données techniques reposent sur Supabase et l'infrastructure de déploiement choisie.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Vos droits</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données. Pour toute demande, contactez-nous via <a href="https://wa.me/message/GJQDMU67YA7JH1" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp</a>.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pixelrises. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Confidentialite;
