"use client";

import { useEffect, useMemo, useState } from "react";
import { CarBrowse } from "@/components/car-browse";
import { HomeScreen, PlayScreen, ResultScreen, Shell } from "@/components/quiz-ui";
import { LOCAL_CARS, carYear, fullName, scoreGuess, type CarChallenge } from "@/data/cars";
import { formatYear } from "@/data/year-utils";
import { hydrateCatalog } from "@/data/load-catalog";
import { clearSavedCars, rememberPhotos } from "@/data/car-store";
import {
  END_SCALE,
  MAX_REVEALS,
  ROUND_SIZE,
  START_SCALE,
  YEAR_RANGES,
  nameChoices,
  pickSpot,
  pointsFor,
  promptFor,
  shuffle,
  type Difficulty,
} from "@/lib/quiz-core";

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
  const [message, setMessage] = useState("Kareye bak.");
  const [tone, setTone] = useState<"idle" | "ok" | "warn" | "bad">("idle");
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [started, setStarted] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [loadingPool, setLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState("");
  const [catalogStatus, setCatalogStatus] = useState("Kayitli arabalar okunuyor");
  const [fullPool, setFullPool] = useState<CarChallenge[]>(LOCAL_CARS);
  const [poolCount, setPoolCount] = useState(LOCAL_CARS.length);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [yearRangeId, setYearRangeId] = useState("all");
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
  const [browse, setBrowse] = useState(false);
  const [missedNames, setMissedNames] = useState<string[]>([]);
  const [crop, setCrop] = useState({ x: 50, y: 42 });

  const car = index < deck.length ? deck[index] : undefined;
  const scale = resolved ? END_SCALE : START_SCALE - ((START_SCALE - END_SCALE) / MAX_REVEALS) * reveals;
  const nameOptions = useMemo(() => {
    if (!car || (difficulty !== "easy" && difficulty !== "medium")) return [];
    return nameChoices(car, difficulty === "medium" ? deck : fullPool);
  }, [car, difficulty, deck, fullPool]);

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
      setPoolError("Liste indirilemedi. Bu cihazda kayitli arabalarla devam.");
      return fullPool;
    } finally {
      setLoadingPool(false);
    }
  }

  useEffect(() => {
    void loadPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rememberPhotos(deck.length ? deck : fullPool, 40);
  }, [deck, fullPool]);

  async function startRound(mode: Difficulty, rangeId = yearRangeId) {
    setDifficulty(mode);
    const source = fullPool.length > 40 ? fullPool : await loadPool();
    let filtered = source;
    if (mode === "medium") {
      const range = YEAR_RANGES.find((r) => r.id === rangeId) ?? YEAR_RANGES[0]!;
      filtered = source.filter((c) => {
        const y = carYear(c);
        return y != null && y >= range.min && y <= range.max;
      });
      if (filtered.length < 8) {
        setPoolError("Bu yil araliginda yeterli araba yok, tum yillar kullanildi.");
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
    setMissedNames([]);
    setCrop(pickSpot());
    setStarted(true);
    setPendingDifficulty(null);
    setMessage(promptFor(mode));
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
    setMissedNames([]);
    setCrop(pickSpot());
    setMessage(promptFor(difficulty));
  }

  function finishRound(solved: boolean) {
    if (!car || resolved) return;
    const used = solved ? reveals : MAX_REVEALS;
    setResolved(true);
    setReveals(MAX_REVEALS);
    setTone(solved ? "ok" : "bad");
    const name = fullName(car);
    const yearLabel = formatYear(car);
    const label = yearLabel ? `${name} · ${yearLabel}` : name;
    setMessage(solved ? `Bildin: ${label}` : `Cevap: ${label}`);
    setResults((prev) => [...prev, { car, reveals: used, points: pointsFor(used, solved), solved }]);
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
      setMessage("Bir sey yaz ya da Bilmiyorum de.");
      return;
    }
    if (result === "correct") {
      finishRound(true);
      return;
    }
    if (result === "brand-only") {
      setTone("warn");
      setMessage("Marka dogru. Modeli de yaz, resim buyumesin.");
      return;
    }
    grow("Yakin degil. Resim bir tik buyudu.");
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
    grow("Yanlis. Resim bir tik buyudu, baska sik dene.");
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
          setBrowse={setBrowse}
          onClearSaved={async () => {
            await clearSavedCars();
            setFullPool(LOCAL_CARS);
            setPoolCount(LOCAL_CARS.length);
            setCatalogStatus("Kayit silindi. Liste yeniden indirilecek.");
            void loadPool();
          }}
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
          onHome={() => {
            setStarted(false);
            setPendingDifficulty(null);
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
        pickName={pickName}
        goNext={goNext}
        submitText={submitText}
        grow={grow}
      />
    </Shell>
  );
}
