import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Mentions légales | Pixelrises"
        description="Mentions légales de Pixelrises : éditeur, hébergement, propriété intellectuelle et informations de contact."
        path="/mentions-legales"
        keywords={["mentions légales", "éditeur du site", "Pixelrises"]}
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
            Mentions <span className="gradient-text">légales</span>
          </h1>

          <div className="space-y-8">
            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Éditeur du site</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le site pixelrises.fr est édité par Pixelrises, activité de création de sites web professionnels.<br />
                Responsable de publication : Krimed<br />
                Contact : <a href="https://wa.me/message/GJQDMU67YA7JH1" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Hébergement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Le site est hébergé via une infrastructure cloud sécurisée adaptée à la mise en ligne d'applications web modernes.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Propriété intellectuelle</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                L'ensemble du contenu de ce site, incluant les textes, images, éléments visuels et structure, est protégé. Toute reproduction, même partielle, sans autorisation préalable, est interdite.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">Données personnelles</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les informations liées aux paiements transitent par Stripe et les échanges commerciaux peuvent passer par WhatsApp. Pour plus de détails, consultez notre politique de confidentialité.
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

export default MentionsLegales;
