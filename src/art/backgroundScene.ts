// Full-screen backdrops, built as node trees (same idea as tubeScene.ts).
import type { Theme } from '../game/themes';
import type { SvgNode } from './tubeScene';

const node = (tag: string, props: SvgNode['props'], children?: SvgNode[]): SvgNode => ({ tag, props, children });
const r1 = (v: number) => Math.round(v * 10) / 10;

// small deterministic random so backdrops never jitter between renders
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A leaf outline starting at (cx,cy), `len` long, pointing at `deg`. */
function leaf(cx: number, cy: number, len: number, deg: number, fill: string, opacity: number): SvgNode {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const T = (x: number, y: number) => `${r1(cx + x * c - y * s)} ${r1(cy + x * s + y * c)}`;
  const L = len;
  const d =
    `M${T(0, 0)} C${T(0.3 * L, -0.34 * L)} ${T(0.75 * L, -0.34 * L)} ${T(L, 0)} ` +
    `C${T(0.75 * L, 0.34 * L)} ${T(0.3 * L, 0.34 * L)} ${T(0, 0)} Z`;
  return node('Path', { d, fill, fillOpacity: opacity });
}

function plant(cx: number, cy: number, len: number, baseDeg: number, fill: string, opacity: number, count = 6): SvgNode[] {
  const out: SvgNode[] = [];
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) * 24;
    out.push(leaf(cx, cy, len * (0.78 + 0.22 * Math.sin(i * 1.7 + 1)), baseDeg + spread, fill, opacity));
  }
  return out;
}

function glow(id: string, cx: number, cy: number, r: number, color: string, op: number): SvgNode[] {
  return [
    node('Defs', {}, [
      node('RadialGradient', { id, cx, cy, r, gradientUnits: 'userSpaceOnUse' }, [
        node('Stop', { offset: 0, stopColor: color, stopOpacity: op }),
        node('Stop', { offset: 1, stopColor: color, stopOpacity: 0 }),
      ]),
    ]),
    node('Rect', { x: r1(cx - r), y: r1(cy - r), width: r1(2 * r), height: r1(2 * r), fill: `url(#${id})` }),
  ];
}

function dots(seed: number, count: number, W: number, H: number, color: string, minR: number, maxR: number, op: number): SvgNode[] {
  const rand = rng(seed);
  const out: SvgNode[] = [];
  for (let i = 0; i < count; i++) {
    out.push(
      node('Circle', {
        cx: r1(rand() * W),
        cy: r1(rand() * H),
        r: r1(minR + rand() * (maxR - minR)),
        fill: color,
        fillOpacity: r1((0.3 + rand() * 0.7) * op * 100) / 100,
      }),
    );
  }
  return out;
}

export function backgroundScene(theme: Theme, W: number, H: number): SvgNode[] {
  const out: SvgNode[] = [];
  out.push(
    node('Defs', {}, [
      node('LinearGradient', { id: `bg-${theme.id}-main`, x1: 0, y1: 0, x2: 0, y2: 1 }, [
        node('Stop', { offset: 0, stopColor: theme.stops[0] }),
        node('Stop', { offset: 0.5, stopColor: theme.stops[1] }),
        node('Stop', { offset: 1, stopColor: theme.stops[2] }),
      ]),
    ]),
    node('Rect', { x: 0, y: 0, width: W, height: H, fill: `url(#bg-${theme.id}-main)` }),
  );

  switch (theme.id) {
    case 'midnight': {
      out.push(...glow(`bg-${theme.id}-g1`, W * 0.12, H * 0.12, W * 0.9, '#7fc4ff', 0.28));
      out.push(...dots(11, 18, W, H, '#9fd4ff', 1.5, 5, 0.22));
      out.push(...plant(-10, H * 0.9, 150, -35, '#0a4a5c', 0.6, 7));
      out.push(...plant(W + 10, H * 0.62, 130, 215, '#0a4a5c', 0.5, 6));
      out.push(...plant(W * 0.1, -6, 110, 80, '#0a3a52', 0.5, 5));
      break;
    }
    case 'violet': {
      out.push(...glow(`bg-${theme.id}-g1`, W * 0.5, H * 0.3, W * 0.85, '#b07bff', 0.22));
      out.push(...dots(23, 26, W, H, '#e6d4ff', 1, 3.2, 0.5));
      out.push(...plant(-6, H * 0.12, 120, 20, '#2b6b4f', 0.45, 5));
      out.push(...plant(W + 6, H * 0.18, 120, 160, '#2b6b4f', 0.45, 5));
      break;
    }
    case 'forest': {
      out.push(...glow(`bg-${theme.id}-g1`, W * 0.7, H * 0.08, W * 0.9, '#d6ff9a', 0.22));
      out.push(...plant(-12, H * 0.95, 190, -50, '#0a5a32', 0.7, 8));
      out.push(...plant(W + 12, H * 0.95, 190, 230, '#0a5a32', 0.7, 8));
      out.push(...plant(W * 0.5, -10, 130, 90, '#0b6a3a', 0.55, 8));
      out.push(...dots(31, 22, W, H, '#fff2a0', 1.2, 3.4, 0.7));
      break;
    }
    case 'zen': {
      out.push(...glow(`bg-${theme.id}-g1`, W * 0.5, H * 0.18, W * 0.8, '#e6b8ff', 0.26));
      out.push(node('Circle', { cx: W * 0.74, cy: H * 0.14, r: W * 0.1, fill: '#fbe9ff', fillOpacity: 0.22 }));
      // pagoda silhouette
      const bx = W * 0.3;
      const by = H * 0.52;
      const tiers = [0, 1, 2];
      tiers.forEach((i) => {
        const wRoof = W * (0.3 - i * 0.07);
        const y = by - i * (W * 0.1);
        out.push(
          node('Path', {
            d: `M${r1(bx - wRoof / 2)} ${r1(y)} Q${r1(bx)} ${r1(y - W * 0.06)} ${r1(bx + wRoof / 2)} ${r1(y)} L${r1(bx + wRoof / 2 - 6)} ${r1(y + 6)} L${r1(bx - wRoof / 2 + 6)} ${r1(y + 6)} Z`,
            fill: '#150a33',
            fillOpacity: 0.55,
          }),
          node('Rect', { x: r1(bx - wRoof * 0.28), y: r1(y + 6), width: r1(wRoof * 0.56), height: r1(W * 0.06), fill: '#150a33', fillOpacity: 0.5 }),
        );
      });
      out.push(node('Ellipse', { cx: W * 0.78, cy: H * 0.9, rx: W * 0.16, ry: W * 0.06, fill: '#7c5aa8', fillOpacity: 0.4 }));
      out.push(node('Ellipse', { cx: W * 0.64, cy: H * 0.93, rx: W * 0.1, ry: W * 0.04, fill: '#7c5aa8', fillOpacity: 0.35 }));
      out.push(...plant(W + 4, H * 0.7, 120, 205, '#3c8f6a', 0.35, 5));
      out.push(...dots(41, 16, W, H, '#f1dcff', 1, 2.6, 0.5));
      break;
    }
    case 'sunset': {
      out.push(...glow(`bg-${theme.id}-g1`, W * 0.5, H * 0.34, W * 0.95, '#ffd27a', 0.55));
      out.push(node('Circle', { cx: W * 0.5, cy: H * 0.3, r: W * 0.17, fill: '#fff0b8', fillOpacity: 0.55 }));
      const m = (base: number, amp: number, seed: number, fill: string, op: number) => {
        const rand = rng(seed);
        let d = `M0 ${r1(H)} L0 ${r1(base)}`;
        const steps = 7;
        for (let i = 1; i <= steps; i++) {
          d += ` L${r1((W * i) / steps)} ${r1(base - rand() * amp)}`;
        }
        d += ` L${W} ${r1(H)} Z`;
        return node('Path', { d, fill, fillOpacity: op });
      };
      out.push(m(H * 0.62, H * 0.12, 5, '#6d1f2d', 0.6));
      out.push(m(H * 0.72, H * 0.1, 9, '#451425', 0.8));
      out.push(m(H * 0.84, H * 0.07, 14, '#2a0c1b', 0.95));
      out.push(...plant(-8, H * 0.2, 110, 10, '#7a2417', 0.55, 4));
      out.push(...plant(W + 8, H * 0.24, 110, 170, '#7a2417', 0.55, 4));
      break;
    }
  }
  return out;
}

/** Wooden plank under a row of bottles (for shelf themes). */
export function shelfScene(x: number, y: number, width: number, thickness: number, id: string): SvgNode[] {
  return [
    node('Defs', {}, [
      node('LinearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, [
        node('Stop', { offset: 0, stopColor: '#a8723f' }),
        node('Stop', { offset: 0.35, stopColor: '#8a5a2f' }),
        node('Stop', { offset: 1, stopColor: '#4a2d16' }),
      ]),
    ]),
    node('Rect', { x: r1(x), y: r1(y), width: r1(width), height: r1(thickness), rx: r1(thickness * 0.3), fill: `url(#${id})` }),
    node('Rect', { x: r1(x + 2), y: r1(y + 1), width: r1(width - 4), height: r1(Math.max(1.5, thickness * 0.16)), rx: 1, fill: '#ffffff', fillOpacity: 0.22 }),
  ];
}
