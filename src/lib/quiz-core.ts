import { fullName, type CarChallenge } from "@/data/cars";

export const MAX_REVEALS = 6;
export const START_SCALE = 3.6;
export const END_SCALE = 1;
export const ROUND_SIZE = 20;

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

export function pickSpot() {
  return ZOOM_SPOTS[Math.floor(Math.random() * ZOOM_SPOTS.length)]!;
}

export function promptFor(mode: Difficulty) {
  return mode === "hard" ? "Kareye bak, marka ve modeli yaz." : "Dört seçenekten marka ve modeli seç.";
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function nameChoices(car: CarChallenge, pool: CarChallenge[]) {
  const correct = fullName(car);
  const others = shuffle(pool.filter((c) => fullName(c) !== correct))
    .slice(0, 3)
    .map(fullName);
  return shuffle([correct, ...others]);
}

export function pointsFor(used: number, solved: boolean) {
  return solved ? Math.max(10, 100 - used * 15) : 0;
}
