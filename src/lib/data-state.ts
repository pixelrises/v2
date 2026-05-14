export type DataState = "real" | "example" | "mock" | "pending" | "error" | "empty";

export type DataStateMeta = {
  label: string;
  description: string;
};

export const dataStateMeta: Record<DataState, DataStateMeta> = {
  real: {
    label: "Données réelles",
    description: "Ces informations viennent de Supabase, d'un service connecté ou d'un événement utilisateur réel.",
  },
  example: {
    label: "Exemple",
    description: "Ces informations sont des exemples de démonstration et ne doivent pas être lues comme des résultats réels.",
  },
  mock: {
    label: "Données locales",
    description: "Ces informations viennent du navigateur ou d'un mode de démonstration clairement identifié.",
  },
  pending: {
    label: "Chargement",
    description: "Les données sont en cours de récupération.",
  },
  error: {
    label: "Erreur",
    description: "Les données n'ont pas pu être chargées correctement.",
  },
  empty: {
    label: "Aucune donnée",
    description: "Aucune donnée réelle n'est disponible pour le moment.",
  },
};

export const getDataStateMeta = (state: DataState, overrides?: Partial<DataStateMeta>): DataStateMeta => ({
  ...dataStateMeta[state],
  ...overrides,
});

export const isRealDataState = (state: DataState) => state === "real";

export const isFallbackDataState = (state: DataState) => state === "example" || state === "mock";
