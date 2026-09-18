import { brandList, fetchCommonsView, fetchWikidataQuick } from "@/data/build-catalog";
import type { CarChallenge } from "@/data/cars";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

function compact(cars: CarChallenge[]) {
  return cars.map((c) => {
    const file = c.image.includes("Special:FilePath/")
      ? decodeURIComponent(c.image.split("Special:FilePath/").pop()?.split("?")[0] || "")
      : c.image;
    return [c.id, c.brand, c.model, c.year || "", file, c.yearGuess ? 1 : 0];
  });
}

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src") || "";
  try {
    let cars: CarChallenge[] = [];
    if (src === "wd") cars = await fetchWikidataQuick();
    else if (src === "front") cars = await fetchCommonsView("Front views of automobiles", brandList());
    else if (src === "rear") cars = await fetchCommonsView("Rear views of automobiles", brandList());
    else return Response.json({ error: "src" }, { status: 400 });
    return Response.json(compact(cars), {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "live failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
