import { useEffect, useRef, useState } from "react";
import AnimatedSection from "./AnimatedSection";
import AnimatedCounter from "@/components/ui/animated-counter";
import { Star, ChevronLeft, ChevronRight, Quote, BadgeCheck, TrendingUp, Users, Clock } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

type Review = {
  text: string;
  textEn: string;
  author: string;
  role: string;
  roleEn: string;
  result: string;
  resultEn: string;
  date: string;
  color: string;
};

const GOOGLE_REVIEW_LINK = "https://g.page/r/CYU7tQR5jXP6EBM/review";

const reviews: Review[] = [
  { text: "Site moderne, professionnel et efficace. Exactement ce que je cherchais pour mon activité. Le rendu final a dépassé mes attentes.", textEn: "Modern, professional and effective website. Exactly what I needed. The final result exceeded my expectations.", author: "Mohamed D.", role: "Entrepreneur", roleEn: "Entrepreneur", result: "+40% de demandes en 2 semaines", resultEn: "+40% requests in 2 weeks", date: "Il y a 3 semaines", color: "from-blue-500 to-cyan-500" },
  { text: "Très satisfait du résultat. Service sérieux, rapide et à l'écoute. Je recommande à 100% pour qui veut un vrai site pro.", textEn: "Very satisfied with the result. Serious, fast and attentive service. 100% recommend for a real pro website.", author: "Tony D.", role: "Gérant restaurant", roleEn: "Restaurant manager", result: "Réservations multipliées x3", resultEn: "Bookings multiplied x3", date: "Il y a 1 mois", color: "from-purple-500 to-pink-500" },
  { text: "Je recommande vivement. Un site de qualité supérieure livré rapidement, avec un suivi parfait. Le rapport qualité/prix est imbattable.", textEn: "Highly recommend. Top quality site delivered fast, perfect follow-up. Unbeatable value.", author: "You G.", role: "Indépendant", roleEn: "Freelancer", result: "Premiers clients en 10 jours", resultEn: "First clients in 10 days", date: "Il y a 2 mois", color: "from-amber-500 to-orange-500" },
  { text: "Incroyable travail, bien au-delà de mes attentes. Mon site attire enfin des clients qualifiés, le SEO fonctionne dès le premier mois.", textEn: "Incredible work, far beyond expectations. My site finally attracts qualified leads, SEO works from month one.", author: "Nassim", role: "Coach sportif", roleEn: "Sports coach", result: "+12 clients qualifiés / mois", resultEn: "+12 qualified leads / month", date: "Il y a 3 semaines", color: "from-emerald-500 to-teal-500" },
  { text: "Excellent service. Depuis mon nouveau site, je reçois plus de demandes chaque semaine. La conversion est nettement supérieure.", textEn: "Excellent service. Since my new site I get more inquiries every week. Conversion is way higher.", author: "Zaki", role: "Artisan BTP", roleEn: "Construction pro", result: "Devis en hausse de +60%", resultEn: "Quotes up by +60%", date: "Il y a 1 mois", color: "from-rose-500 to-red-500" },
];

const initials = (name: string) => name.replace(/\./g, "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const Reviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { locale } = useTranslation();
  const isFr = locale !== "en";
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % reviews.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  const featured = reviews[active];
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) setActive((a) => (a - 1 + reviews.length) % reviews.length);
    else if (dx < -50) setActive((a) => (a + 1) % reviews.length);
    touchStartX.current = null;
    setTimeout(() => setPaused(false), 4000);
  };

  return (
    <section className="landing-section" id="avis">
      <div className="pointer-events-none absolute inset-0 -z-10"><div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-transparent" /></div>
      <div className="landing-section-inner">
        <AnimatedSection>
          <div className="text-center mb-10">
            <p className="section-title">{isFr ? "Témoignages" : "Testimonials"}</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-4">{isFr ? <>Ils nous ont fait confiance et obtenu des <span className="shimmer-text">résultats</span></> : <>They trusted us and got <span className="shimmer-text">results</span></>}</h2>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-2.5 rounded-full border border-border bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2"><div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}</div><span className="text-sm font-bold">4.9/5</span></div>
              <span className="hidden sm:inline w-px h-4 bg-border" />
              <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">8</span> {isFr ? "avis Google vérifiés" : "verified Google reviews"}</span>
              <span className="hidden sm:inline w-px h-4 bg-border" />
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-primary" />{isFr ? "+30 sites créés" : "+30 sites created"}</span>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="max-w-3xl mx-auto mb-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="relative glass-card magnetic-glow p-6 sm:p-10 overflow-hidden touch-pan-y select-none">
              <div className={`absolute inset-0 bg-gradient-to-br ${featured.color} opacity-[0.06]`} />
              <Quote className="w-10 h-10 text-primary/20 mb-4 relative" />
              <div key={active} className="relative animate-fade-in">
                <p className="text-base sm:text-lg leading-relaxed text-foreground font-medium mb-6">"{isFr ? featured.text : featured.textEn}"</p>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${featured.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>{initials(featured.author)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5"><p className="text-sm font-bold text-foreground truncate">{featured.author}</p><BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" /></div>
                    <p className="text-xs text-muted-foreground">{isFr ? featured.role : featured.roleEn} · {featured.date}</p>
                  </div>
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />)}</div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"><TrendingUp className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">{isFr ? featured.result : featured.resultEn}</span></div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-6 relative">{reviews.map((_, i) => <button key={i} onClick={() => setActive(i)} aria-label={`Avis ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === active ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`} />)}</div>
            </div>
          </div>
        </AnimatedSection>

        <div className="relative max-w-5xl mx-auto">
          <button onClick={() => scroll("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hidden sm:flex" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hidden sm:flex" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scroll-smooth touch-pan-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
            {reviews.map((review, index) => {
              const isActive = index === active;
              return (
                <button key={index} onClick={() => setActive(index)} className={`snap-center flex-shrink-0 w-[260px] sm:w-[290px] text-left glass-card p-5 flex flex-col transition-all duration-300 ${isActive ? "ring-2 ring-primary/40 scale-[1.02]" : "hover:ring-1 hover:ring-primary/20 opacity-90 hover:opacity-100"}`}>
                  <div className="flex items-center gap-3 mb-3"><div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{initials(review.author)}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><p className="text-xs font-bold text-foreground truncate">{review.author}</p><BadgeCheck className="w-3 h-3 text-primary flex-shrink-0" /></div><p className="text-[10px] text-muted-foreground truncate">{isFr ? review.role : review.roleEn}</p></div><div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-primary text-primary" />)}</div></div>
                  <p className="text-xs text-foreground/90 leading-relaxed flex-grow mb-3 line-clamp-4">"{isFr ? review.text : review.textEn}"</p>
                  <div className="flex items-center gap-1.5 pt-3 border-t border-border/60"><TrendingUp className="w-3 h-3 text-primary flex-shrink-0" /><span className="text-[10px] font-semibold text-primary truncate">{isFr ? review.result : review.resultEn}</span></div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">{reviews.map((_, i) => <button key={i} onClick={() => { if (!scrollRef.current) return; const card = scrollRef.current.children[i] as HTMLElement | undefined; card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); setActive(i); }} aria-label={`${isFr ? "Avis" : "Review"} ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40"}`} />)}</div>
          <p className="text-center text-[10px] text-muted-foreground mt-2 sm:hidden">{isFr ? "← Glissez pour voir plus →" : "← Swipe to see more →"}</p>
        </div>

        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mt-10">
            {[
              { icon: Users, counter: <AnimatedCounter value={30} prefix="+" />, label: isFr ? "sites" : "sites" },
              { icon: Star, counter: <AnimatedCounter value={4.9} decimals={1} suffix="/5" />, label: isFr ? "satisfaction" : "rating" },
              { icon: Clock, counter: <><AnimatedCounter value={3} prefix="<" />j</>, label: isFr ? "livraison" : "delivery" },
            ].map((s, i) => <div key={i} className="text-center p-4 rounded-xl glass-card"><s.icon className="w-4 h-4 text-primary mx-auto mb-1.5" /><p className="text-lg sm:text-xl font-bold text-foreground">{s.counter}</p><p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p></div>)}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="text-center mt-8">
            <a href={GOOGLE_REVIEW_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded-full px-5 py-2.5 hover:border-primary/40 hover:bg-primary/5">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {isFr ? "Voir les avis Google vérifiés" : "See verified Google reviews"}
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Reviews;

