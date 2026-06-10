import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import { PixelrisesNavbar } from "@/components/PixelrisesNavbar";
import SEOHead from "@/components/SEOHead";
import GlobalBg from "@/components/ui/global-bg";
import { useTranslation } from "@/i18n/useTranslation";

const PublicPricing = () => {
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-white">
      <SEOHead
        title="Prix et offres Pixelrises | Creation de site, maintenance et espace IA"
        description="Consultez les offres publiques Pixelrises : delegation de site, creation autonome avec credits et maintenance."
        path="/pricing"
        keywords={[
          "prix Pixelrises",
          "offres Pixelrises",
          "creation site internet",
          "maintenance site web",
          "abonnement IA",
        ]}
      />
      <GlobalBg />

      <main className="relative z-10">
        <div className="container mx-auto px-5 pt-8">
          <PixelrisesNavbar
            locale={locale}
            isLoggedIn={false}
            onLocaleChange={setLocale}
            onWorkspaceClick={() => navigate("/auth")}
            onSignOut={() => undefined}
          />
        </div>

        <Pricing />
        <Footer />
      </main>
    </div>
  );
};

export default PublicPricing;
