import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ n: string }> },
) {
  const { n } = await ctx.params;
  if (!/^\d{2}$/.test(n)) {
    return NextResponse.json({ error: "bad part" }, { status: 400 });
  }
  try {
    const file = path.join(process.cwd(), "src/data/catalog", `p${n}.json`);
    const buf = await readFile(file);
    return new NextResponse(buf, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "missing part" }, { status: 404 });
  }
}
