"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarFront } from "@/components/car-front";
import { fullName, type CarChallenge } from "@/data/cars";
import { YEAR_RANGES, type Difficulty } from "@/lib/quiz-core";

export function PlayScreen({
  car,
  crop,
  scale,
  difficulty,
  yearRangeId,
  index,
  deckLen,
  total,
  imageReady,
  resolved,
  reveals,
  message,
  tone,
  nameOptions,
  missedNames,
  guess,
  setGuess,
  onReady,
  pickName,
  goNext,
  submitText,
  grow,
}: {
  car: CarChallenge;
  crop: { x: number; y: number };
  scale: number;
  difficulty: Difficulty;
  yearRangeId: string;
  index: number;
  deckLen: number;
  total: number;
  imageReady: boolean;
  resolved: boolean;
  reveals: number;
  message: string;
  tone: "idle" | "ok" | "warn" | "bad";
  nameOptions: string[];
  missedNames: string[];
  guess: string;
  setGuess: (v: string) => void;
  onReady: () => void;
  pickName: (option: string) => void;
  goNext: () => void;
  submitText: () => void;
  grow: (reason: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-6 sm:py-10">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-amber-300/80 uppercase">
            {difficulty === "easy" ? "Kolay" : difficulty === "medium" ? "Orta" : "Zor"}
          </p>
          <h1 className="font-heading text-2xl text-white sm:text-3xl">Bu hangi araba?</h1>
          {difficulty === "medium" ? (
            <p className="mt-1 text-xs text-zinc-500">{YEAR_RANGES.find((r) => r.id === yearRangeId)?.label}</p>
          ) : null}
        </div>
        <p className="text-sm text-zinc-400">
          {index + 1}/{deckLen} · {total} puan
        </p>
      </header>
      <div className="isolate overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
        <div className="relative aspect-[16/10] overflow-hidden">
          <div
            key={car.id}
            className="absolute inset-0 origin-center will-change-transform transition-transform duration-500 ease-out"
            style={{ transform: `scale(${scale})`, transformOrigin: `${crop.x}% ${crop.y}%` }}
          >
            <CarFront car={car} crop={crop} onReady={onReady} />
          </div>
          {!imageReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950/90">
              <span className="size-9 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
              <p className="text-sm text-zinc-300">Resim yükleniyor…</p>
            </div>
          )}
          <p className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-zinc-200">
            {resolved ? "Tam görüntü" : reveals === 0 ? "Yakın kare" : `${reveals}. büyüme`}
          </p>
        </div>
      </div>
      <p
        className={
          tone === "ok" ? "text-emerald-400" : tone === "bad" ? "text-rose-300" : tone === "warn" ? "text-amber-300" : "text-zinc-400"
        }
      >
        {message}
      </p>
      {difficulty === "easy" || difficulty === "medium" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {nameOptions.map((option) => {
            const correct = option === fullName(car);
            const missed = missedNames.includes(option);
            return (
              <Button
                key={option}
                type="button"
                variant="secondary"
                className={cn(
                  "h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left",
                  resolved && correct && "border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-600 disabled:opacity-100",
                  missed && "border-red-500 bg-red-600 text-white hover:bg-red-600 disabled:opacity-100",
                )}
                disabled={!imageReady || resolved || missed}
                onClick={() => pickName(option)}
              >
                {option}
              </Button>
            );
          })}
        </div>
      ) : null}
      {resolved ? (
        <Button size="lg" className="h-11 w-full" onClick={goNext}>
          {index + 1 >= deckLen ? "Sonucu gör" : "Devam et"}
        </Button>
      ) : difficulty === "hard" ? (
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submitText();
          }}
        >
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Örn. opel astra"
            className="h-11 flex-1 border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
            autoComplete="off"
            autoFocus
            disabled={resolved || !imageReady}
          />
          <div className="flex gap-2">
            <Button type="submit" size="lg" className="h-11 flex-1 sm:flex-none" disabled={resolved || !imageReady}>
              Tahmin et
            </Button>
            <Button type="button" size="lg" variant="secondary" className="h-11 flex-1 sm:flex-none" disabled={resolved || !imageReady} onClick={() => grow("Bilmiyorum. Resim bir tık büyüdü.")}>
              Bilmiyorum
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" className="h-11 w-full sm:w-auto" disabled={resolved || !imageReady} onClick={() => grow("Bilmiyorum. Resim bir tık büyüdü.")}>
          Bilmiyorum
        </Button>
      )}
    </div>
  );
}
