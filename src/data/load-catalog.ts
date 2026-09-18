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
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) return null;
  return res.json();
}

async function fetchPack(): Promise<CarChallenge[]> {
  const meta = (await fetchJson("/catalog/pack/index.json")) as { parts?: string[] } | null;
  const parts = meta?.parts ?? [];
  if (!parts.length) return [];
  const bags: CarChallenge[][] = [];
  const conc = 10;
  for (let i = 0; i < parts.length; i += conc) {
    const slice = parts.slice(i, i + conc);
    const raw = await Promise.all(
      slice.map(async (name) => {
        const data = await fetchJson(`/catalog/pack/${name}`);
        return Array.isArray(data) ? (data as CompactRow[]).map(expandRow) : [];
      }),
    );
    bags.push(...raw);
  }
  return bags.flat();
}

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  onUpdate(LOCAL_CARS, "Araba listesi indiriliyor…");
  let remote: CarChallenge[] = [];
  try {
    remote = await fetchPack();
  } catch {
    remote = [];
  }
  const pool = applyYearEstimates(merge(LOCAL_CARS, remote));
  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  if (remote.length < 500) {
    throw new Error("catalog incomplete");
  }
  return pool;
}
