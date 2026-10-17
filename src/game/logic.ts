// Pure game rules. Tubes are arrays of color indices, bottom -> top.

export const CAP = 4;

export type Tubes = number[][];

export function cloneTubes(tubes: Tubes): Tubes {
  return tubes.map((t) => t.slice());
}

/** Length of the same-color run at the top of a tube. */
export function topRun(t: number[]): number {
  if (t.length === 0) return 0;
  const c = t[t.length - 1];
  let n = 0;
  for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++;
  return n;
}

/** How many units would move if we poured tube a into tube b (0 = illegal). */
export function pourAmount(tubes: Tubes, a: number, b: number): number {
  if (a === b) return 0;
  const A = tubes[a];
  const B = tubes[b];
  if (!A || !B || A.length === 0) return 0;
  if (B.length >= CAP) return 0;
  const c = A[A.length - 1];
  if (B.length > 0 && B[B.length - 1] !== c) return 0;
  return Math.min(topRun(A), CAP - B.length);
}

export type PourResult = { tubes: Tubes; count: number; color: number };

export function applyPour(tubes: Tubes, a: number, b: number): PourResult | null {
  const count = pourAmount(tubes, a, b);
  if (count === 0) return null;
  const next = cloneTubes(tubes);
  const color = next[a][next[a].length - 1];
  for (let i = 0; i < count; i++) {
    next[a].pop();
    next[b].push(color);
  }
  return { tubes: next, count, color };
}

export function isTubeDone(t: number[]): boolean {
  return t.length === CAP && t.every((x) => x === t[0]);
}

export function isSolved(tubes: Tubes): boolean {
  return tubes.every((t) => t.length === 0 || isTubeDone(t));
}

/** Decode a level string like "0120" into a tube. */
export function decodeTube(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) out.push(parseInt(ch, 36));
  return out;
}

export function encodeTube(t: number[]): string {
  return t.map((c) => c.toString(36)).join('');
}
