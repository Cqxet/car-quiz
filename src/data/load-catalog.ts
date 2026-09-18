import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";
import { LOCAL_CARS } from "@/data/cars";

export const CATALOG_PARTS = 24;

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

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(url);
  return res.json();
}

async function fetchPart(id: string): Promise<CarChallenge[]> {
  const urls = [`/catalog/p${id}.json`, `/api/catalog/p/${id}`];
  for (const url of urls) {
    try {
      const data = await fetchJson(url);
      if (Array.isArray(data) && data.length) return data as CarChallenge[];
    } catch {
      /* dene diğer adres */
    }
  }
  return [];
}

async function listPartIds(): Promise<string[]> {
  try {
    const data = (await fetchJson("/catalog/index.json")) as { parts?: string[] };
    if (data.parts?.length) return data.parts;
  } catch {
    /* api */
  }
  try {
    const data = (await fetchJson("/api/catalog/parts")) as { parts?: string[] };
    if (data.parts?.length) return data.parts;
  } catch {
    /* fallback */
  }
  return Array.from({ length: CATALOG_PARTS }, (_, i) => String(i).padStart(2, "0"));
}

async function fetchPartsParallel(
  partIds: string[],
  onBatch: (cars: CarChallenge[], done: number, total: number) => void,
) {
  const all: CarChallenge[] = [];
  const conc = 8;
  for (let i = 0; i < partIds.length; i += conc) {
    const slice = partIds.slice(i, i + conc);
    const bags = await Promise.all(slice.map((id) => fetchPart(id)));
    for (const bag of bags) all.push(...bag);
    onBatch(all, Math.min(i + conc, partIds.length), partIds.length);
  }
  return all;
}

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  let pool = merge([], LOCAL_CARS);
  onUpdate(pool, "Araba listesi indiriliyor…");

  let remote: CarChallenge[] = [];
  try {
    const data = await fetchJson("/catalog/all.json");
    if (Array.isArray(data) && data.length > 100) remote = data as CarChallenge[];
  } catch {
    /* paket paket */
  }

  if (!remote.length) {
    const partIds = await listPartIds();
    remote = await fetchPartsParallel(partIds, (cars, done, total) => {
      const live = merge(pool, cars);
      onUpdate(live, `${live.length.toLocaleString("tr-TR")} araba (${done}/${total} paket)`);
    });
  }

  if (remote.length) {
    pool = applyYearEstimates(merge(pool, remote));
  }

  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  if (!remote.length && pool.length <= LOCAL_CARS.length) {
    throw new Error("catalog fetch failed");
  }
  return pool;
}
