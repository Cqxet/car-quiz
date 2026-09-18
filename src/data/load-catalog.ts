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

export function expandRow(row: CompactRow): CarChallenge {
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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function parseCars(data: unknown): CarChallenge[] {
  if (!Array.isArray(data) || !data.length) return [];
  if (Array.isArray(data[0])) return (data as CompactRow[]).map(expandRow);
  return data as CarChallenge[];
}

async function fetchPack(): Promise<CarChallenge[]> {
  const meta = (await fetchJson("/catalog/pack/index.json")) as { parts?: string[] } | null;
  const parts = meta?.parts ?? [];
  if (!parts.length) return [];
  const bags: CarChallenge[][] = [];
  const conc = 10;
  for (let i = 0; i < parts.length; i += conc) {
    const slice = parts.slice(i, i + conc);
    const raw = await Promise.all(slice.map((name) => fetchJson(`/catalog/pack/${name}`)));
    bags.push(...raw.map(parseCars));
  }
  return bags.flat();
}

async function fetchLive(src: string, onTick: (n: number) => void) {
  const data = await fetchJson(`/api/catalog/live?src=${src}`);
  const cars = parseCars(data);
  onTick(cars.length);
  return cars;
}

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  onUpdate(LOCAL_CARS, "Araba listesi indiriliyor…");
  let pool = merge([], LOCAL_CARS);

  try {
    const packed = await fetchPack();
    if (packed.length) {
      pool = applyYearEstimates(merge(pool, packed));
      onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba hazır, Wikimedia büyütülüyor…`);
    }
  } catch {
    /* canlıya geç */
  }

  const add = async (src: string, label: string) => {
    try {
      const extra = await fetchLive(src, () => {});
      if (!extra.length) return;
      pool = applyYearEstimates(merge(pool, extra));
      onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba · ${label}`);
    } catch {
      /* kaynak düşerse diğerleri */
    }
  };

  await add("wd", "Wikidata");
  await add("front", "ön fotoğraflar");
  await add("rear", "arka fotoğraflar");

  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  if (pool.length <= LOCAL_CARS.length) throw new Error("catalog incomplete");
  return pool;
}
