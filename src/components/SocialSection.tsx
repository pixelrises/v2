import AnimatedSection from "./AnimatedSection";
import { useTranslation } from "@/i18n/useTranslation";

const socials = [
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@pixelrises",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.16a8.16 8.16 0 004.76 1.53v-3.45a4.85 4.85 0 01-1-.55z" />
      </svg>
    ),
  },
  {
    name: "Snapchat",
    href: "https://www.snapchat.com/add/pixelrises",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.21 1.5c2.75.03 4.97 1.25 6.16 3.47.53 1 .72 2.07.72 3.18 0 .7-.07 1.4-.16 2.1-.03.2.03.3.22.37.36.12.72.27 1.04.47.52.33.7.83.48 1.4-.17.43-.52.63-.96.7-.38.06-.76.08-1.14.17-.23.06-.35.17-.39.41-.11.63-.36 1.2-.73 1.72-.78 1.1-1.83 1.84-3.07 2.31-.33.13-.67.22-1 .36-.26.1-.46.28-.6.53-.22.38-.52.67-.92.85-.56.25-1.14.3-1.73.21-.4-.06-.77-.2-1.14-.37-.48-.22-.96-.26-1.47-.12-.36.1-.7.25-1.04.4-.56.24-1.14.32-1.74.18-.52-.12-.93-.42-1.2-.9-.14-.24-.33-.42-.59-.52-.34-.14-.68-.23-1.01-.37-1.24-.47-2.29-1.2-3.07-2.31-.37-.52-.62-1.09-.73-1.72-.04-.24-.16-.35-.39-.41-.38-.09-.76-.11-1.14-.17-.44-.07-.79-.27-.96-.7-.22-.57-.04-1.07.48-1.4.32-.2.68-.35 1.04-.47.19-.07.25-.17.22-.37-.09-.7-.16-1.4-.16-2.1 0-1.11.19-2.18.72-3.18C5.03 2.75 7.25 1.53 10 1.5h2.21z" />
      </svg>
    ),
  },
];

const SocialSection = () => {
  const { locale } = useTranslation();
  const isFr = locale !== "en";

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-5 sm:px-4">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {isFr ? "Suivez " : "Follow "}
              <span className="gradient-text">Pixelrises</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8">
              {isFr
                ? "Retrouvez nos coulisses, nos nouvelles creations et des conseils business concrets."
                : "Discover our latest launches, behind-the-scenes content and practical business tips."}
            </p>
            <div className="flex items-center justify-center gap-4">
              {socials.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name} className="group flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border hover:border-primary/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all group-hover:scale-105">
                    {social.icon}
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SocialSection;
