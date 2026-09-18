"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CarBrowse } from "@/components/car-browse";
import { HomeScreen, ResultScreen, Shell } from "@/components/quiz-ui";
import { PlayScreen } from "@/components/quiz-ui";
import { LOCAL_CARS, carYear, fullName, scoreGuess, type CarChallenge } from "@/data/cars";
import { formatYear } from "@/data/year-utils";
import { hydrateCatalog } from "@/data/load-catalog";
import {
  DAILY_SIZE,
  END_SCALE,
  MAX_REVEALS,
  ROUND_SIZE,
  START_SCALE,
  YEAR_RANGES,
  nameChoices,
  pickSpot,
  pointsFor,
  promptFor,
  rngFromSeed,
  type Difficulty,
} from "@/lib/quiz-core";
import { randomSeed, shuffleWith, todayKey } from "@/lib/rng";

type RoundResult = {
  car: CarChallenge;
  reveals: number;
  points: number;
  solved: boolean;
};

function parseMode(raw: string | null): Difficulty {
  if (raw === "easy" || raw === "medium" || raw === "hard") return raw;
  return "medium";
}

function HeadlightQuizInner() {
  const search = useSearchParams();
  const [deck, setDeck] = useState<CarChallenge[]>([]);
  const [index, setIndex] = useState(0);
  const [reveals, setReveals] = useState(0);
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("Kareye bak.");
  const [tone, setTone] = useState<"idle" | "ok" | "warn" | "bad">("idle");
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [started, setStarted] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [loadingPool, setLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState("");
  const [catalogStatus, setCatalogStatus] = useState("Araba listesi indiriliyor…");
  const [fullPool, setFullPool] = useState<CarChallenge[]>(LOCAL_CARS);
  const [poolCount, setPoolCount] = useState(LOCAL_CARS.length);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [yearRangeId, setYearRangeId] = useState("all");
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  const [browse, setBrowse] = useState(false);
  const [missedNames, setMissedNames] = useState<string[]>([]);
  const [crop, setCrop] = useState({ x: 50, y: 42 });
  const [roundSeed, setRoundSeed] = useState("");
  const [daily, setDaily] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [sessionStats, setSessionStats] = useState({ played: 0, solved: 0, points: 0 });
  const rngRef = useRef(() => Math.random());
  const skipRef = useRef(0);

  const car = index < deck.length ? deck[index] : undefined;
  const scale = resolved ? END_SCALE : START_SCALE - ((START_SCALE - END_SCALE) / MAX_REVEALS) * reveals;
  const [nameOptions, setNameOptions] = useState<string[]>([]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !roundSeed) return "";
    const u = new URL(window.location.origin + window.location.pathname);
    u.searchParams.set("seed", roundSeed);
    u.searchParams.set("mode", difficulty);
    if (difficulty === "easy") u.searchParams.set("years", yearRangeId);
    if (daily) u.searchParams.set("daily", "1");
    return u.toString();
  }, [roundSeed, difficulty, yearRangeId, daily]);

  async function loadPool() {
    setLoadingPool(true);
    setPoolError("");
    try {
      const source = await hydrateCatalog((cars, status) => {
        setFullPool(cars);
        setPoolCount(cars.length);
        setCatalogStatus(status);
      });
      setFullPool(source);
      setPoolCount(source.length);
      return source;
    } catch {
      setPoolError("Liste indirilemedi. Küçük yerel listeyle devam.");
      return fullPool;
    } finally {
      setLoadingPool(false);
    }
  }

  useEffect(() => {
    void loadPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function visiblePool(source: CarChallenge[]) {
    return source.filter((c) => !hiddenIds.has(c.id));
  }

  function beginDeck(mode: Difficulty, cars: CarChallenge[], seed: string, isDaily: boolean, rangeId: string) {
    rngRef.current = rngFromSeed(seed);
    const size = Math.min(isDaily ? DAILY_SIZE : ROUND_SIZE, Math.max(1, cars.length));
    const ordered = shuffleWith(cars, rngRef.current).slice(0, size);
    skipRef.current = 0;
    setRoundSeed(seed);
    setDaily(isDaily);
    setDifficulty(mode);
    setYearRangeId(rangeId);
    setDeck(ordered);
    setIndex(0);
    setReveals(0);
    setGuess("");
    setResolved(false);
    setResults([]);
    setTone("idle");
    setImageReady(false);
    setMissedNames([]);
    setCrop(pickSpot(rngRef.current));
    setStarted(true);
    setPendingDifficulty(null);
    setCopied(false);
    setMessage(promptFor(mode));
  }

  async function startRound(mode: Difficulty, rangeId = yearRangeId, opts?: { seed?: string; daily?: boolean }) {
    const source = fullPool.length > 40 ? fullPool : await loadPool();
    let filtered = visiblePool(source);
    if (mode === "easy" && !opts?.daily) {
      const range = YEAR_RANGES.find((r) => r.id === rangeId) ?? YEAR_RANGES[0]!;
      filtered = filtered.filter((c) => {
        const y = carYear(c);
        return y != null && y >= range.min && y <= range.max;
      });
      if (filtered.length < 8) {
        setPoolError("Bu yıl aralığında yeterli araba yok, tüm yıllar kullanıldı.");
        filtered = visiblePool(source).filter((c) => carYear(c) != null);
      }
    }
    const seed = opts?.seed ?? (opts?.daily ? `daily-${todayKey()}` : randomSeed());
    beginDeck(mode, filtered, seed, Boolean(opts?.daily), rangeId);
  }

  useEffect(() => {
    const seed = search.get("seed");
    if (!seed || loadingPool || started) return;
    const mode = parseMode(search.get("mode"));
    const years = search.get("years") || "all";
    const isDaily = search.get("daily") === "1" || seed.startsWith("daily-");
    void startRound(mode, years, { seed, daily: isDaily });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingPool, search]);

  useEffect(() => {
    setImageReady(false);
    if (car && difficulty !== "hard") {
      setNameOptions(nameChoices(car, difficulty === "easy" ? deck : fullPool, rngRef.current));
    } else {
      setNameOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car?.id]);

  function goNext() {
    setIndex((i) => i + 1);
    setReveals(0);
    setGuess("");
    setResolved(false);
    setTone("idle");
    setImageReady(false);
    setMissedNames([]);
    setCrop(pickSpot(rngRef.current));
    setMessage(promptFor(difficulty));
  }

  function skipBroken() {
    skipRef.current += 1;
    if (skipRef.current > 12) {
      setTone("warn");
      setMessage("Birkaç fotoğraf açılamadı, sonraki soruya geç.");
      goNext();
      return;
    }
    setDeck((prev) => prev.filter((_, i) => i !== index));
    setReveals(0);
    setGuess("");
    setResolved(false);
    setTone("idle");
    setImageReady(false);
    setMissedNames([]);
    setCrop(pickSpot(rngRef.current));
    setMessage("Kırık fotoğraf atlandı.");
  }

  function finishRound(solved: boolean) {
    if (!car || resolved) return;
    const used = solved ? reveals : MAX_REVEALS;
    const pts = pointsFor(used, solved);
    setResolved(true);
    setReveals(MAX_REVEALS);
    setTone(solved ? "ok" : "bad");
    const name = fullName(car);
    const yearLabel = formatYear(car);
    const label = yearLabel ? `${name} · ${yearLabel}` : name;
    setMessage(solved ? `Bildin: ${label}` : `Cevap: ${label}`);
    setResults((prev) => [...prev, { car, reveals: used, points: pts, solved }]);
    setSessionStats((s) => ({
      played: s.played + 1,
      solved: s.solved + (solved ? 1 : 0),
      points: s.points + pts,
    }));
  }

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

  function pickName(option: string) {
    if (!car || resolved || !imageReady) return;
    if (missedNames.includes(option)) return;
    if (option === fullName(car)) {
      finishRound(true);
      return;
    }
    setMissedNames((prev) => (prev.includes(option) ? prev : [...prev, option]));
    grow("Yanlış. Resim bir tık büyüdü, başka şık dene.");
  }

  function hideCar() {
    if (!car) return;
    setHiddenIds((prev) => new Set(prev).add(car.id));
    goNext();
  }

  async function copyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const total = results.reduce((sum, r) => sum + r.points, 0);

  if (browse && !started) {
    return (
      <Shell>
        <CarBrowse cars={fullPool} loading={loadingPool} onBack={() => setBrowse(false)} />
      </Shell>
    );
  }

  if (!started) {
    return (
      <Shell>
        <HomeScreen
          loadingPool={loadingPool}
          poolCount={poolCount}
          poolError={poolError}
          catalogStatus={catalogStatus}
          pendingDifficulty={pendingDifficulty}
          yearRangeId={yearRangeId}
          setYearRangeId={setYearRangeId}
          setPendingDifficulty={setPendingDifficulty}
          startRound={startRound}
          startDaily={() => void startRound("medium", "all", { daily: true, seed: `daily-${todayKey()}` })}
          setBrowse={setBrowse}
          sessionStats={sessionStats}
        />
      </Shell>
    );
  }

  if (!car) {
    return (
      <Shell>
        <ResultScreen
          results={results}
          total={total}
          shareUrl={shareUrl}
          copied={copied}
          onShare={() => void copyShare()}
          onHome={() => {
            setStarted(false);
            setPendingDifficulty(null);
            setDaily(false);
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <PlayScreen
        car={car}
        crop={crop}
        scale={scale}
        difficulty={difficulty}
        yearRangeId={yearRangeId}
        daily={daily}
        index={index}
        deckLen={deck.length}
        total={total}
        imageReady={imageReady}
        resolved={resolved}
        reveals={reveals}
        message={message}
        tone={tone}
        nameOptions={nameOptions}
        missedNames={missedNames}
        guess={guess}
        setGuess={setGuess}
        onReady={() => setImageReady(true)}
        onFail={skipBroken}
        pickName={pickName}
        goNext={goNext}
        submitText={submitText}
        grow={grow}
        hideCar={hideCar}
      />
    </Shell>
  );
}

export function HeadlightQuiz() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="px-4 py-16 text-center text-zinc-400">Yükleniyor…</p>
        </Shell>
      }
    >
      <HeadlightQuizInner />
    </Suspense>
  );
}
