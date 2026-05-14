import type { ComponentType } from "react";
import { BarChart3, Cloud, Code2, CreditCard, FolderOpen, SearchCheck, ShieldCheck } from "lucide-react";

export type BuilderToolId = "analytics" | "cloud" | "code" | "folders" | "payments" | "security" | "seo";

export type BuilderTool = {
  id: BuilderToolId;
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  status: "ready" | "beta" | "soon" | "configure";
};

export const builderTools: BuilderTool[] = [
  {
    id: "analytics",
    label: "Analytique",
    description: "Voir les signaux utiles et les prochaines actions.",
    href: "/analytics",
    icon: BarChart3,
    status: "ready",
  },
  {
    id: "cloud",
    label: "Cloud",
    description: "Préparer la sauvegarde et la synchronisation.",
    href: "/builder/tools/cloud",
    icon: Cloud,
    status: "beta",
  },
  {
    id: "code",
    label: "Code",
    description: "Exporter ou consulter la structure quand c'est prêt.",
    href: "/builder/tools/code",
    icon: Code2,
    status: "soon",
  },
  {
    id: "folders",
    label: "Dossiers",
    description: "Organiser les projets et versions.",
    href: "/builder/tools/folders",
    icon: FolderOpen,
    status: "ready",
  },
  {
    id: "payments",
    label: "Paiements",
    description: "Préparer les options commerciales sans action sensible.",
    href: "/builder/tools/payments",
    icon: CreditCard,
    status: "configure",
  },
  {
    id: "security",
    label: "Sécurité",
    description: "Vérifier les validations et garde-fous.",
    href: "/builder/tools/security",
    icon: ShieldCheck,
    status: "ready",
  },
  {
    id: "seo",
    label: "SEO & recherche IA",
    description: "Améliorer la visibilité avec des actions guidées.",
    href: "/builder/tools/seo",
    icon: SearchCheck,
    status: "beta",
  },
];
