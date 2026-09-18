"use client";

import type { CarChallenge } from "@/data/cars";

export function CarFront({
  car,
  onReady,
}: {
  car: CarChallenge;
  onReady?: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={car.image}
      src={car.image}
      alt=""
      className="h-full w-full object-cover"
      style={{ objectPosition: `${car.focusX}% ${car.focusY}%` }}
      draggable={false}
      onLoad={onReady}
      onError={onReady}
    />
  );
}
