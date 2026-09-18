import { NextRequest } from "next/server";

const ALLOW = ["commons.wikimedia.org", "upload.wikimedia.org", "wikipedia.org"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u") || "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (url.protocol !== "https:" || !ALLOW.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
    return new Response("host", { status: 400 });
  }

  const up = await fetch(url.toString(), {
    headers: {
      "User-Agent": "ArabaTesti/1.0 (car quiz image proxy)",
      Accept: "image/*,*/*",
    },
    redirect: "follow",
    cache: "force-cache",
  });
  if (!up.ok) return new Response("upstream", { status: up.status });

  const type = up.headers.get("content-type") || "image/jpeg";
  const buf = await up.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
