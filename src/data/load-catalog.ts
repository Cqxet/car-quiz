import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";
import { LOCAL_CARS } from "@/data/cars";
import { readSavedCars, saveCars } from "@/data/car-store";

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

async function fetchPart(n: number): Promise<CarChallenge[]> {
  const id = String(n).padStart(2, "0");
  const urls = [`/catalog/p${id}.json`, `/api/catalog/p/${id}`];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = (await res.json()) as CarChallenge[];
    if (Array.isArray(data) && data.length) return data;
  }
  throw new Error(`part ${id}`);
}

export async function fetchRemoteCars(): Promise<CarChallenge[]> {
  const bags: CarChallenge[][] = [];
  for (let i = 0; i < CATALOG_PARTS; i += 1) {
    bags.push(await fetchPart(i));
  }
  return applyYearEstimates(bags.flat());
}

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  let pool = merge([], LOCAL_CARS);
  const saved = await readSavedCars();
  if (saved.length) {
    pool = merge(pool, saved);
    onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba kayitli, arka planda guncelleniyor`);
  } else {
    onUpdate(pool, "Araba listesi indiriliyor");
  }

  let partIds: string[] = [];
  try {
    const res = await fetch("/api/catalog/parts");
    if (res.ok) {
      const data = (await res.json()) as { parts?: string[] };
      if (data.parts?.length) partIds = data.parts;
    }
  } catch {
    /* fall through */
  }
  if (!partIds.length) {
    partIds = Array.from({ length: CATALOG_PARTS }, (_, i) => String(i).padStart(2, "0"));
  }

  let got = 0;
  for (let i = 0; i < partIds.length; i += 1) {
    try {
      const part = await fetchPart(Number.parseInt(partIds[i]!, 10));
      const withYears = applyYearEstimates(part);
      pool = merge(pool, withYears);
      await saveCars(withYears);
      got += 1;
      onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba hazir (${got}/${partIds.length})`);
    } catch {
      /* skip */
    }
  }
  if (got === 0 && pool.length <= LOCAL_CARS.length) {
    throw new Error("catalog fetch failed");
  }
  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba bu cihazda kayitli`);
  return pool;
}
