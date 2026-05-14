const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/g,
  /\brk_(?:live|test)_[0-9A-Za-z]{16,}\b/g,
  /\bwhsec_[0-9A-Za-z]{16,}\b/g,
  /vck_[0-9A-Za-z_-]{16,}/g,
  /sb_secret_[0-9A-Za-z_-]{10,}/g,
  /sb_publishable_[0-9A-Za-z_-]{10,}/g,
  /github_pat_[0-9A-Za-z_]+/gi,
  /ghp_[0-9A-Za-z_]{20,}/g,
  /eyJ[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{10,}/g,
  /(?<=api[_-]?key["'\s:=]+)[^"',\s]+/gi,
  /(?<=authorization["'\s:=]+bearer\s+)[^"',\s]+/gi,
  /bearer\s+[0-9A-Za-z._-]+/gi,
  /(?<=cookie["'\s:=]+)[^"']+/gi,
  /(?<=secret["'\s:=]+)[^"',\s]+/gi,
  /(?<=token["'\s:=]+)[^"',\s]+/gi,
];

const personalDataPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/g,
  /\b(?:\+?\d[\s.-]?){9,15}\b/g,
];

export const redactSecrets = (value: unknown) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return secretPatterns.reduce((safe, pattern) => safe.replace(pattern, "[REDACTED]"), text ?? "");
};

export const redactPersonalDataForAI = (value: unknown) => {
  const withoutSecrets = redactSecrets(value);
  return personalDataPatterns.reduce((safe, pattern) => safe.replace(pattern, "[PERSONAL_DATA_REDACTED]"), withoutSecrets);
};

export const redactObjectSecrets = <T>(value: T): T => {
  try {
    return JSON.parse(redactPersonalDataForAI(value)) as T;
  } catch {
    return value;
  }
};
