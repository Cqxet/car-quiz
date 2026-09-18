use client;

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carYear, formatYear, fullName, type CarChallenge } from "@/data/cars";
import { cn } from "@/lib/utils";

const PAGE = 36;

const YEAR_RANGES = [
  { id: "all", label: "Tüm yıllar", min: 1886, max: 2026 },
  { id: "pre80", label: "1980 öncesi", min: 1886, max: 1979 },
  { id: "80s90s", label: "1980 – 1999", min: 1980, max: 1999 },
  { id: "2000s", label: "2000 – 2009", min: 2000, max: 2009 },
  { id: "2010s", label: "2010 – 2019", min: 2010, max: 2019 },
  { id: "2020s", label: "2020 ve sonrası", min: 2020, max: 2026 },
] as const;

type ViewFilter = "all" | "front" | "rear";

function photoView(car: CarChallenge): ViewFilter {
  const t = decodeURIComponent(car.image).toLowerCase();
  if (/\b(rear|heck|hinten|back view|arriere|arrière)\b/.test(t)) return "rear";
  if (/\b(front|vorne|grille)\b/.test(t)) return "front";
  return "all";
}

function norm(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function CarBrowse({
  cars,
  loading,
  onBack,
}: {
  cars: CarChallenge[];
  loading?: boolean;
  onBack: () => void;
}) {
  const [q, setQ] = useState("");
  const [yearId, setYearId] = useState<(typeof YEAR_RANGES)[number]["id"]>("all");
  const [brand, setBrand] = useState("all");
  const [view, setView] = useState<ViewFilter>("all");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<CarChallenge | null>(null);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cars) counts.set(c.brand, (counts.get(c.brand) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"));
  }, [cars]);

  const filtered = useMemo(() => {
    const range = YEAR_RANGES.find((r) => r.id === yearId) ?? YEAR_RANGES[0];
    const nq = norm(q.trim());
    return cars.filter((c) => {
      if (brand !== "all" && c.brand !== brand) return false;
      if (view !== "all" && photoView(c) !== view) return false;
      if (yearId !== "all") {
        const y = carYear(c);
        if (y == null || y < range.min || y > range.max) return false;
      }
      if (nq && !norm(`${c.brand} ${c.model} ${c.year}`).includes(nq)) return false;
      return true;
    });
  }, [cars, q, yearId, brand, view]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  function setFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(0);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] text-amber-300/80 uppercase">Araba testi</p>
          <h1 className="font-heading text-3xl text-white">Inceleme</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? "Liste yukleniyor..." : `${filtered.length.toLocaleString("tr-TR")} araba`}
            {filtered.length !== cars.length ? ` · ${cars.length.toLocaleString("tr-TR")} icinden` : ""}
            . ~ yil tahmini.
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          Ana ekran
        </Button>
      </header>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Input
          value={q}
          onChange={(e) => setFilter(setQ, e.target.value)}
          placeholder="Marka veya model ara"
          className="h-11 border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
}
