import { readdir } from "fs/promises";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  const dir = path.join(process.cwd(), "src/data/catalog");
  const names = (await readdir(dir))
    .filter((n) => /^p\d{2}\.json$/.test(n))
    .sort();
  return Response.json({
    parts: names.map((n) => n.slice(1, 3)),
  });
}
