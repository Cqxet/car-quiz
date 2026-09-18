"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { carYear, fullName, type CarChallenge } from "@/data/cars";
import { formatYear } from "@/data/year-utils";
import { cn } from "@/lib/utils";

const PAGE = 36;
const YEAR_RANGES = [
  { id: "all", label: "Tum yillar", min: 1886, max: 2026 },
  { id: "pre80", label: "1980 oncesi", min: 1886, max: 1979 },
  { id: "80s90s", label: "1980 - 1999", min: 1980, max: 1999 },
  { id: "2000s", label: "2000 - 2009", min: 2000, max: 2009 },
  { id: "2010s", label: "2010 - 2019", min: 2010, max: 2019 },
  { id: "2020s", label: "2020 ve sonrasi", min: 2020, max: 2026 },
] as const;

type ViewFilter = "all" | "front" | "rear";

function photoView(car: CarChallenge): ViewFilter {
  const t = decodeURIComponent(car.image).toLowerCase();
  if (/\b(rear|heck|hinten|back view|arriere)\b/.test(t)) return "rear";
  if (/\b(front|vorne|grille)\b/.test(t)) return "front";
  return "all";
}

function norm(s: string) {
  return s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
            {loading ? "Liste yukleniyor" : `${filtered.length.toLocaleString("tr-TR")} araba`}
          </p>
        </div>
        <Button variant="secondary" onClick={onBack}>Ana ekran</Button>
      </header>
      <Input
        value={q}
        onChange={(e) => setFilter(setQ, e.target.value)}
        placeholder="Marka veya model ara"
        className="h-11 border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
      />
      <div className="flex flex-wrap gap-2">
        {YEAR_RANGES.map((r) => (
          <Button key={r.id} type="button" size="sm" variant={yearId === r.id ? "default" : "secondary"} onClick={() => setFilter(setYearId, r.id)}>
            {r.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {([["all", "Hepsi"], ["front", "On"], ["rear", "Arka"]] as const).map(([id, label]) => (
          <Button key={id} type="button" size="sm" variant={view === id ? "default" : "secondary"} onClick={() => setFilter(setView, id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
        <Button type="button" size="sm" variant={brand === "all" ? "default" : "secondary"} onClick={() => setFilter(setBrand, "all")}>
          Tum markalar
        </Button>
        {brands.slice(0, 80).map(([name, n]) => (
          <Button key={name} type="button" size="sm" variant={brand === name ? "default" : "secondary"} onClick={() => setFilter(setBrand, name)}>
            {name} ({n})
          </Button>
        ))}
      </div>
      {slice.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">Bu filtrelere uyan araba yok.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slice.map((car) => (
            <li key={car.id}>
              <button type="button" onClick={() => setOpen(car)} className="w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-left">
                <div className="aspect-[16/10] overflow-hidden bg-zinc-900">
                  <img src={car.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-2.5">
                  <p className="line-clamp-2 text-sm font-medium text-white">{fullName(car)}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{formatYear(car) || "yil yok"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <div className="flex items-center justify-center gap-3 pb-8">
          <Button variant="secondary" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Onceki</Button>
          <p className="text-sm text-zinc-400">{safePage + 1} / {pages}</p>
          <Button variant="secondary" disabled={safePage + 1 >= pages} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>Sonraki</Button>
        </div>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          <div className={cn("max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950")} onClick={(e) => e.stopPropagation()}>
            <img src={open.image} alt="" className="max-h-[60vh] w-full bg-black object-contain" />
            <div className="space-y-1 p-4">
              <p className="text-lg font-semibold text-white">{fullName(open)}</p>
              <p className="text-sm text-zinc-400">{formatYear(open) || "Yil yok"}</p>
              <Button className="mt-3 w-full" onClick={() => setOpen(null)}>Kapat</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
