import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

const WHATSAPP_LINK = "https://wa.me/33775256214";

const Remboursement = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Politique de remboursement | Pixelrises"
        description="Conditions de remboursement Pixelrises : garantie de satisfaction, procédure de demande et délais de traitement."
        path="/remboursement"
        keywords={["remboursement", "garantie", "Pixelrises"]}
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Politique de <span className="gradient-text">remboursement</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Votre satisfaction reste une priorité claire.
            </p>
          </div>

          <div className="card-glass p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              Garantie satisfait ou remboursé
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Pixelrises cherche à livrer un résultat exploitable et crédible. Si, après les ajustements inclus, le site ne correspond toujours pas à ce qui a été convenu, une demande de remboursement peut être étudiée rapidement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              L'objectif est de trouver d'abord une solution utile. Si ce n'est pas possible, un remboursement intégral peut être appliqué selon les conditions ci-dessous.
            </p>
          </div>

          <div className="card-glass p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Conditions de remboursement</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">1</span>
                </span>
                <div>
                  <p className="font-medium mb-1">Demande dans les 7 jours</p>
                  <p className="text-sm text-muted-foreground">
                    La demande doit être formulée dans les 7 jours suivant la livraison ou la mise à disposition du résultat concerné.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">2</span>
                </span>
                <div>
                  <p className="font-medium mb-1">Ajustements déjà utilisés</p>
                  <p className="text-sm text-muted-foreground">
                    Les modifications incluses dans l'offre doivent avoir été demandées avant de conclure à une impossibilité de validation.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">3</span>
                </span>
                <div>
                  <p className="font-medium mb-1">Contact direct</p>
                  <p className="text-sm text-muted-foreground">
                    La demande doit être envoyée directement au support avec un contexte clair sur le problème rencontré.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-sm font-bold">4</span>
                </span>
                <div>
                  <p className="font-medium mb-1">Traitement rapide</p>
                  <p className="text-sm text-muted-foreground">
                    Une fois la demande validée, le remboursement est déclenché dans les meilleurs délais sur le moyen de paiement utilisé.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card-glass p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Comment demander un remboursement ?</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Contacte-nous directement via WhatsApp avec les éléments utiles : site concerné, date de livraison, points bloquants et attentes initiales. Nous te répondons rapidement avec une solution ou une confirmation de prise en charge.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto glow-primary">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contacter le support
              </a>
            </Button>
          </div>

          <div className="card-glass p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Questions fréquentes</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Le remboursement est-il intégral ?</h3>
                <p className="text-sm text-muted-foreground">
                  Oui, si la demande est validée dans le cadre de cette politique, le montant concerné est remboursé intégralement.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Puis-je conserver le site après remboursement ?</h3>
                <p className="text-sm text-muted-foreground">
                  Non. En cas de remboursement, l'exploitation du livrable concerné n'est plus autorisée.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Quel est le délai de traitement ?</h3>
                <p className="text-sm text-muted-foreground">
                  La validation est traitée rapidement et le remboursement dépend ensuite des délais bancaires habituels du moyen de paiement utilisé.
                </p>
              </div>
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

export default Remboursement;
