"use client";

import type { CarChallenge } from "@/data/cars";
import { displayImage } from "@/lib/quiz-core";

export function CarFront({
  car,
  crop,
  onReady,
  onFail,
}: {
  car: CarChallenge;
  crop?: { x: number; y: number };
  onReady?: () => void;
  onFail?: () => void;
}) {
  const x = crop?.x ?? car.focusX;
  const y = crop?.y ?? car.focusY;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={car.image}
      src={displayImage(car.image)}
      alt=""
      className="h-full w-full object-cover"
      style={{ objectPosition: `${x}% ${y}%` }}
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={onReady}
      onError={() => onFail?.()}
    />
  );
}
