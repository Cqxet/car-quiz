"use client";

import type { CarChallenge } from "@/data/cars";

export function CarFront({
  car,
  crop,
  onReady,
}: {
  car: CarChallenge;
  crop?: { x: number; y: number };
  onReady?: () => void;
}) {
  const x = crop?.x ?? car.focusX;
  const y = crop?.y ?? car.focusY;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={car.image}
      src={car.image}
      alt=""
      className="h-full w-full object-cover"
      style={{ objectPosition: `${x}% ${y}%` }}
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={onReady}
      onError={onReady}
    />
  );
}
