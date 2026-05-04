const sanitizeEnvValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const publicEnv = {
  supabaseUrl: sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: sanitizeEnvValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
};

const missingVars = [
  !publicEnv.supabaseUrl && "VITE_SUPABASE_URL",
  !publicEnv.supabasePublishableKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
].filter(Boolean) as string[];

if (missingVars.length > 0) {
  throw new Error(
    `Configuration frontend manquante: ajoute ${missingVars.join(", ")} dans l'environnement local ou Vercel.`
  );
}

if (!isValidHttpUrl(publicEnv.supabaseUrl)) {
  throw new Error("VITE_SUPABASE_URL doit etre une URL http(s) valide.");
}

if (publicEnv.supabaseUrl.includes("your_supabase_url_here")) {
  throw new Error("VITE_SUPABASE_URL contient encore une valeur placeholder.");
}

if (publicEnv.supabasePublishableKey.includes("your_supabase")) {
  throw new Error("VITE_SUPABASE_PUBLISHABLE_KEY contient encore une valeur placeholder.");
}

export const PUBLIC_ENV = publicEnv;
