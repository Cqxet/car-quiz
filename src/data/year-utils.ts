import type { CarChallenge } from "@/data/cars";

export function parseModelYear(raw: string): number | null {
  const t = (raw || "").trim();
  if (!t) return null;
  const leading = t.match(/^\+?(\d{4})/);
  if (leading) {
    const y = Number.parseInt(leading[1], 10);
    if (y >= 1886 && y <= 2026) return y;
  }
  const match = t.match(/\b((?:18|19|20)\d{2})\b/);
  if (!match) return null;
  const y = Number.parseInt(match[1], 10);
  return y >= 1886 && y <= 2026 ? y : null;
}

export function yearFromLeadingName(raw: string): number | null {
  const t = (raw || "").replace(/^File:/i, "").replace(/_/g, " ").trim();
  const m = t.match(/^((?:18|19|20)\d{2})\b/);
  if (!m) return null;
  const y = Number.parseInt(m[1], 10);
  return y >= 1886 && y <= 2026 ? y : null;
}

export function applyYearEstimates(cars: CarChallenge[]): CarChallenge[] {
  const keyOf = (c: CarChallenge) => `${c.brand}\n${c.model}`.toLowerCase();
  const known = new Map<string, number[]>();
  for (const c of cars) {
    const y = parseModelYear(c.year);
    if (y == null) continue;
    const list = known.get(keyOf(c)) ?? [];
    list.push(y);
    known.set(keyOf(c), list);
  }
  return cars.map((c) => {
    if (parseModelYear(c.year)) return c;
    const file = decodeURIComponent((c.image.split("Special:FilePath/").pop() || c.image).split("?")[0] || "");
    const fromFile = yearFromLeadingName(file);
    if (fromFile != null) return Object.assign({}, c, { year: String(fromFile), yearGuess: true });
    const sib = known.get(keyOf(c));
    if (sib?.length) {
      const sorted = [...sib].sort((a, b) => a - b);
      return Object.assign({}, c, { year: String(sorted[Math.floor(sorted.length / 2)]), yearGuess: true });
    }
    return c;
  });
}

export function formatYear(car: CarChallenge) {
  const y = parseModelYear(car.year);
  if (y == null) return "";
  return (car as CarChallenge & { yearGuess?: boolean }).yearGuess ? `~${y}` : String(y);
}
