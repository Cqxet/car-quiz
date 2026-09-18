export type CarChallenge = {
  id: string;
  brand: string;
  model: string;
  year: string;
  aliases: string[];
  /** Photo under /public */
  image: string;
  /** Headlight focus, 0–100. Zoom starts here. */
  focusX: number;
  focusY: number;
};

export const CARS: CarChallenge[] = [
  {
    id: "alfa-giulietta",
    brand: "Alfa Romeo",
    model: "Giulietta",
    year: "2016",
    aliases: ["giulietta", "guiletta", "alfa giulietta", "alfa romeo giulietta", "alfa romeo guiletta"],
    image: "/cars/alfa-giulietta.jpg",
    focusX: 42,
    focusY: 48,
  },
  {
    id: "renault-megane",
    brand: "Renault",
    model: "Megane",
    year: "2020",
    aliases: ["megane", "mégane", "renault megane", "renault mégane", "megane sedan"],
    image: "/cars/renault-megane.jpg",
    focusX: 38,
    focusY: 40,
  },
  {
    id: "pontiac-firebird",
    brand: "Pontiac",
    model: "Firebird",
    year: "2000",
    aliases: ["pontiac", "firebird", "trans am", "pontiac firebird", "pontiac trans am", "ws6"],
    image: "/cars/pontiac-firebird.jpg",
    focusX: 32,
    focusY: 48,
  },
  {
    id: "jeep-compass",
    brand: "Jeep",
    model: "Compass",
    year: "2022",
    aliases: ["compass", "jeep compass"],
    image: "/cars/jeep-compass.jpg",
    focusX: 58,
    focusY: 42,
  },
  {
    id: "vw-golf-mk5",
    brand: "Volkswagen",
    model: "Golf",
    year: "2006",
    aliases: ["vw golf", "volkswagen golf", "golf 5", "golf mk5", "golf"],
    image: "/cars/vw-golf-mk5.jpg",
    focusX: 72,
    focusY: 42,
  },
  {
    id: "aston-one-77",
    brand: "Aston Martin",
    model: "One-77",
    year: "2011",
    aliases: ["one-77", "one 77", "one77", "aston martin one-77", "aston martin one 77"],
    image: "/cars/aston-one-77.jpg",
    focusX: 42,
    focusY: 46,
  },
  {
    id: "bmw-3",
    brand: "BMW",
    model: "3 Series",
    year: "2019",
    aliases: ["bmw 3", "bmw 3 serisi", "3 serisi", "g20", "320i", "330i", "bmw 3 series"],
    image: "/cars/bmw-3.jpg",
    focusX: 48,
    focusY: 58,
  },
  {
    id: "audi-a4",
    brand: "Audi",
    model: "A4",
    year: "2023",
    aliases: ["audi a4", "a4", "b9", "a4 allroad", "audi a4 allroad"],
    image: "/cars/audi-a4.jpg",
    focusX: 52,
    focusY: 40,
  },
  {
    id: "mercedes-c",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: "2022",
    aliases: ["mercedes", "mercedes benz", "mercedes-benz", "c class", "c-class", "c serisi", "w206", "c200", "c180"],
    image: "/cars/mercedes-c.jpg",
    focusX: 46,
    focusY: 52,
  },
  {
    id: "vw-golf",
    brand: "Volkswagen",
    model: "Golf",
    year: "2020",
    aliases: ["vw golf", "volkswagen golf", "golf 8", "golf mk8", "golf"],
    image: "/cars/vw-golf.jpg",
    focusX: 18,
    focusY: 48,
  },
  {
    id: "porsche-911",
    brand: "Porsche",
    model: "911",
    year: "2023",
    aliases: ["porsche 911", "911", "carrera", "992"],
    image: "/cars/porsche-911.jpg",
    focusX: 62,
    focusY: 40,
  },
  {
    id: "mustang",
    brand: "Ford",
    model: "Mustang",
    year: "2015",
    aliases: ["ford mustang", "mustang", "mustang gt", "s550"],
    image: "/cars/mustang.jpg",
    focusX: 40,
    focusY: 46,
  },
  {
    id: "tesla-3",
    brand: "Tesla",
    model: "Model 3",
    year: "2019",
    aliases: ["tesla", "model 3", "tesla model 3", "model3"],
    image: "/cars/tesla-3.jpg",
    focusX: 22,
    focusY: 48,
  },
  {
    id: "corolla",
    brand: "Toyota",
    model: "Corolla",
    year: "2020",
    aliases: ["toyota corolla", "corolla", "e210"],
    image: "/cars/corolla.jpg",
    focusX: 38,
    focusY: 52,
  },
  {
    id: "civic",
    brand: "Honda",
    model: "Civic",
    year: "2024",
    aliases: ["honda civic", "civic", "civic 11"],
    image: "/cars/civic.jpg",
    focusX: 42,
    focusY: 54,
  },
  {
    id: "peugeot-3008",
    brand: "Peugeot",
    model: "3008",
    year: "2021",
    aliases: ["peugeot 3008", "3008", "pejo 3008"],
    image: "/cars/peugeot-3008.jpg",
    focusX: 48,
    focusY: 48,
  },
  {
    id: "clio",
    brand: "Renault",
    model: "Clio",
    year: "2020",
    aliases: ["renault clio", "clio", "clio 5"],
    image: "/cars/clio.jpg",
    focusX: 48,
    focusY: 46,
  },
  {
    id: "tucson",
    brand: "Hyundai",
    model: "Tucson",
    year: "2025",
    aliases: ["hyundai tucson", "tucson", "tucson nx4"],
    image: "/cars/tucson.jpg",
    focusX: 54,
    focusY: 48,
  },
  {
    id: "fiat-500",
    brand: "Fiat",
    model: "500",
    year: "2017",
    aliases: ["fiat 500", "500", "fiat cinquecento"],
    image: "/cars/fiat-500.jpg",
    focusX: 62,
    focusY: 48,
  },
  {
    id: "mini-cooper",
    brand: "Mini",
    model: "Cooper",
    year: "2015",
    aliases: ["mini", "mini cooper", "cooper", "f56"],
    image: "/cars/mini-cooper.jpg",
    focusX: 48,
    focusY: 42,
  },
  {
    id: "volvo-xc60",
    brand: "Volvo",
    model: "XC60",
    year: "2023",
    aliases: ["volvo xc60", "xc60", "xc 60"],
    image: "/cars/volvo-xc60.jpg",
    focusX: 28,
    focusY: 52,
  },
  {
    id: "mazda-mx5",
    brand: "Mazda",
    model: "MX-5",
    year: "2015",
    aliases: ["mazda mx-5", "mx-5", "mx5", "miata", "mazda mx5", "mazda miata"],
    image: "/cars/mazda-mx5.jpg",
    focusX: 22,
    focusY: 48,
  },
  {
    id: "subaru-wrx",
    brand: "Subaru",
    model: "WRX",
    year: "2010",
    aliases: ["subaru wrx", "wrx", "impreza", "sti", "subaru sti", "wrx sti", "impreza wrx"],
    image: "/cars/subaru-wrx.jpg",
    focusX: 64,
    focusY: 48,
  },
  {
    id: "nissan-gtr",
    brand: "Nissan",
    model: "GT-R",
    year: "2012",
    aliases: ["nissan gtr", "nissan gt-r", "gt-r", "gtr", "r35", "godzilla"],
    image: "/cars/nissan-gtr.jpg",
    focusX: 28,
    focusY: 48,
  },
  {
    id: "ferrari-488",
    brand: "Ferrari",
    model: "488",
    year: "2018",
    aliases: ["ferrari 488", "488", "488 gtb", "ferrari 488 gtb"],
    image: "/cars/ferrari-488.jpg",
    focusX: 48,
    focusY: 48,
  },
  {
    id: "kia-sportage",
    brand: "Kia",
    model: "Sportage",
    year: "2023",
    aliases: ["kia sportage", "sportage"],
    image: "/cars/kia-sportage.jpg",
    focusX: 38,
    focusY: 48,
  },
  {
    id: "dacia-duster",
    brand: "Dacia",
    model: "Duster",
    year: "2024",
    aliases: ["dacia duster", "duster"],
    image: "/cars/dacia-duster.jpg",
    focusX: 58,
    focusY: 42,
  },
  {
    id: "chevrolet-camaro",
    brand: "Chevrolet",
    model: "Camaro",
    year: "2019",
    aliases: ["chevrolet camaro", "camaro", "chevy camaro", "camaro zl1"],
    image: "/cars/chevrolet-camaro.jpg",
    focusX: 62,
    focusY: 48,
  },
  {
    id: "seat-leon",
    brand: "Seat",
    model: "Leon",
    year: "2019",
    aliases: ["seat leon", "leon", "seat león", "león"],
    image: "/cars/seat-leon.jpg",
    focusX: 58,
    focusY: 48,
  },
  {
    id: "skoda-octavia",
    brand: "Skoda",
    model: "Octavia",
    year: "2011",
    aliases: ["skoda octavia", "škoda octavia", "octavia", "skoda"],
    image: "/cars/skoda-octavia.jpg",
    focusX: 32,
    focusY: 52,
  },
];

function fold(value: string) {
  return value
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLocaleLowerCase("en-US")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function carYear(car: CarChallenge): number | null {
  const direct = Number.parseInt(car.year, 10);
  if (direct >= 1886 && direct <= 2026) return direct;
  const blob = `${car.year} ${car.model} ${car.image}`;
  const match = blob.match(/\b((?:19|20)\d{2})\b/);
  if (!match) return null;
  const y = Number.parseInt(match[1], 10);
  return y >= 1886 && y <= 2026 ? y : null;
}

export function scoreGuess(guess: string, car: CarChallenge) {
  const g = fold(guess);
  if (!g) return "empty" as const;

  const brand = fold(car.brand);
  const model = fold(car.model);
  const full = `${brand} ${model}`;
  const aliases = car.aliases.map(fold);

  if (g === full || aliases.some((a) => a === g)) return "correct" as const;
  if (g.includes(full) || aliases.some((a) => g.includes(a) && a.length >= 4)) {
    return "correct" as const;
  }
  if (g.includes(brand) && g.includes(model)) return "correct" as const;

  const brandHit =
    g === brand ||
    g.startsWith(brand + " ") ||
    brand.split(" ").every((part) => g.includes(part));

  if (brandHit && !g.includes(model)) return "brand-only" as const;
  return "wrong" as const;
}

export function fullName(car: CarChallenge) {
  return `${car.brand} ${car.model}`;
}

export const LOCAL_CARS = CARS;

export const CAR_POOL: CarChallenge[] = [...LOCAL_CARS];
