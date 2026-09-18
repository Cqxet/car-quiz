import { buildCatalog } from "@/data/build-catalog";
import type { CarChallenge } from "@/data/cars";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

let cache: CarChallenge[] | null = null;
let inflight: Promise<CarChallenge[]> | null = null;
let builtVer = 0;
const CACHE_VER = 4;

export async function GET() {
  try {
    if (builtVer !== CACHE_VER) {
      cache = null;
      inflight = null;
      builtVer = CACHE_VER;
    }
    if (!cache) {
      inflight ??= buildCatalog();
      cache = await inflight;
    }
    return Response.json(cache);
  } catch (err) {
    inflight = null;
    const message = err instanceof Error ? err.message : "catalog failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
