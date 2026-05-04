const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /sk-[0-9A-Za-z_-]{20,}/g,
  /(?<=api[_-]?key["'\s:=]+)[^"',\s]+/gi,
  /(?<=authorization["'\s:=]+bearer\s+)[^"',\s]+/gi,
  /bearer\s+[0-9A-Za-z._-]+/gi,
  /(?<=cookie["'\s:=]+)[^"']+/gi,
  /(?<=secret["'\s:=]+)[^"',\s]+/gi,
  /(?<=token["'\s:=]+)[^"',\s]+/gi,
];

export const redactSecrets = (value: unknown) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return secretPatterns.reduce((safe, pattern) => safe.replace(pattern, "[REDACTED]"), text ?? "");
};

export const redactObjectSecrets = <T>(value: T): T => {
  try {
    return JSON.parse(redactSecrets(value)) as T;
  } catch {
    return value;
  }
};
