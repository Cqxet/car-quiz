import type { CarChallenge } from "@/data/cars";

type Binding = {
  item?: { value: string };
  itemLabel?: { value: string };
  image?: { value: string };
  manufacturerLabel?: { value: string };
};

function brandFrom(manu: string, label: string) {
  let b = (manu || "").trim();
  if (!b || /^Q\d+$/.test(b)) {
    const parts = label.split(/\s+/);
    if (parts.length >= 2 && ["Alfa", "Aston", "Land", "Range", "Rolls"].includes(parts[0])) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0] || "Unknown";
  }
  const low = b.toLowerCase();
  const strip = [
    " automobile",
    " automobiles",
    " motors",
    " motor",
    " cars",
    " car",
    " corporation",
    " group",
  ];
  for (const s of strip) {
    if (low.endsWith(s) && b.length > s.length + 2) {
      b = b.slice(0, b.length - s.length).trim();
    }
  }
  if (low.startsWith("mercedes")) return "Mercedes-Benz";
  if (low.startsWith("ford")) return "Ford";
  if (low.includes("skoda") || low.includes("škoda")) return "Skoda";
  if (low === "mini") return "Mini";
  return b;
}

function modelFrom(label: string, brand: string) {
  let t = label.trim();
  if (t.toLowerCase().startsWith(brand.toLowerCase())) {
    t = t.slice(brand.length).replace(/^[\s-]+/, "");
  }
  t = t.replace(/\s+/g, " ").trim();
  if (!t || t.length > 36) return "";
  return t;
}

function toCar(row: Binding): CarChallenge | null {
  const label = row.itemLabel?.value?.trim() || "";
  let image = row.image?.value?.trim() || "";
  const manu = row.manufacturerLabel?.value?.trim() || "";
  if (!label || !image || label.startsWith("Q")) return null;
  const brand = brandFrom(manu, label);
  const model = modelFrom(label, brand);
  if (!model) return null;
  if (image.includes("Special:FilePath/")) {
    const fname = decodeURIComponent(image.split("Special:FilePath/").pop() || "");
    image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fname)}?width=1400`;
  }
  const qid = (row.item?.value || "").split("/").pop() || Math.random().toString(36).slice(2);
  const aliases = Array.from(
    new Set([
      `${brand} ${model}`.toLowerCase(),
      model.toLowerCase(),
      `${brand} ${model}`.replace(/-/g, " ").toLowerCase(),
    ]),
  );
  return {
    id: `wd-${qid}`,
    brand,
    model,
    year: "",
    aliases,
    image,
    focusX: 50,
    focusY: 42,
  };
}

export async function fetchRemoteCars(): Promise<CarChallenge[]> {
  const query = `
SELECT DISTINCT ?item ?itemLabel ?image ?manufacturerLabel WHERE {
  ?item wdt:P31/wdt:P279* wd:Q3231690 .
  ?item wdt:P18 ?image .
  OPTIONAL { ?item wdt:P176 ?manufacturer . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 4000
`.trim();
  const url = `https://query.wikidata.org/sparql?${new URLSearchParams({ query, format: "json" })}`;
  const res = await fetch(url, {
    headers: { Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error("catalog fetch failed");
  const data = (await res.json()) as { results?: { bindings?: Binding[] } };
  const rows = data.results?.bindings || [];
  const seen = new Set<string>();
  const out: CarChallenge[] = [];
  for (const row of rows) {
    const car = toCar(row);
    if (!car) continue;
    if (seen.has(car.image)) continue;
    seen.add(car.image);
    out.push(car);
  }
  return out;
}
