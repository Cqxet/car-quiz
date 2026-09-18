"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { fullName, type CarChallenge } from "@/data/cars";
import { formatYear } from "@/data/year-utils";
import { YEAR_RANGES, type Difficulty } from "@/lib/quiz-core";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#1e293b,transparent_42%),#05070b] text-zinc-100">
      {children}
    </main>
  );
}

function ModeCard({
  title,
  text,
  onClick,
  disabled,
}: {
  title: string;
  text: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-amber-300/40 hover:bg-white/10 disabled:opacity-50"
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{text}</p>
    </button>
  );
}

export function HomeScreen({
  loadingPool,
  poolCount,
  poolError,
  catalogStatus,
  pendingDifficulty,
  yearRangeId,
  setYearRangeId,
  setPendingDifficulty,
  startRound,
  setBrowse,
  onClearSaved,
}: {
  loadingPool: boolean;
  poolCount: number;
  poolError: string;
  catalogStatus: string;
  pendingDifficulty: Difficulty | null;
  yearRangeId: string;
  setYearRangeId: (id: string) => void;
  setPendingDifficulty: (v: Difficulty | null) => void;
  startRound: (mode: Difficulty, rangeId?: string) => void;
  setBrowse: (v: boolean) => void;
  onClearSaved: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-amber-300/80 uppercase">Araba testi</p>
        <h1 className="font-heading mt-2 text-4xl text-balance text-white sm:text-5xl">
          Kucuk kareden arabayi bilecek misin?
        </h1>
        <p className="mt-3 text-pretty text-zinc-400">
          Site acilinca liste arka planda iner ve bu cihazda kalir. Silmezsen silinmez.
        </p>
        <p className="mt-2 text-sm text-amber-200/80">
          {catalogStatus}
          {poolCount ? ` · ${poolCount.toLocaleString("tr-TR")}` : ""}
        </p>
      </div>
      {poolError ? <p className="text-center text-sm text-amber-300">{poolError}</p> : null}
      {pendingDifficulty === "medium" ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Orta: hangi yillarin arabalari ciksin?</p>
          <div className="grid grid-cols-2 gap-2">
            {YEAR_RANGES.map((range) => (
              <Button
                key={range.id}
                type="button"
                variant={yearRangeId === range.id ? "default" : "secondary"}
                className="h-auto py-2.5 whitespace-normal"
                onClick={() => setYearRangeId(range.id)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => setPendingDifficulty(null)}>
              Geri
            </Button>
            <Button className="flex-1" onClick={() => startRound("medium", yearRangeId)}>
              Orta baslat
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <ModeCard title="Kolay" text="Dort secenekten marka ve modeli sec." onClick={() => startRound("easy")} />
          <ModeCard title="Orta" text="Yil araligini sec, o donemden arabalarin marka ve modelini bul." onClick={() => setPendingDifficulty("medium")} />
          <ModeCard title="Zor" text="Secenek yok. Marka ve modeli kendin yaz." onClick={() => startRound("hard")} />
          <ModeCard title="Inceleme" text="Arabalari yil, marka, on/arka ve arama ile suz." onClick={() => setBrowse(true)} />
          <button type="button" onClick={onClearSaved} className="text-center text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline">
            Bu cihazdaki kayitli arabalari sil
          </button>
        </div>
      )}
    </div>
  );
}

export function ResultScreen({
  results,
  total,
  onHome,
}: {
  results: { car: CarChallenge; points: number; solved: boolean }[];
  total: number;
  onHome: () => void;
}) {
  const known = results.filter((r) => r.solved).length;
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="font-heading text-center text-4xl text-white">Tur bitti</h1>
      <p className="text-center text-zinc-400">
        {known}/{results.length} bildin · {total} puan
      </p>
      <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
        {results.map((r) => (
          <li key={r.car.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <span className="text-white">
              {fullName(r.car)}
              {formatYear(r.car) ? ` · ${formatYear(r.car)}` : ""}
            </span>
            <span className={r.solved ? "text-emerald-400" : "text-zinc-500"}>{r.solved ? `${r.points} puan` : "bilemedi"}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" size="lg" onClick={onHome}>
        Mod secimine don
      </Button>
    </div>
  );
}
