import { useState, useEffect } from "react";
import AnimatedSection from "./AnimatedSection";
import { Users, Star, Shield, Wifi, BadgeCheck } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const SocialProof = () => {
  const { locale } = useTranslation();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 8) + 3);
    const iv = setInterval(() => setOnlineCount(Math.floor(Math.random() * 8) + 3), 30000);
    return () => clearInterval(iv);
  }, []);

  const isFr = locale !== "en";
  const stats = [
    { icon: Users, value: "+30", label: isFr ? "sites créés" : "sites created" },
    { icon: BadgeCheck, value: "8", label: isFr ? "avis Google vérifiés" : "verified Google reviews" },
    { icon: Star, value: "4.9/5", label: isFr ? "note Google" : "Google rating" },
    { icon: Shield, value: "2 voies", label: isFr ? "Autonomie ou délégation" : "Autonomy or delegation" },
  ];

  return (
    <section className="landing-section-tight">
      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="premium-shell-muted px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/8">
                    <stat.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold sm:text-xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-center">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-green-500/10 bg-green-500/8">
                  <Wifi className="h-4.5 w-4.5 text-green-400" />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-green-400 sm:text-xl">{onlineCount}</p>
                  <p className="text-xs text-muted-foreground">{isFr ? "en ligne" : "online now"}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default SocialProof;
