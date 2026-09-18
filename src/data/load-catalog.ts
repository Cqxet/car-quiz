import type { CarChallenge } from "@/data/cars";

export async function fetchRemoteCars(): Promise<CarChallenge[]> {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error("catalog fetch failed");
  const data = (await res.json()) as CarChallenge[] | { error?: string };
  if (!Array.isArray(data)) throw new Error("catalog fetch failed");
  return data;
}
