import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";
import { LOCAL_CARS } from "@/data/cars";

type CompactRow = [string, string, string, string, string, number];

function merge(base: CarChallenge[], extra: CarChallenge[]): CarChallenge[] {
  const seen = new Set(base.map((c) => c.id));
  const out = [...base];
  for (const car of extra) {
    if (seen.has(car.id)) continue;
    seen.add(car.id);
    out.push(car);
  }
  return out;
}

export function expandRow(row: CompactRow): CarChallenge {
  const [id, brand, model, year, file, guess] = row;
  const image = file.startsWith("http") ? file : file;

  return {
    id,
    brand,
    model,
    year: Number(year) || 0,
    image,
    guessYear: guess,
  } as CarChallenge;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function parseCars(data: unknown): CarChallenge[] {
  if (!Array.isArray(data)) return [];
  return data as CarChallenge[];
}

export async function hydrateCatalog(
  onUpdate: (cars: CarChallenge[], status: string) => void
): Promise<CarChallenge[]> {
  onUpdate(LOCAL_CARS, "Araba listesi indiriliyor…");
  let pool = merge([], LOCAL_CARS);

  try {
    const staticRes = await fetchJson("/api/catalog/static");
    const packed = parseCars(staticRes);
    if (packed.length) {
      pool = applyYearEstimates(merge(pool, packed));
      onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba hazır, Wikimedia büyütülüyor…`);
    }
  } catch {
    /* statik yükleme başarısız olursa devam et */
  }

  const sources: Array<[string, string]> = [
    ["wd", "Wikidata"],
    ["front", "ön fotoğraflar"],
    ["rear", "arka fotoğraflar"],
  ];

  try {
    const bags = await Promise.all(
      sources.map(([src]) => fetchJson(`/api/catalog/live?src=${src}`))
    );

    for (let i = 0; i < sources.length; i += 1) {
      const extra = parseCars(bags[i]);
      if (!extra.length) continue;
      pool = applyYearEstimates(merge(pool, extra));
      onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba · ${sources[i][1]}`);
    }
  } catch {
    /* canlı veriler çekilemezse mevcut listeyle devam et */
  }

  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  return pool;
}
