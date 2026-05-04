import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Politique de cookies | Pixelrises"
        description="Informations sur les cookies utilisés par Pixelrises, leur durée de conservation et vos options de gestion."
        path="/cookies"
        keywords={["cookies", "consentement", "Pixelrises"]}
      />

      <header className="bg-secondary/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
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
            Politique de <span className="gradient-text">cookies</span>
          </h1>

          <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Qu'est-ce qu'un cookie ?</h2>
              <p>Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site internet. Il permet au site de mémoriser des informations utiles à votre navigation.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Cookies utilisés</h2>
              <p className="mb-2">Pixelrises peut utiliser les catégories suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">Cookies fonctionnels</strong> : nécessaires au bon fonctionnement du site et à la connexion utilisateur.</li>
                <li><strong className="text-foreground">Cookies de mesure d'audience</strong> : utiles pour comprendre l'usage du site et améliorer l'expérience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Durée de conservation</h2>
              <p>Les cookies sont conservés pour une durée limitée, conforme aux recommandations applicables, puis renouvelés si nécessaire avec votre navigation.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Gestion des cookies</h2>
              <p>Vous pouvez modifier vos préférences à tout moment via les réglages de votre navigateur ou de vos outils de confidentialité.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
              <p>Pour toute question relative à notre politique de cookies, contactez-nous via WhatsApp ou via le canal de contact affiché sur le site.</p>
            </section>
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

export default Cookies;
