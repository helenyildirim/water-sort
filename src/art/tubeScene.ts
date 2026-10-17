// Builds the drawing of one bottle as a plain node tree. TubeArt.tsx turns the
// tree into react-native-svg elements; scripts/preview.ts turns the very same
// tree into an SVG string so the look can be checked without a device.

import { COLORS, darken, lighten } from './colors';
import { Physics, bottlePoly, physicsFor, polyToPath, tubeHeight } from './geometry';

// Pseudo props: `rotate` (deg) with `ox`/`oy` origin and `x`/`y` translation are
// resolved by the renderer (react-native-svg) or the serializer (preview).
export type SvgNode = {
  tag: string;
  props: Record<string, string | number | undefined>;
  children?: SvgNode[];
};

export type Segment = { color: number; vol: number }; // vol in area units, bottom -> top

export type TubeSceneOpts = {
  id: string;
  w: number;
  /** Tilt in degrees, SVG sign (positive = clockwise). */
  angle: number;
  segments: Segment[];
  /** 0..1 sparkle/outline shown on a finished tube. */
  glow?: number;
};

const n = (v: number) => Math.round(v * 100) / 100;

const node = (tag: string, props: SvgNode['props'], children?: SvgNode[]): SvgNode => ({ tag, props, children });

function layerGradient(id: string, color: string): SvgNode {
  return node(
    'LinearGradient',
    { id, x1: 0, y1: 0, x2: 0, y2: 1 },
    [
      node('Stop', { offset: 0, stopColor: lighten(color, 0.22) }),
      node('Stop', { offset: 0.45, stopColor: color }),
      node('Stop', { offset: 1, stopColor: darken(color, 0.14) }),
    ],
  );
}

export function buildTubeScene(o: TubeSceneOpts): SvgNode {
  const { w, id } = o;
  const ph: Physics = physicsFor(w);
  const H = tubeHeight(w);
  const px = ph.pivot.x;
  const py = ph.pivot.y;
  const a = o.angle;

  const outer = polyToPath(bottlePoly(w, false));
  const inner = polyToPath(ph.inner);

  const defs: SvgNode[] = [
    node('ClipPath', { id: `${id}-clip` }, [node('Path', { d: inner })]),
    node('LinearGradient', { id: `${id}-shade`, x1: 0, y1: 0, x2: w, y2: 0, gradientUnits: 'userSpaceOnUse' }, [
      node('Stop', { offset: 0, stopColor: '#000000', stopOpacity: 0.3 }),
      node('Stop', { offset: 0.16, stopColor: '#000000', stopOpacity: 0.04 }),
      node('Stop', { offset: 0.3, stopColor: '#ffffff', stopOpacity: 0.1 }),
      node('Stop', { offset: 0.5, stopColor: '#ffffff', stopOpacity: 0 }),
      node('Stop', { offset: 0.82, stopColor: '#000000', stopOpacity: 0.06 }),
      node('Stop', { offset: 1, stopColor: '#000000', stopOpacity: 0.34 }),
    ]),
    node('LinearGradient', { id: `${id}-streak`, x1: 0, y1: 0, x2: 0, y2: 1 }, [
      node('Stop', { offset: 0, stopColor: '#ffffff', stopOpacity: 0.7 }),
      node('Stop', { offset: 1, stopColor: '#ffffff', stopOpacity: 0.08 }),
    ]),
    node('LinearGradient', { id: `${id}-glass`, x1: 0, y1: 0, x2: 1, y2: 1 }, [
      node('Stop', { offset: 0, stopColor: '#dff1ff', stopOpacity: 0.2 }),
      node('Stop', { offset: 1, stopColor: '#a9cdf5', stopOpacity: 0.08 }),
    ]),
  ];

  // ---- liquid -------------------------------------------------------------
  const used = new Set<number>();
  o.segments.forEach((s) => used.add(s.color));
  used.forEach((c) => defs.push(layerGradient(`${id}-c${c}`, COLORS[c])));

  const liquid: SvgNode[] = [];
  const live = o.segments.filter((s) => s.vol > 0.0001);
  if (live.length > 0) {
    // Bottom edge of the lowest layer: far below the bottle.
    let prevY = H + w;
    let cum = 0;
    for (let i = 0; i < live.length; i++) {
      cum += live[i].vol;
      const top = ph.level(a, cum);
      const h = prevY - top;
      if (h > 0) {
        liquid.push(
          node('Rect', {
            x: n(-6 * w),
            y: n(top),
            width: n(13 * w),
            height: n(h + (i === 0 ? 0 : 0.6)),
            fill: `url(#${id}-c${live[i].color})`,
          }),
        );
      }
      prevY = top;
    }
    // Surface of the top layer: a lighter ellipse that gives the water depth.
    const topColor = COLORS[live[live.length - 1].color];
    const ch = ph.chord(a, prevY);
    const rx = Math.max(0, (ch.x1 - ch.x0) / 2);
    if (rx > 0.5) {
      const cx = (ch.x0 + ch.x1) / 2;
      liquid.push(
        node('Ellipse', {
          cx: n(cx),
          cy: n(prevY),
          rx: n(rx),
          ry: n(Math.min(rx * 0.2, w * 0.1)),
          fill: lighten(topColor, 0.4),
          fillOpacity: 0.95,
        }),
        node('Ellipse', {
          cx: n(cx - rx * 0.18),
          cy: n(prevY - rx * 0.02),
          rx: n(rx * 0.55),
          ry: n(Math.min(rx * 0.085, w * 0.045)),
          fill: '#ffffff',
          fillOpacity: 0.45,
        }),
      );
    }
  }

  // ---- tube-frame decoration ---------------------------------------------
  const body: SvgNode[] = [];
  body.push(node('Path', { d: outer, fill: `url(#${id}-glass)` }));
  body.push(
    node('G', { clipPath: `url(#${id}-clip)` }, [
      node('G', { rotate: n(-a), ox: n(px), oy: n(py) }, liquid),
      node('Rect', { x: 0, y: 0, width: n(w), height: n(H), fill: `url(#${id}-shade)` }),
    ]),
  );

  // Glass edge + highlights (these turn with the bottle).
  body.push(node('Path', { d: outer, fill: 'none', stroke: '#ffffff', strokeOpacity: 0.55, strokeWidth: n(Math.max(1.2, w * 0.03)) }));
  body.push(
    node('Rect', {
      x: n(0.15 * w),
      y: n(0.62 * w),
      width: n(0.085 * w),
      height: n(H - 1.5 * w),
      rx: n(0.042 * w),
      fill: `url(#${id}-streak)`,
      opacity: 0.85,
    }),
  );
  body.push(
    node('Rect', {
      x: n(0.79 * w),
      y: n(0.95 * w),
      width: n(0.04 * w),
      height: n(H - 2.4 * w),
      rx: n(0.02 * w),
      fill: '#ffffff',
      opacity: 0.22,
    }),
  );
  body.push(
    node('Ellipse', {
      cx: n(0.5 * w),
      cy: n(H - 0.26 * w),
      rx: n(0.2 * w),
      ry: n(0.045 * w),
      fill: '#ffffff',
      opacity: 0.2,
    }),
  );
  // flared lip
  body.push(
    node('Rect', {
      x: n(0.1 * w),
      y: n(0.03 * w),
      width: n(0.8 * w),
      height: n(0.12 * w),
      rx: n(0.06 * w),
      fill: '#ffffff',
      fillOpacity: 0.26,
      stroke: '#ffffff',
      strokeOpacity: 0.7,
      strokeWidth: n(Math.max(1, w * 0.025)),
    }),
  );

  if (o.glow && o.glow > 0) {
    body.push(
      node('Path', {
        d: outer,
        fill: 'none',
        stroke: '#fff7c2',
        strokeWidth: n(w * 0.07),
        strokeOpacity: 0.85 * o.glow,
      }),
    );
  }

  return node('G', a ? { rotate: n(a), ox: n(px), oy: n(py) } : {}, [node('Defs', {}, defs), ...body]);
}

export function glossShadow(w: number): SvgNode {
  const H = tubeHeight(w);
  return node('Ellipse', {
    cx: n(w / 2),
    cy: n(H - 0.01 * w),
    rx: n(0.52 * w),
    ry: n(0.1 * w),
    fill: '#000000',
    fillOpacity: 0.28,
  });
}
