import { CAP, Tubes, applyPour, isSolved, pourAmount } from './logic';

export type Move = [number, number];

function key(tubes: Tubes): string {
  const parts = tubes.map((t) => {
    let s = '';
    for (const c of t) s += String.fromCharCode(48 + c);
    return s;
  });
  parts.sort();
  return parts.join('|');
}

function segments(t: number[]): number {
  if (t.length === 0) return 0;
  let s = 1;
  for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) s++;
  return s;
}

// Admissible-ish heuristic: every pour can merge at most one segment.
function heuristic(tubes: Tubes, colors: number): number {
  let s = 0;
  for (const t of tubes) s += segments(t);
  return s - colors;
}

function countColors(tubes: Tubes): number {
  const seen = new Set<number>();
  for (const t of tubes) for (const c of t) seen.add(c);
  return seen.size;
}

type Node = { tubes: Tubes; g: number; f: number; parent: Node | null; move: Move | null };

class Heap {
  private a: Node[] = [];
  get size() {
    return this.a.length;
  }
  push(n: Node) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): Node | undefined {
    const a = this.a;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Weighted A* search. Returns a (near-shortest) list of moves or null if no
 * solution was found within the node limit.
 */
export function solve(start: Tubes, nodeLimit = 120000, weight = 2.2): Move[] | null {
  if (isSolved(start)) return [];
  const colors = countColors(start);
  const open = new Heap();
  const best = new Map<string, number>();
  open.push({ tubes: start, g: 0, f: weight * heuristic(start, colors), parent: null, move: null });
  best.set(key(start), 0);
  let expanded = 0;

  while (open.size > 0) {
    const node = open.pop()!;
    if (isSolved(node.tubes)) {
      const moves: Move[] = [];
      for (let n: Node | null = node; n && n.move; n = n.parent) moves.push(n.move);
      return moves.reverse();
    }
    if (++expanded > nodeLimit) return null;
    const { tubes } = node;
    for (let a = 0; a < tubes.length; a++) {
      const A = tubes[a];
      if (A.length === 0) continue;
      const aMono = segments(A) === 1;
      if (aMono && A.length === CAP) continue; // finished tube
      for (let b = 0; b < tubes.length; b++) {
        if (a === b) continue;
        if (pourAmount(tubes, a, b) === 0) continue;
        if (aMono && tubes[b].length === 0) continue; // pointless shuffle
        const res = applyPour(tubes, a, b)!;
        const g = node.g + 1;
        const k = key(res.tubes);
        const prev = best.get(k);
        if (prev !== undefined && prev <= g) continue;
        best.set(k, g);
        open.push({
          tubes: res.tubes,
          g,
          f: g + weight * heuristic(res.tubes, colors),
          parent: node,
          move: [a, b],
        });
      }
    }
  }
  return null;
}
