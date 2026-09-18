import { carYear, fullName, type CarChallenge } from "@/data/cars";
import { hashSeed, mulberry32, shuffleWith } from "@/lib/rng";

export const MAX_REVEALS = 6;
export const START_SCALE = 3.6;
export const END_SCALE = 1;
export const ROUND_SIZE = 20;
export const DAILY_SIZE = 5;

export type Difficulty = "easy" | "medium" | "hard";

export type YearRange = {
  id: string;
  label: string;
  min: number;
  max: number;
};

export const YEAR_RANGES: YearRange[] = [
  { id: "all", label: "Tüm yıllar", min: 1886, max: 2026 },
  { id: "pre80", label: "1980 öncesi", min: 1886, max: 1979 },
  { id: "80s90s", label: "1980 – 1999", min: 1980, max: 1999 },
  { id: "2000s", label: "2000 – 2009", min: 2000, max: 2009 },
  { id: "2010s", label: "2010 – 2019", min: 2010, max: 2019 },
  { id: "2020s", label: "2020 ve sonrası", min: 2020, max: 2026 },
];

export const ZOOM_SPOTS: { x: number; y: number }[] = [
  { x: 22, y: 38 },
  { x: 78, y: 38 },
  { x: 50, y: 28 },
  { x: 50, y: 48 },
  { x: 50, y: 72 },
  { x: 16, y: 68 },
  { x: 84, y: 68 },
  { x: 10, y: 48 },
  { x: 90, y: 48 },
  { x: 35, y: 55 },
  { x: 65, y: 55 },
  { x: 48, y: 18 },
];

export function pickSpot(rng: () => number = Math.random) {
  return ZOOM_SPOTS[Math.floor(rng() * ZOOM_SPOTS.length)]!;
}

export function promptFor(mode: Difficulty) {
  return mode === "hard" ? "Kareye bak, marka ve modeli yaz." : "Dört seçenekten marka ve modeli seç.";
}

export function shuffle<T>(items: T[]) {
  return shuffleWith(items, Math.random);
}

export function rngFromSeed(seed: string) {
  return mulberry32(hashSeed(seed));
}

function similarity(car: CarChallenge, other: CarChallenge) {
  let score = 0;
  if (other.brand === car.brand) score += 40;
  const y1 = carYear(car);
  const y2 = carYear(other);
  if (y1 != null && y2 != null) score += Math.max(0, 20 - Math.abs(y1 - y2));
  const a = car.model.toLowerCase();
  const b = other.model.toLowerCase();
  if (a[0] && a[0] === b[0]) score += 6;
  if (/\d/.test(a) && a.replace(/\D/g, "") === b.replace(/\D/g, "") && a.replace(/\D/g, "")) score += 12;
  return score;
}

export function nameChoices(car: CarChallenge, pool: CarChallenge[], rng: () => number = Math.random) {
  const correct = fullName(car);
  const unique = new Map<string, CarChallenge>();
  for (const c of pool) {
    const n = fullName(c);
    if (n === correct || unique.has(n)) continue;
    unique.set(n, c);
  }
  const ranked = [...unique.values()].sort((a, b) => similarity(car, b) - similarity(car, a));
  const close = ranked.slice(0, Math.min(12, ranked.length));
  const picked = shuffleWith(close, rng).slice(0, 3).map(fullName);
  while (picked.length < 3 && ranked.length) {
    const next = ranked[picked.length]!;
    const n = fullName(next);
    if (!picked.includes(n)) picked.push(n);
    else break;
  }
  return shuffleWith([correct, ...picked.slice(0, 3)], rng);
}

export function pointsFor(used: number, solved: boolean) {
  return solved ? Math.max(10, 100 - used * 15) : 0;
}

export function displayImage(src: string) {
  if (!src || src.startsWith("/")) return src;
  if (src.includes("wikimedia.org") || src.includes("wikipedia.org")) {
    return `/api/image?u=${encodeURIComponent(src)}`;
  }
  return src;
}
