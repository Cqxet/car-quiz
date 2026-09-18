import { applyYearEstimates, parseModelYear, yearFromLeadingName } from "@/data/year-utils";
import type { CarChallenge } from "@/data/cars";

const WD = "https://query.wikidata.org/sparql";
const PETSCAN = "https://petscan.wmcloud.org/";
const UA = "ArabaTesti/1.0 (car quiz; https://cursor.com)";
const MAX_CARS = 32000;

const SIDE_RE =
  /\b(side[\s_-]?view|left[\s_-]?side|right[\s_-]?side|profile[\s_-]?view|lateral|seitenansicht|silhouette)\b/i;

const JUNK = new Set(
  "rear front back heck heckansicht vorne hinten arriere view views cropped flickr photo image china japan germany iaa geneva paris motor show facelift hybrid the and with at in of on by no nr".split(" "),
);

const EXTRA_BRANDS =
  "Alfa Romeo,Aston Martin,Land Rover,Range Rover,Rolls-Royce,Mercedes-Benz,Mercedes,Volkswagen,BMW,Audi,Toyota,Honda,Nissan,Mazda,Subaru,Mitsubishi,Suzuki,Lexus,Infiniti,Acura,Hyundai,Kia,Genesis,Peugeot,Renault,Citroen,Opel,Vauxhall,Fiat,Ferrari,Lamborghini,Maserati,Porsche,Bentley,Bugatti,McLaren,Jaguar,Mini,Volvo,Saab,Skoda,Seat,SEAT,Cupra,Dacia,Ford,Chevrolet,Cadillac,Buick,GMC,Dodge,Chrysler,Jeep,Ram,Tesla,Rivian,Lucid,Polestar,BYD,Geely,MG,Rover,Austin,Lotus,Lancia,Abarth,Daihatsu,Isuzu,Oldsmobile,Pontiac,Plymouth,Lincoln,Hummer,Daewoo,Lada,Holden,Smart,Maybach,Pagani,Alpine,DS".split(
    ",",
  );

type Binding = {
  item?: { value: string };
  itemLabel?: { value: string };
  image?: { value: string };
  manufacturerLabel?: { value: string };
  year?: { value: string };
};

function commonsFileUrl(filename: string) {
  const clean = filename.replace(/^File:/i, "").trim();
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=1400`;
}

function isSideView(text: string) {
  return SIDE_RE.test(text.replace(/[_-]+/g, " "));
}

function brandFrom(manu: string, label: string) {
  const hit = EXTRA_BRANDS.find((b) => label.toLowerCase().includes(b.toLowerCase()));
  if (hit) return hit;
  const b = (manu || "").trim();
  if (!b || /^Q\d+$/.test(b)) return label.split(/\s+/)[0] || "";
  const low = b.toLowerCase();
  if (low.startsWith("mercedes")) return "Mercedes-Benz";
  if (low.startsWith("ford")) return "Ford";
  return b.replace(/\s+(automobile|automobiles|motors|motor|cars|car|corporation|group)$/i, "").trim();
}

function modelFrom(label: string, brand: string) {
  let t = label.trim();
  if (brand && t.toLowerCase().startsWith(brand.toLowerCase())) {
    t = t.slice(brand.length).replace(/^[\s-]+/, "");
  }
  t = t.replace(/\s+/g, " ").trim();
  return !t || t.length > 40 ? "" : t;
}

function makeCar(
  id: string,
  brand: string,
  model: string,
  year: number | null,
  image: string,
  yearGuess = false,
): CarChallenge {
  const car: CarChallenge = {
    id,
    brand,
    model,
    year: year != null ? String(year) : "",
    aliases: [`${brand} ${model}`.toLowerCase(), model.toLowerCase()],
    image,
    focusX: 50,
    focusY: 42,
  };
  return yearGuess ? Object.assign(car, { yearGuess: true }) : car;
}

async function sparql(query: string): Promise<Binding[]> {
  let last = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const url = `${WD}?${new URLSearchParams({ query, format: "json" })}`;
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
    });
    last = res.status;
    if (res.ok) {
      const data = (await res.json()) as { results?: { bindings?: Binding[] } };
      return data.results?.bindings || [];
    }
    await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  throw new Error(`sparql ${last}`);
}

function toCar(row: Binding): CarChallenge | null {
  const label = row.itemLabel?.value?.trim() || "";
  let image = row.image?.value?.trim() || "";
  if (!label || !image || label.startsWith("Q")) return null;
  if (isSideView(label) || isSideView(decodeURIComponent(image))) return null;
  const brand = brandFrom(row.manufacturerLabel?.value?.trim() || "", label);
  const model = modelFrom(label, brand);
  if (!brand || !model) return null;
  if (image.includes("Special:FilePath/")) {
    image = commonsFileUrl(decodeURIComponent(image.split("Special:FilePath/").pop() || ""));
  }
  const qid = (row.item?.value || "").split("/").pop() || "";
  const parsed = parseModelYear(row.year?.value || "") ?? parseModelYear(label);
  return makeCar(`wd-${qid}`, brand, model, parsed, image, false);
}

async function fetchWikidataCars(): Promise<CarChallenge[]> {
  const rows = await sparql(`SELECT DISTINCT ?item ?itemLabel ?image ?manufacturerLabel ?year WHERE {
  ?item wdt:P31 wd:Q3231690 .
  ?item wdt:P18 ?image .
  OPTIONAL { ?item wdt:P176 ?manufacturer . }
  OPTIONAL { ?item wdt:P571 ?d1 . }
  OPTIONAL { ?item wdt:P580 ?d2 . }
  BIND(YEAR(COALESCE(?d1, ?d2)) AS ?yint)
  BIND(STR(?yint) AS ?year)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 8000`);
  const seen = new Set<string>();
  const out: CarChallenge[] = [];
  for (const row of rows) {
    const car = toCar(row);
    if (!car || seen.has(car.image)) continue;
    seen.add(car.image);
    out.push(car);
  }
  return out;
}

type PetPage = { title: string };

async function petscanFiles(category: string): Promise<string[]> {
  const params = new URLSearchParams({
    language: "commons",
    project: "wikimedia",
    categories: category,
    depth: "6",
    format: "json",
    doit: "1",
    negcats: "Side views of automobiles",
  });
  params.set("ns[6]", "1");
  const res = await fetch(`${PETSCAN}?${params}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`petscan ${res.status}`);
  const data = (await res.json()) as { "*": Array<{ a: { "*": PetPage[] } }> };
  return (data["*"]?.[0]?.a?.["*"] || []).map((p) => p.title).filter(Boolean);
}

function parseCommonsTitle(fileTitle: string, brands: string[]): CarChallenge | null {
  const raw = fileTitle.replace(/^File:/i, "");
  if (isSideView(raw)) return null;
  let text = raw.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
  const year = yearFromLeadingName(text);
  text = text.replace(/\([^)]*\)/g, " ").replace(/\b((?:18|19|20)\d{2})\b/g, " ");
  const words = text.replace(/[^A-Za-z0-9A-z.+-]+/g, " ").split(" ").filter((w) => w && !JUNK.has(w.toLowerCase()));
  const cleaned = words.join(" ");
  if (cleaned.length < 4) return null;
  const lower = cleaned.toLowerCase();
  const brand = brands.find((b) => lower.startsWith(b.toLowerCase()) || lower.includes(` ${b.toLowerCase()}`));
  if (!brand) return null;
  const at = lower.indexOf(brand.toLowerCase());
  const model = (cleaned.slice(0, at) + " " + cleaned.slice(at + brand.length)).replace(/\s+/g, " ").trim();
  if (!model || model.length > 40) return null;
  return makeCar(`cm-${raw.slice(0, 90)}`, brand, model, year, commonsFileUrl(raw), year != null);
}

async function fetchCommonsView(root: string, brands: string[]) {
  const titles = await petscanFiles(root);
  const seen = new Set<string>();
  const out: CarChallenge[] = [];
  for (const title of titles) {
    const car = parseCommonsTitle(title, brands);
    if (!car || seen.has(car.image)) continue;
    seen.add(car.image);
    out.push(car);
  }
  return out;
}

export async function buildCatalog(): Promise<CarChallenge[]> {
  const wd = await fetchWikidataCars();
  const brands = [...new Set([...EXTRA_BRANDS, ...wd.map((c) => c.brand)])].sort((a, b) => b.length - a.length);
  const [rear, front] = await Promise.all([
    fetchCommonsView("Rear views of automobiles", brands),
    fetchCommonsView("Front views of automobiles", brands),
  ]);
  const seen = new Set<string>();
  const out: CarChallenge[] = [];
  for (const car of [...wd, ...rear, ...front]) {
    const img = decodeURIComponent(car.image);
    if (isSideView(img) || isSideView(`${car.brand} ${car.model}`)) continue;
    if (/\bside\b/i.test(img) && !/\b(rear|front|heck|back)\b/i.test(img)) continue;
    if (seen.has(car.image)) continue;
    seen.add(car.image);
    out.push(car);
    if (out.length >= MAX_CARS) break;
  }
  return applyYearEstimates(out);
}
