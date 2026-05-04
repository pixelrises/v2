import { Sparkles as SparklesParticles } from "@/components/ui/sparkles";

/**
 * Shared landing background inspired by the pricing section.
 * It sets one consistent premium atmosphere for the whole V1 home.
 */
const GlobalBg = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ contain: "strict" }}
    >
      <div className="absolute inset-0 bg-[#050505]" />

      <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0b_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="absolute left-1/2 top-[-12rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full border-[130px] border-primary/25 blur-[110px]" />
      <div className="absolute left-1/2 top-20 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
      <div className="absolute right-[-10rem] top-[24%] h-[26rem] w-[26rem] rounded-full bg-primary/6 blur-[120px]" />
      <div className="absolute bottom-[-14rem] left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(var(--primary-glow)_/_0.08)] blur-[140px]" />

      <SparklesParticles
        density={1050}
        speed={0.6}
        size={1.15}
        color="#f6d15a"
        opacity={0.45}
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(70%_54%_at_50%_18%,white,transparent_78%)]"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.12),rgba(5,5,5,0.26)_28%,rgba(5,5,5,0.52)_58%,rgba(5,5,5,0.82)_82%,rgba(5,5,5,0.95))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,transparent_0%,rgba(5,5,5,0.08)_24%,rgba(5,5,5,0.46)_64%,rgba(5,5,5,0.92)_100%)]" />
    </div>
  );
};

export default GlobalBg;
