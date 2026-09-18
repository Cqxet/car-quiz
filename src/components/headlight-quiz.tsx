"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarFront } from "@/components/car-front";
import { CAR_POOL, fullName, scoreGuess, type CarChallenge } from "@/data/cars";

const MAX_REVEALS = 6;
const START_SCALE = 3.6;
const END_SCALE = 1;
const ROUND_SIZE = 20;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type RoundResult = {
  car: CarChallenge;
  reveals: number;
  points: number;
  solved: boolean;
};

export function HeadlightQuiz() {
  const [deck, setDeck] = useState<CarChallenge[]>([]);
  const [index, setIndex] = useState(0);
  const [reveals, setReveals] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("Far şekline bak, marka ve modeli yaz.");
  const [tone, setTone] = useState<"idle" | "ok" | "warn" | "bad">("idle");
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [started, setStarted] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const car = index < deck.length ? deck[index] : undefined;
  const scale = START_SCALE - ((START_SCALE - END_SCALE) / MAX_REVEALS) * reveals;
  const pointsFor = (used: number, solved: boolean) =>
    solved ? Math.max(10, 100 - used * 15) : 0;

  function startRound() {
    setDeck(shuffle(CAR_POOL).slice(0, ROUND_SIZE));
    setIndex(0);
    setReveals(0);
    setGuess("");
    setResolved(false);
    setResults([]);
    setTone("idle");
    setMessage("Far şekline bak, marka ve modeli yaz.");
    setImageReady(false);
    setStarted(true);
  }

  useEffect(() => {
    setImageReady(false);
  }, [car?.id]);

  function goNext() {
    setIndex((i) => i + 1);
    setReveals(0);
    setGuess("");
    setResolved(false);
    setTone("idle");
    setMessage("Far şekline bak, marka ve modeli yaz.");
    setImageReady(false);
  }

  function finishRound(solved: boolean) {
    if (!car || resolved) return;
    const used = solved ? reveals : MAX_REVEALS;
    setResolved(true);
    setTone(solved ? "ok" : "warn");
    setMessage(solved ? `Bildin: ${fullName(car)}` : `Cevap: ${fullName(car)}`);
    setResults((prev) => [...prev, { car, reveals: used, points: pointsFor(used, solved), solved }]);
  }

  useEffect(() => {
    if (!resolved) return;
    const timer = window.setTimeout(goNext, 1100);
    return () => window.clearTimeout(timer);
  }, [resolved]);

  function grow(reason: string) {
    if (reveals >= MAX_REVEALS) {
      finishRound(false);
      return;
    }
    setReveals((n) => n + 1);
    setTone("bad");
    setMessage(reason);
  }

  function submit() {
    if (!car || resolved || !imageReady) return;
    const result = scoreGuess(guess, car);
    if (result === "empty") {
      setTone("warn");
      setMessage("Bir şey yaz ya da Bilmiyorum de.");
      return;
    }
    if (result === "correct") {
      finishRound(true);
      return;
    }
    if (result === "brand-only") {
      setTone("warn");
      setMessage("Marka doğru. Modeli de yaz, resim büyümesin.");
      return;
    }
    grow("Yakın değil. Resim bir tık büyüdü.");
    setGuess("");
  }

  const total = results.reduce((sum, r) => sum + r.points, 0);

  if (!started) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg space-y-6 px-4 py-10 text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-amber-300/80 uppercase">
            Far testi
          </p>
          <h1 className="font-heading text-4xl text-balance text-white sm:text-5xl">
            Sadece farlara bakıp arabayı bilecek misin?
          </h1>
          <p className="text-pretty text-zinc-400">
            Seçenek yok. Marka ve modeli kendin yaz. Bilemeyince ya da yanlış yazınca
            kare bir tık büyür, arabanın daha çoğu görünür. Havuzda {CAR_POOL.length.toLocaleString("tr-TR")} araba
            var; her turda rastgele {ROUND_SIZE} tanesi gelir.
          </p>
          <Button size="lg" className="h-11 px-6 text-base" onClick={startRound}>
            Testi başlat
          </Button>
        </div>
      </Shell>
    );
  }

  if (!car) {
    const known = results.filter((r) => r.solved).length;
    return (
      <Shell>
        <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
          <h1 className="font-heading text-center text-4xl text-white">Tur bitti</h1>
          <p className="text-center text-zinc-400">
            {known}/{results.length} araba bildin · {total} puan
          </p>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {results.map((r) => (
              <li
                key={r.car.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-white">{fullName(r.car)}</span>
                <span className={r.solved ? "text-emerald-400" : "text-zinc-500"}>
                  {r.solved ? `${r.points} puan · ${r.reveals} büyüme` : "bilemedi"}
                </span>
              </li>
            ))}
          </ul>
          <Button className="w-full" size="lg" onClick={startRound}>
            Yeniden oyna
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 overflow-x-hidden px-4 py-6 sm:py-10">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-amber-300/80 uppercase">Far testi</p>
            <h1 className="font-heading text-2xl text-white sm:text-3xl">Bu hangi araba?</h1>
          </div>
          <p className="text-sm text-zinc-400">
            {index + 1}/{deck.length} · {total} puan
          </p>
        </header>

        <div className="isolate overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
          <div className="relative aspect-[16/10] overflow-hidden">
            <div
              key={car.id}
              className="absolute inset-0 origin-center will-change-transform transition-transform duration-500 ease-out"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${car.focusX}% ${car.focusY}%`,
              }}
            >
              <CarFront car={car} onReady={() => setImageReady(true)} />
            </div>
            {!imageReady && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950/90">
                <span className="size-9 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
                <p className="text-sm text-zinc-300">Resim yükleniyor…</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <p className="absolute right-3 bottom-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-zinc-200">
              {reveals === 0 ? "Sadece far" : `${reveals}. büyüme`}
            </p>
          </div>
        </div>

        <p
          className={
            tone === "ok"
              ? "text-emerald-400"
              : tone === "bad"
                ? "text-rose-300"
                : tone === "warn"
                  ? "text-amber-300"
                  : "text-zinc-400"
          }
        >
          {message}
          {resolved ? " · sıradaki geliyor" : ""}
        </p>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Örn. BMW 3 Series"
            className="h-11 flex-1 border-white/15 bg-white/5 text-white placeholder:text-zinc-500"
            autoComplete="off"
            autoFocus
            disabled={resolved || !imageReady}
          />
          <div className="flex gap-2">
            <Button type="submit" size="lg" className="h-11 flex-1 sm:flex-none" disabled={resolved || !imageReady}>
              Tahmin et
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="h-11 flex-1 sm:flex-none"
              disabled={resolved || !imageReady}
              onClick={() => grow("Bilmiyorum. Resim bir tık büyüdü.")}
            >
              Bilmiyorum
            </Button>
          </div>
        </form>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#1e293b,transparent_42%),#05070b] text-zinc-100">
      {children}
    </main>
  );
}
