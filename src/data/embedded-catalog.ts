/* Compact catalog bundled at build time so Vercel does not depend on APIs. */
export type CompactRow = [string, string, string, string, string, number];

import p28 from "./pack/28.json";
import p29 from "./pack/29.json";
import p30 from "./pack/30.json";
import p31 from "./pack/31.json";
import p32 from "./pack/32.json";
import p33 from "./pack/33.json";
import p34 from "./pack/34.json";
import p35 from "./pack/35.json";
import p36 from "./pack/36.json";
import p37 from "./pack/37.json";
import p38 from "./pack/38.json";
import p39 from "./pack/39.json";
import p40 from "./pack/40.json";
import p41 from "./pack/41.json";
import p42 from "./pack/42.json";

export const EMBEDDED_PACK = [
  ...(p28 as CompactRow[]),
  ...(p29 as CompactRow[]),
  ...(p30 as CompactRow[]),
  ...(p31 as CompactRow[]),
  ...(p32 as CompactRow[]),
  ...(p33 as CompactRow[]),
  ...(p34 as CompactRow[]),
  ...(p35 as CompactRow[]),
  ...(p36 as CompactRow[]),
  ...(p37 as CompactRow[]),
  ...(p38 as CompactRow[]),
  ...(p39 as CompactRow[]),
  ...(p40 as CompactRow[]),
  ...(p41 as CompactRow[]),
  ...(p42 as CompactRow[]),
];
