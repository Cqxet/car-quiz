import { readdir, readFile } from "fs/promises";
import path from "path";
import { applyYearEstimates } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";

export const dynamic = "force-static";
export const maxDuration = 60;

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "src/data/catalog");
    const names = (await readdir(dir)).filter((n) => /^p\d{2}\.json$/.test(n)).sort();
    const bags: CarChallenge[][] = [];
    for (const name of names) {
      const raw = await readFile(path.join(dir, name), "utf8");
      bags.push(JSON.parse(raw) as CarChallenge[]);
    }
    return Response.json(applyYearEstimates(bags.flat()), {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "catalog failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
