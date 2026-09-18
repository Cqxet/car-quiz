import { readdir, readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const dir = path.join(process.cwd(), "public/catalog/pack");
  try {
    const names = (await readdir(dir)).filter((n) => /^\d{2}\.json$/.test(n)).sort();
    const bags = await Promise.all(names.map((n) => readFile(path.join(dir, n), "utf8").then(JSON.parse)));
    return Response.json(bags.flat(), {
      headers: { "cache-control": "public, max-age=86400" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "static catalog failed";
    return Response.json({ error: message }, { status: 404 });
  }
}
