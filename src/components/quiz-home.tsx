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
  startDaily,
  setBrowse,
  sessionStats,
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
  startDaily: () => void;
  setBrowse: (v: boolean) => void;
  sessionStats: { played: number; solved: number; points: number };
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-amber-300/80 uppercase">Araba testi</p>
        <h1 className="font-heading mt-2 text-4xl text-balance text-white sm:text-5xl">
          Küçük kareden arabayı bilecek misin?
        </h1>
        <p className="mt-3 text-pretty text-zinc-400">
          Her soruda far, ızgara, teker veya tampon gibi rastgele bir yerden başlar. Ön ve arka fotoğraflar var; yan görünüm yok. Bilemeyince kare büyür. Liste tarayıcıya kaydedilmez.
        </p>
        <p className="mt-2 text-sm text-amber-200/80">
          {catalogStatus}
          {poolCount ? ` · ${poolCount.toLocaleString("tr-TR")}` : ""}
        </p>
        {sessionStats.played > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            Bu oturum: {sessionStats.solved}/{sessionStats.played} doğru · {sessionStats.points} puan
          </p>
        ) : null}
      </div>
      {poolError ? <p className="text-center text-sm text-amber-300">{poolError}</p> : null}
      {pendingDifficulty === "easy" ? (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Kolay: hangi yılların arabaları çıksın?</p>
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
            <Button className="flex-1" onClick={() => startRound("easy", yearRangeId)}>
              Kolay başlat
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <ModeCard title="Günün arabaları" text="Bugüne özel 5 soru. Aynı gün herkese aynı tur." onClick={startDaily} disabled={loadingPool} />
          <ModeCard title="Kolay" text="Yıl aralığını seç, o dönemden arabaların marka ve modelini dört şıktan bul." onClick={() => setPendingDifficulty("easy")} />
          <ModeCard title="Orta" text="Tüm yıllardan dört seçenek. Marka ve modeli seç. Şıklar benzer modellere yakın." onClick={() => startRound("medium")} />
          <ModeCard title="Zor" text="Seçenek yok. Marka ve modeli kendin yaz." onClick={() => startRound("hard")} />
          <ModeCard title="İnceleme" text="Arabaları yıl, marka, ön/arka ve arama ile süz, tam fotoğrafa bak." onClick={() => setBrowse(true)} />
        </div>
      )}
    </div>
  );
}

export function ResultScreen({
  results,
  total,
  shareUrl,
  onHome,
  onShare,
  copied,
}: {
  results: { car: CarChallenge; points: number; solved: boolean }[];
  total: number;
  shareUrl: string;
  onHome: () => void;
  onShare: () => void;
  copied: boolean;
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
      <div className="flex flex-col gap-2">
        <Button className="w-full" size="lg" variant="secondary" onClick={onShare}>
          {copied ? "Link kopyalandı" : "Aynı turu arkadaşınla paylaş"}
        </Button>
        {shareUrl ? <p className="truncate text-center text-xs text-zinc-500">{shareUrl}</p> : null}
        <Button className="w-full" size="lg" onClick={onHome}>
          Mod seçimine dön
        </Button>
      </div>
    </div>
  );
}
