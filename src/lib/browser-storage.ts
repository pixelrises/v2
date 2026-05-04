type StorageKind = "local" | "session";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
};

const fallbackStorage: Record<StorageKind, Storage> = {
  local: createMemoryStorage(),
  session: createMemoryStorage(),
};

const probeStorage = (storage: Storage) => {
  const probeKey = "__pixelrises_probe__";
  storage.setItem(probeKey, "1");
  storage.removeItem(probeKey);
};

export const getSafeStorage = (kind: StorageKind): Storage => {
  if (typeof window === "undefined") {
    return fallbackStorage[kind];
  }

  try {
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    probeStorage(storage);
    return storage;
  } catch {
    return fallbackStorage[kind];
  }
};

export const safeLocalStorage = () => getSafeStorage("local");
export const safeSessionStorage = () => getSafeStorage("session");
