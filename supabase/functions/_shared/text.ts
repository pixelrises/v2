const CP1252_UNICODE_TO_BYTE: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const SUSPICIOUS_RE = /(?:\u00C3.|[\u00C2].|[\u00E2][\u0080-\u00FF\u2018-\u201E\u2020-\u2122]|[\uFFFD])/;

const mojibakeScore = (value: string) =>
  (value.match(/[\u00C3\u00C2\uFFFD]/g)?.length ?? 0) * 3 +
  (value.match(/[\u00E2][\u0080-\u00ff\u2018-\u201e\u2020-\u2122]/g)?.length ?? 0) * 2;

const toCp1252Byte = (char: string) => {
  const codePoint = char.codePointAt(0);
  if (codePoint == null) return null;
  if (codePoint <= 0xff) return codePoint;
  return CP1252_UNICODE_TO_BYTE[codePoint] ?? null;
};

const tryRepairOnce = (value: string) => {
  try {
    const bytes = Array.from(value, toCp1252Byte);
    if (bytes.some((byte) => byte == null)) {
      return value;
    }

    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(bytes as number[]),
    );
  } catch {
    return value;
  }
};

export const repairMojibake = (value: string) => {
  let current = value;

  for (let index = 0; index < 2; index += 1) {
    if (!SUSPICIOUS_RE.test(current)) {
      break;
    }

    const repaired = tryRepairOnce(current);
    if (repaired === current || mojibakeScore(repaired) >= mojibakeScore(current)) {
      break;
    }

    current = repaired;
  }

  return current.normalize("NFC");
};

export const sanitizeTextDeep = <T>(value: T): T => {
  if (typeof value === "string") {
    return repairMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeTextDeep(entry)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeTextDeep(entry)]),
    ) as T;
  }

  return value;
};
