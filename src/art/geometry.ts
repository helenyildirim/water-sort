// Bottle geometry + simple 2D liquid physics.
//
// Everything is expressed in "tube local" coordinates: origin at the top-left
// of the tube's box, width w, height H = TUBE_H_RATIO * w. The tube pivots
// around the centre of its mouth, so rotating it keeps the mouth in place.

export type Pt = { x: number; y: number };

export const TUBE_H_RATIO = 3.85;
export const RIM_Y = 0.1; // mouth line, in units of w
export const FILL_TOP = 0.62; // where a full (4 unit) tube's liquid ends, in units of w
export const UNITS = 4;

export const tubeHeight = (w: number) => TUBE_H_RATIO * w;
export const pivotOf = (w: number): Pt => ({ x: w / 2, y: RIM_Y * w });

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return out;
}

type Profile = {
  nx0: number;
  nx1: number;
  bx0: number;
  bx1: number;
  rb: number;
  yb: number;
};

function profile(w: number, inner: boolean): Profile {
  const H = tubeHeight(w);
  return inner
    ? { nx0: 0.22 * w, nx1: 0.78 * w, bx0: 0.1 * w, bx1: 0.9 * w, rb: 0.4 * w, yb: H - 0.1 * w }
    : { nx0: 0.16 * w, nx1: 0.84 * w, bx0: 0.04 * w, bx1: 0.96 * w, rb: 0.46 * w, yb: H - 0.04 * w };
}

/** Closed polygon of the bottle (clockwise), mouth edge is the first->last segment. */
export function bottlePoly(w: number, inner: boolean, arcSteps = 28): Pt[] {
  const p = profile(w, inner);
  const topY = RIM_Y * w;
  const ys = 0.34 * w;
  const by = 0.5 * w;
  const pts: Pt[] = [];
  pts.push({ x: p.nx0, y: topY });
  pts.push({ x: p.nx0, y: ys });
  pts.push(
    ...bezier(
      { x: p.nx0, y: ys },
      { x: p.nx0, y: ys + 0.08 * w },
      { x: p.bx0, y: by - 0.1 * w },
      { x: p.bx0, y: by },
      8,
    ),
  );
  pts.push({ x: p.bx0, y: p.yb - p.rb });
  const cx = w / 2;
  const cy = p.yb - p.rb;
  for (let i = 1; i <= arcSteps; i++) {
    const th = Math.PI - (Math.PI * i) / arcSteps; // 180deg -> 0deg through the bottom
    pts.push({ x: cx + p.rb * Math.cos(th), y: cy + p.rb * Math.sin(th) });
  }
  pts.push({ x: p.bx1, y: by });
  pts.push(
    ...bezier(
      { x: p.bx1, y: by },
      { x: p.bx1, y: by - 0.1 * w },
      { x: p.nx1, y: ys + 0.08 * w },
      { x: p.nx1, y: ys },
      8,
    ),
  );
  pts.push({ x: p.nx1, y: topY });
  return pts;
}

export function polyToPath(pts: Pt[]): string {
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    d += (i === 0 ? 'M' : 'L') + pts[i].x.toFixed(2) + ' ' + pts[i].y.toFixed(2) + ' ';
  }
  return d + 'Z';
}

export function rotatePts(pts: Pt[], pivot: Pt, deg: number): Pt[] {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map((p) => {
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    return { x: pivot.x + dx * c - dy * s, y: pivot.y + dx * s + dy * c };
  });
}

export function rotatePt(p: Pt, pivot: Pt, deg: number): Pt {
  return rotatePts([p], pivot, deg)[0];
}

/** Area of the polygon below the horizontal line y = L (screen y grows downward). */
export function areaBelow(poly: Pt[], L: number): number {
  const out: Pt[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const aIn = a.y >= L;
    const bIn = b.y >= L;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (L - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * t, y: L });
    }
  }
  let s = 0;
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const b = out[(i + 1) % out.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export type Physics = {
  w: number;
  H: number;
  pivot: Pt;
  inner: Pt[];
  unit: number; // volume of one liquid unit
  total: number; // capacity of the whole bottle interior
  /** Level line (y) such that `volume` fits below it when rotated by deg. */
  level: (deg: number, volume: number) => number;
  /** Largest volume that stays inside the bottle at this tilt (rest spills). */
  capacity: (deg: number) => number;
  /** x-extent of the surface at level y. */
  chord: (deg: number, y: number) => { x0: number; x1: number };
  /** Tilt (deg, magnitude) at which exactly `volume` is left in the bottle. */
  tiltFor: (volume: number) => number;
};

const cache = new Map<number, Physics>();

export function physicsFor(w: number): Physics {
  const key = Math.round(w * 100);
  const hit = cache.get(key);
  if (hit) return hit;

  const H = tubeHeight(w);
  const pivot = pivotOf(w);
  const inner = bottlePoly(w, true);
  const unit = areaBelow(inner, FILL_TOP * w) / UNITS;
  const total = areaBelow(inner, -1e9);
  const mouthA = inner[0];
  const mouthB = inner[inner.length - 1];

  const level = (deg: number, volume: number): number => {
    const r = rotatePts(inner, pivot, deg);
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of r) {
      if (p.y < lo) lo = p.y;
      if (p.y > hi) hi = p.y;
    }
    if (volume <= 0) return hi;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (areaBelow(r, mid) > volume) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };

  const capacity = (deg: number): number => {
    const r = rotatePts([mouthA, mouthB], pivot, deg);
    const lipLow = Math.max(r[0].y, r[1].y);
    return areaBelow(rotatePts(inner, pivot, deg), lipLow);
  };

  const chord = (deg: number, y: number) => {
    const r = rotatePts(inner, pivot, deg);
    let x0 = Infinity;
    let x1 = -Infinity;
    for (let i = 0; i < r.length; i++) {
      const a = r[i];
      const b = r[(i + 1) % r.length];
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) {
        const t = (y - a.y) / (b.y - a.y);
        const x = a.x + (b.x - a.x) * t;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
    if (x0 === Infinity) return { x0: pivot.x, x1: pivot.x };
    return { x0, x1 };
  };

  const tiltFor = (volume: number): number => {
    if (volume >= capacity(0)) return 0;
    let lo = 0;
    let hi = 128;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (capacity(mid) > volume) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };

  const phys: Physics = { w, H, pivot, inner, unit, total, level, capacity, chord, tiltFor };
  cache.set(key, phys);
  return phys;
}
