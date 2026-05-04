const readEnv = (key: string): string => {
  const value = (Deno.env.get(key) ?? "").trim();
  if (!value) {
    throw new Error(`Configuration serveur manquante: ${key}`);
  }

  return value;
};

export const getRequiredEnv = (key: string) => readEnv(key);

export const getRequiredEnvMap = <T extends readonly string[]>(keys: T): Record<T[number], string> => {
  return keys.reduce((acc, key) => {
    acc[key] = readEnv(key);
    return acc;
  }, {} as Record<T[number], string>);
};
