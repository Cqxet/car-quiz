import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";
import { LOCAL_CARS } from "@/data/cars";

type CompactRow = [string, string, string, string, string, number];

function merge(base: CarChallenge[], extra: CarChallenge[]) {
  const seen = new Set(base.map((c) => c.id));
  const out = [...base];
  for (const car of extra) {
    if (seen.has(car.id)) continue;
    seen.add(car.id);
    out.push(car);
  }
  return out;
}

function expandRow(row: CompactRow): CarChallenge {
  const [id, brand, model, year, file, guess] = row;
  const image = file.startsWith("http")
    ? file
    : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1400`;
  return {
    id,
    brand,
    model,
    year,
    aliases: [`${brand} ${model}`.toLowerCase(), model.toLowerCase()],
    image,
    focusX: 50,
    focusY: 42,
    ...(guess ? { yearGuess: true } : {}),
  };
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function parseCars(data: unknown): CarChallenge[] {
  if (!Array.isArray(data) || !data.length) return [];
  if (Array.isArray(data[0])) return (data as CompactRow[]).map(expandRow);
  return data as CarChallenge[];
}

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  onUpdate(LOCAL_CARS, "Araba listesi indiriliyor…");
  let pool = merge([], LOCAL_CARS);

  const packed = parseCars(await fetchJson("/api/catalog/static"));
  if (packed.length) {
    pool = applyYearEstimates(merge(pool, packed));
    onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba hazır, Wikimedia büyütülüyor…`);
  }

  const sources: Array<[string, string]> = [
    ["wd", "Wikidata"],
    ["front", "ön fotoğraflar"],
    ["rear", "arka fotoğraflar"],
  ];
  const bags = await Promise.all(sources.map(([src]) => fetchJson(`/api/catalog/live?src=${src}`)));
  for (let i = 0; i < sources.length; i += 1) {
    const extra = parseCars(bags[i]);
    if (!extra.length) continue;
    pool = applyYearEstimates(merge(pool, extra));
    onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba · ${sources[i]![1]}`);
  }

  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  if (pool.length <= LOCAL_CARS.length) throw new Error("catalog incomplete");
  return pool;
}
