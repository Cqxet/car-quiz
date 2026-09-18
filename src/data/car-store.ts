import type { CarChallenge } from "@/data/cars";

const DB_NAME = "araba-testi";
const DB_VER = 2;
const STORE = "cars";
const META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      if (db.objectStoreNames.contains(META)) db.deleteObjectStore(META);
      db.createObjectStore(STORE, { keyPath: "id" });
      db.createObjectStore(META);
    };
  });
}

export async function readSavedCars(): Promise<CarChallenge[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result || []) as CarChallenge[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveCars(cars: CarChallenge[]) {
  if (typeof indexedDB === "undefined" || cars.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, META], "readwrite");
    const store = tx.objectStore(STORE);
    for (const car of cars) store.put(car);
    tx.objectStore(META).put(Date.now(), "updatedAt");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearSavedCars() {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, META], "readwrite");
    tx.objectStore(STORE).clear();
    tx.objectStore(META).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const photoJobs = new Set<string>();

export function rememberPhoto(url: string) {
  if (!url || url.startsWith("/") || photoJobs.has(url)) return;
  photoJobs.add(url);
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.src = url;
}

export function rememberPhotos(cars: CarChallenge[], limit = 24) {
  for (const car of cars.slice(0, limit)) rememberPhoto(car.image);
}
