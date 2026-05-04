import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";

const WHATSAPP_LINK = "https://api.whatsapp.com/send/?phone=33775256214&text=Bonjour%2C+je+souhaite+creer+un+site+web.";

const SocialIcon = ({ href, label, children }: { href: string; label: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-8 h-8 rounded-full bg-muted/60 border border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground hover:text-primary transition-all">
    {children}
  </a>
);

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="py-10 sm:py-14 pb-20 sm:pb-14 border-t border-border">
      <div className="container mx-auto px-5 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold mb-1 tracking-tight">Pixelrises</h3>
              <p className="text-xs text-muted-foreground max-w-xs">{t("footer.tagline")}</p>
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                <SocialIcon href="https://www.tiktok.com/@pixelrises" label="TikTok">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.16a8.16 8.16 0 004.76 1.53v-3.45a4.85 4.85 0 01-1-.55z"/></svg>
                </SocialIcon>
                <SocialIcon href="https://www.snapchat.com/add/pixelrises" label="Snapchat">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.21 1.5c2.75.03 4.97 1.25 6.16 3.47.53 1 .72 2.07.72 3.18 0 .7-.07 1.4-.16 2.1-.03.2.03.3.22.37.36.12.72.27 1.04.47.52.33.7.83.48 1.4-.17.43-.52.63-.96.7-.38.06-.76.08-1.14.17-.23.06-.35.17-.39.41-.11.63-.36 1.2-.73 1.72-.78 1.1-1.83 1.84-3.07 2.31-.33.13-.67.22-1 .36-.26.1-.46.28-.6.53-.22.38-.52.67-.92.85-.56.25-1.14.3-1.73.21-.4-.06-.77-.2-1.14-.37-.48-.22-.96-.26-1.47-.12-.36.1-.7.25-1.04.4-.56.24-1.14.32-1.74.18-.52-.12-.93-.42-1.2-.9-.14-.24-.33-.42-.59-.52-.34-.14-.68-.23-1.01-.37-1.24-.47-2.29-1.2-3.07-2.31-.37-.52-.62-1.09-.73-1.72-.04-.24-.16-.35-.39-.41-.38-.09-.76-.11-1.14-.17-.44-.07-.79-.27-.96-.7-.22-.57-.04-1.07.48-1.4.32-.2.68-.35 1.04-.47.19-.07.25-.17.22-.37-.09-.7-.16-1.4-.16-2.1 0-1.11.19-2.18.72-3.18C5.03 2.75 7.25 1.53 10 1.5h2.21z"/></svg>
                </SocialIcon>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.contact")}</a>
              <Link to="/mentions-legales" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.legal")}</Link>
              <Link to="/cgv" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cgv")}</Link>
              <Link to="/confidentialite" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cookies")}</Link>
              <Link to="/remboursement" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.refund")}</Link>
            </div>
          </div>
          <div className="text-center mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Pixelrises. {t("footer.rights")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
