import { Physics, Pt, RIM_Y, rotatePt } from '../art/geometry';
import type { Segment } from '../art/tubeScene';
import type { BoardLayout } from './layout';

export type PourOrder = { id: number; from: number; to: number; count: number; color: number };

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function segmentsOf(tube: number[], unit: number): Segment[] {
  const out: Segment[] = [];
  for (const c of tube) {
    const last = out[out.length - 1];
    if (last && last.color === c) last.vol += unit;
    else out.push({ color: c, vol: unit });
  }
  return out;
}

export function truncate(segs: Segment[], vol: number): Segment[] {
  const out: Segment[] = [];
  let left = vol;
  for (const s of segs) {
    if (left <= 0) break;
    const v = Math.min(s.vol, left);
    out.push({ color: s.color, vol: v });
    left -= v;
  }
  return out;
}

export type Anim = {
  order: PourOrder;
  start: number;
  A: number;
  B: number;
  hold: number;
  C: number;
  delay: number;
  sign: -1 | 1;
  theta0: number;
  thetaF: number;
  vStart: number;
  unit: number;
  w: number;
  ph: Physics;
  lipLocal: Pt;
  Q: Pt;
  startPivot: Pt;
  homePivot: Pt;
  targetPos: Pt;
  notified: boolean;
};

export type Pose = {
  angle: number;
  pivot: Pt;
  spilled: number; // units that have left the source
  gain: number; // units that have arrived in the target
  stream: number; // 0..1 stream thickness
  done: boolean;
};

export function poseAt(a: Anim, t: number): Pose {
  const { A, B, hold, C, ph } = a;
  const count = a.order.count;
  const pivotFor = (deg: number): Pt => {
    const r = rotatePt(a.lipLocal, ph.pivot, deg);
    return { x: a.Q.x - (r.x - ph.pivot.x), y: a.Q.y - (r.y - ph.pivot.y) };
  };
  const spilledAt = (tt: number): number => {
    if (tt <= A) return 0;
    if (tt >= A + B) return count;
    const s = easeInOut((tt - A) / B);
    const th = a.theta0 + (a.thetaF - a.theta0) * s;
    const vis = Math.min(a.vStart, ph.capacity(a.sign * th));
    return Math.min(count, Math.max(0, (a.vStart - vis) / a.unit));
  };

  let angle: number;
  let pivot: Pt;
  if (t < A) {
    const e = easeInOut(clamp01(t / A));
    const th = a.theta0 * e;
    angle = a.sign * th;
    const target = pivotFor(angle);
    pivot = { x: lerp(a.startPivot.x, target.x, e), y: lerp(a.startPivot.y, target.y, e) };
  } else if (t < A + B) {
    const s = easeInOut((t - A) / B);
    const th = a.theta0 + (a.thetaF - a.theta0) * s;
    angle = a.sign * th;
    pivot = pivotFor(angle);
  } else if (t < A + B + hold) {
    angle = a.sign * a.thetaF;
    pivot = pivotFor(angle);
  } else {
    const u = easeInOut(clamp01((t - A - B - hold) / C));
    angle = a.sign * a.thetaF * (1 - u);
    const from = pivotFor(a.sign * a.thetaF);
    pivot = { x: lerp(from.x, a.homePivot.x, u), y: lerp(from.y, a.homePivot.y, u) };
  }

  const spilled = spilledAt(t);
  const gain = spilledAt(t - a.delay);
  let stream = 0;
  const streamEnd = A + B + a.delay;
  if (t > A && t < streamEnd) {
    const rate = (spilledAt(t + 20) - spilledAt(t - 20)) / 40;
    const avg = count / B;
    const body = clamp01(rate / (avg * 1.5));
    const fadeIn = clamp01((t - A) / 110);
    const fadeOut = clamp01((streamEnd - t) / 140);
    stream = Math.max(0.12, body) * fadeIn * fadeOut;
  }
  return { angle, pivot, spilled, gain, stream, done: t >= A + B + hold + C };
}


export function createAnim(
  order: PourOrder,
  lay: BoardLayout,
  phy: Physics,
  srcLen: number,
  liftNow: number,
  now: number,
): Anim {
  const src = lay.pos[order.from];
  const dst = lay.pos[order.to];
  const vStart = srcLen * phy.unit;
  const vAfter = vStart - order.count * phy.unit;
  const theta0 = phy.tiltFor(vStart);
  let thetaF = phy.tiltFor(vAfter);
  if (vAfter <= 0) thetaF += 3;
  thetaF = Math.max(thetaF, theta0 + 6);
  const lw = lay.w;
  const targetMouth: Pt = { x: dst.x + lw / 2, y: dst.y + RIM_Y * lw };
  // Tilt towards the target when that keeps the bottle on screen, otherwise
  // tilt the other way (the lip ends up in the same spot either way).
  const reach = lay.H * Math.sin((thetaF * Math.PI) / 180) + 0.6 * lw;
  const natural: -1 | 1 = dst.x < src.x ? -1 : 1;
  const fits = (s: -1 | 1) => {
    const qx = targetMouth.x - s * 0.16 * lw;
    return s === -1 ? qx + reach <= lay.boardW + 0.4 * lw : qx - reach >= -0.4 * lw;
  };
  const sign: -1 | 1 = fits(natural) || !fits(-natural as -1 | 1) ? natural : ((-natural) as -1 | 1);
  const lipLocal = sign === -1 ? phy.inner[0] : phy.inner[phy.inner.length - 1];
  const Q: Pt = { x: targetMouth.x - sign * 0.16 * lw, y: targetMouth.y - 0.5 * lw };
  const homePivot: Pt = { x: src.x + phy.pivot.x, y: src.y + phy.pivot.y };
  return {
    order,
    start: now + 16,
    A: 260,
    B: 380 + 200 * order.count,
    hold: 70,
    C: 260,
    delay: 80,
    sign,
    theta0,
    thetaF,
    vStart,
    unit: phy.unit,
    w: lw,
    ph: phy,
    lipLocal,
    Q,
    startPivot: { x: homePivot.x, y: homePivot.y - liftNow },
    homePivot,
    targetPos: dst,
    notified: false,
  };
}

export const animDuration = (a: Anim) => a.A + a.B + a.hold + a.C;
