"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarFront } from "@/components/car-front";
import { LOCAL_CARS, carYear, fullName, scoreGuess, type CarChallenge } from "@/data/cars";
import { fetchRemoteCars } from "@/data/load-catalog";

const MAX_REVEALS = 6;
const START_SCALE = 3.6;
const END_SCALE = 1;
const ROUND_SIZE = 20;

type Difficulty = "easy" | "medium" | "hard";

type YearRange = {
  id: string;
  label: string;
  min: number;
  max: number;
};

const YEAR_RANGES: YearRange[] = [
  { id: "all", label: "Tüm yıllar", min: 1886, max: 2026 },
  { id: "pre80", label: "1980 öncesi", min: 1886, max: 1979 },
  { id: "80s90s", label: "1980 – 1999", min: 1980, max: 1999 },
  { id: "2000s", label: "2000 – 2009", min: 2000, max: 2009 },
  { id: "2010s", label: "2010 – 2019", min: 2010, max: 2019 },
  { id: "2020s", label: "2020 ve sonrası", min: 2020, max: 2026 },
];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nameChoices(car: CarChallenge, pool: CarChallenge[]) {
  const correct = fullName(car);
  const others = shuffle(pool.filter((c) => fullName(c) !== correct)).slice(0, 3).map(fullName);
  return shuffle([correct, ...others]);
}

function yearChoices(car: CarChallenge, pool: CarChallenge[]) {
  const correct = carYear(car);
  if (!correct) return [];
  const fromPool = pool
    .map(carYear)
    .filter((y): y is number => y != null && y !== correct);
  const unique = shuffle([...new Set(fromPool)]).slice(0, 3);
  const extras = [correct - 4, correct + 3, correct - 8, correct + 7, correct + 11].filter(
    (y) => y !== correct && y >= 1886 && y <= 2026,
  );
  const picks = [...unique];
  for (const y of extras) {
    if (picks.length >= 3) break;
    if (!picks.includes(y)) picks.push(y);
  }
  return shuffle([correct, ...picks.slice(0, 3)]);
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
  const [message, setMessage] = useState("Far şekline bak.");
  const [tone, setTone] = useState<"idle" | "ok" | "warn" | "bad">("idle");
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [started, setStarted] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [poolError, setPoolError] = useState("");
  const [fullPool, setFullPool] = useState<CarChallenge[]>(LOCAL_CARS);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [yearRangeId, setYearRangeId] = useState("all");
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);

  const car = index < deck.length ? deck[index] : undefined;
  const scale = START_SCALE - ((START_SCALE - END_SCALE) / MAX_REVEALS) * reveals;
  const pointsFor = (used: number, solved: boolean) =>
    solved ? Math.max(10, 100 - used * 15) : 0;

  const easyOptions = useMemo(
    () => (car && difficulty === "easy" ? nameChoices(car, fullPool) : []),
    [car, difficulty, fullPool],
  );
  const mediumOptions = useMemo(
    () => (car && difficulty === "medium" ? yearChoices(car, deck) : []),
    [car, difficulty, deck],
  );

  async function loadPool() {
    if (fullPool.length > LOCAL_CARS.length) return fullPool;
    setLoadingPool(true);
    setPoolError("");
    let source = LOCAL_CARS;
    try {
      const remote = await fetchRemoteCars();
      if (remote.length > 50) source = [...LOCAL_CARS, ...remote];
    } catch {
      setPoolError("Uzaktan liste alınamadı, yerel arabalarla devam.");
    }
    setFullPool(source);
    setLoadingPool(false);
    return source;
  }

  async function startRound(mode: Difficulty, rangeId = yearRangeId) {
    setDifficulty(mode);
    const source = await loadPool();
    let filtered = source;
    if (mode === "medium") {
      const range = YEAR_RANGES.find((r) => r.id === rangeId) ?? YEAR_RANGES[0]!;
      filtered = source.filter((c) => {
        const y = carYear(c);
        return y != null && y >= range.min && y <= range.max;
      });
      if (filtered.length < 8) {
        setPoolError("Bu yıl aralığında yeterli araba yok, tüm yıllar kullanıldı.");
        filtered = source.filter((c) => carYear(c) != null);
      }
    }
    const size = Math.min(ROUND_SIZE, Math.max(1, filtered.length));
    setDeck(shuffle(filtered).slice(0, size));
    setIndex(0);
    setReveals(0);
    setGuess("");
    setResolved(false);
    setResults([]);
    setTone("idle");
    setImageReady(false);
    setStarted(true);
    setPendingDifficulty(null);
    setMessage(
      mode === "easy"
        ? "Dört seçenekten doğruyu seç."
        : mode === "medium"
          ? "Bu far hangi yılda çıktı?"
          : "Far şekline bak, marka ve modeli yaz.",
    );
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
    setImageReady(false);
    setMessage(
      difficulty === "easy"
        ? "Dört seçenekten doğruyu seç."
        : difficulty === "medium"
          ? "Bu far hangi yılda çıktı?"
          : "Far şekline bak, marka ve modeli yaz.",
    );
  }

  function finishRound(solved: boolean) {
    if (!car || resolved) return;
    const used = solved ? reveals : MAX_REVEALS;
    setResolved(true);
    setTone(solved ? "ok" : "warn");
    const year = carYear(car);
    const name = fullName(car);
    if (difficulty === "medium") {
      setMessage(solved ? `Bildin: ${year}` : `Cevap: ${year} · ${name}`);
    } else {
      setMessage(solved ? `Bildin: ${name}` : `Cevap: ${name}`);
    }
    setResults((prev) => [...prev, { car, reveals: used, points: pointsFor(used, solved), solved }]);
  }

  useEffect(() => {
    if (!resolved) return;
    const timer = window.setTimeout(goNext, 1100);
    return () => window.clearTimeout(timer);
    // goNext closes over the current round; only re-run when the round resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function submitText() {
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

  function pickEasy(option: string) {
    if (!car || resolved || !imageReady) return;
    if (option === fullName(car)) finishRound(true);
    else grow("Yanlış. Resim bir tık büyüdü.");
  }

  function pickYear(option: number) {
    if (!car || resolved || !imageReady) return;
    if (option === carYear(car)) finishRound(true);
    else grow("Yanlış yıl. Resim bir tık büyüdü.");
  }

  const total = results.reduce((sum, r) => sum + r.points, 0);

  if (!started) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
          <div className="text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-amber-300/80 uppercase">Far testi</p>
            <h1 className="font-heading mt-2 text-4xl text-balance text-white sm:text-5xl">
              Farlara bakıp arabayı bilecek misin?
            </h1>
            <p className="mt-3 text-pretty text-zinc-400">
              Üç zorluk var. Bilemeyince kare bir tık büyür. Opel / opel aynı sayılır.
            </p>
          </div>
          {poolError ? <p className="text-center text-sm text-amber-300">{poolError}</p> : null}

          {pendingDifficulty === "medium" ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Orta: hangi yıl aralığı çıksın?</p>
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
                <Button
                  className="flex-1"
                  disabled={loadingPool}
                  onClick={() => startRound("medium", yearRangeId)}
                >
                  {loadingPool ? "Yükleniyor…" : "Orta başlat"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <ModeCard
                title="Kolay"
                text="Dört seçenekten marka ve modeli seç."
                disabled={loadingPool}
                onClick={() => startRound("easy")}
              />
              <ModeCard
                title="Orta"
                text="Yıl aralığını seç, sonra “şu yılda çıktı” şıklarından bul."
                disabled={loadingPool}
                onClick={() => setPendingDifficulty("medium")}
              />
              <ModeCard
                title="Zor"
                text="Seçenek yok. Marka ve modeli kendin yaz."
                disabled={loadingPool}
                onClick={() => startRound("hard")}
              />
            </div>
          )}
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
            {known}/{results.length} bildin · {total} puan
          </p>
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
            {results.map((r) => (
              <li
                key={r.car.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-white">
                  {fullName(r.car)}
                  {carYear(r.car) ? ` · ${carYear(r.car)}` : ""}
                </span>
                <span className={r.solved ? "text-emerald-400" : "text-zinc-500"}>
                  {r.solved ? `${r.points} puan` : "bilemedi"}
                </span>
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setStarted(false);
              setPendingDifficulty(null);
            }}
          >
            Mod seçimine dön
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
            <p className="text-xs tracking-[0.18em] text-amber-300/80 uppercase">
              {difficulty === "easy" ? "Kolay" : difficulty === "medium" ? "Orta" : "Zor"}
            </p>
            <h1 className="font-heading text-2xl text-white sm:text-3xl">
              {difficulty === "medium" ? "Hangi yılda çıktı?" : "Bu hangi araba?"}
            </h1>
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

        {difficulty === "easy" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {easyOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant="secondary"
                className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-left"
                disabled={resolved || !imageReady}
                onClick={() => pickEasy(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : null}

        {difficulty === "medium" ? (
          <div className="grid grid-cols-2 gap-2">
            {mediumOptions.map((year) => (
              <Button
                key={year}
                type="button"
                variant="secondary"
                className="h-11"
                disabled={resolved || !imageReady}
                onClick={() => pickYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        ) : null}

        {difficulty === "hard" ? (
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
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="h-11 w-full sm:w-auto"
            disabled={resolved || !imageReady}
            onClick={() => grow("Bilmiyorum. Resim bir tık büyüdü.")}
          >
            Bilmiyorum
          </Button>
        )}
      </div>
    </Shell>
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,#1e293b,transparent_42%),#05070b] text-zinc-100">
      {children}
    </main>
  );
}
