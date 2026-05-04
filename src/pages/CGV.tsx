import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const CGV = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Conditions générales de vente | Pixelrises"
        description="Conditions générales de vente des services Pixelrises : prestations, tarifs, livraison, remboursement et propriété intellectuelle."
        path="/cgv"
        keywords={["CGV", "conditions générales de vente", "Pixelrises"]}
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
            Conditions générales de <span className="gradient-text">vente</span>
          </h1>

          <div className="space-y-8">
            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">1. Objet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les présentes conditions générales de vente régissent les prestations proposées par Pixelrises. Toute commande implique l'acceptation pleine et entière de ces conditions.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">2. Services proposés</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pixelrises propose la création de sites vitrines professionnels, l'optimisation de sites existants et l'accès à un générateur de site business. Les livrables exacts dépendent de l'offre choisie.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">3. Tarifs et paiement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les prix sont indiqués en euros. Le paiement s'effectue en ligne via Stripe avant démarrage de la prestation ou de la recharge de crédits. Les montants applicables sont ceux affichés au moment de l'achat.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">4. Livraison</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les délais de livraison dépendent de l'offre sélectionnée et du niveau de validation nécessaire. Pixelrises s'engage à communiquer clairement les délais avant publication du site.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">5. Modifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Certaines offres incluent un nombre défini d'ajustements. Les demandes complémentaires ou hors périmètre peuvent faire l'objet d'une facturation spécifique.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">6. Garantie et remboursement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Les conditions de remboursement sont précisées dans notre <Link to="/remboursement" className="text-primary hover:underline">politique de remboursement</Link>. Toute demande est étudiée rapidement et avec transparence.
              </p>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">7. Propriété intellectuelle</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sauf mention contraire, le client devient propriétaire du site livré selon les conditions convenues. Pixelrises peut mentionner la réalisation dans son portfolio sauf opposition explicite du client.
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

export default CGV;
