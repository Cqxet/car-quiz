import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";
import { LOCAL_CARS } from "@/data/cars";
import { EMBEDDED_PACK, type CompactRow } from "@/data/embedded-catalog";

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

export async function hydrateCatalog(onUpdate: (cars: CarChallenge[], status: string) => void) {
  onUpdate(LOCAL_CARS, "Araba listesi hazırlanıyor…");
  const packed = EMBEDDED_PACK.map(expandRow);
  const pool = applyYearEstimates([...LOCAL_CARS, ...packed]);
  onUpdate(pool, `${pool.length.toLocaleString("tr-TR")} araba yüklü`);
  return pool;
}
