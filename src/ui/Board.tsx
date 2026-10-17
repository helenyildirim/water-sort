import React, { memo, useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Ellipse, G, Rect } from 'react-native-svg';
import { COLORS, lighten } from '../art/colors';
import { physicsFor } from '../art/geometry';
import { renderNode } from '../art/svgRender';
import { shelfScene } from '../art/backgroundScene';
import { Segment, buildTubeScene, glossShadow } from '../art/tubeScene';
import { Tubes, isTubeDone } from '../game/logic';
import type { Theme } from '../game/themes';
import { computeLayout } from './layout';
import { Anim, Pose, PourOrder, animDuration, createAnim, poseAt, segmentsOf, truncate } from './pour';

export type { PourOrder };

type Props = {
  tubes: Tubes;
  selected: number | null;
  hint: [number, number] | null;
  width: number;
  height: number;
  theme: Theme;
  pour: PourOrder | null;
  onTap: (i: number) => void;
  onPourDone: (id: number) => void;
};

// ---------------------------------------------------------------------------

type TubeViewProps = {
  id: string;
  w: number;
  x: number;
  y: number;
  angle: number;
  segments: Segment[];
  glow: number;
};

const TubeView = memo(function TubeView({ id, w, x, y, angle, segments, glow }: TubeViewProps) {
  const scene = useMemo(() => buildTubeScene({ id, w, angle, segments, glow }), [id, w, angle, segments, glow]);
  const shadow = useMemo(() => glossShadow(w), [w]);
  return (
    <G x={x} y={y}>
      {angle === 0 && renderNode(shadow)}
      {renderNode(scene)}
    </G>
  );
});

// ---------------------------------------------------------------------------

export function Board({ tubes, selected, hint, width, height, theme, pour, onTap, onPourDone }: Props) {
  const layout = useMemo(() => computeLayout(tubes.length, width, height), [tubes.length, width, height]);
  const { w, H } = layout;
  const margin = Math.round(1.8 * w);
  const ph = useMemo(() => physicsFor(w), [w]);
  const segs = useMemo(() => tubes.map((t) => segmentsOf(t, ph.unit)), [tubes, ph]);

  const [, bump] = useReducer((x: number) => x + 1, 0);
  const raf = useRef<number | null>(null);
  const lastTs = useRef(0);
  const nowTs = useRef(0);
  const lifts = useRef<number[]>([]);
  const pulses = useRef<Record<number, number>>({});
  const prevDone = useRef<boolean[]>([]);
  const animRef = useRef<Anim | null>(null);
  const live = useRef({ selected, hint, layout, ph, onPourDone, pour });
  live.current = { selected, hint, layout, ph, onPourDone, pour };
  const loopRef = useRef<(ts: number) => void>(() => {});

  loopRef.current = (ts: number) => {
    const L = live.current;
    nowTs.current = ts;
    const dt = Math.min(50, lastTs.current ? ts - lastTs.current : 16);
    lastTs.current = ts;
    let active = false;

    const anim = L.pour ? animRef.current : null;
    for (let i = 0; i < tubes.length; i++) {
      const target = L.selected === i && !(anim && anim.order.from === i) ? 1 : 0;
      const cur = lifts.current[i] ?? 0;
      const next = cur + (target - cur) * (1 - Math.exp(-dt / 55));
      lifts.current[i] = Math.abs(target - next) < 0.003 ? target : next;
      if (lifts.current[i] !== target) active = true;
    }
    if (anim) {
      active = true;
      if (!anim.notified && ts - anim.start >= animDuration(anim)) {
        anim.notified = true;
        L.onPourDone(anim.order.id);
      }
    }
    for (const k of Object.keys(pulses.current)) {
      if (ts - pulses.current[Number(k)] < 800) active = true;
      else delete pulses.current[Number(k)];
    }
    if (L.hint) active = true;
    bump();
    if (active) raf.current = requestAnimationFrame((t) => loopRef.current(t));
    else {
      raf.current = null;
      lastTs.current = 0;
    }
  };

  const kick = () => {
    if (raf.current == null) {
      lastTs.current = 0;
      raf.current = requestAnimationFrame((t) => loopRef.current(t));
    }
  };

  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
  }, []);

  useEffect(kick, [selected, hint]);

  // celebrate bottles that just became complete
  useEffect(() => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    tubes.forEach((t, i) => {
      const done = isTubeDone(t);
      if (done && prevDone.current[i] === false) pulses.current[i] = now;
      prevDone.current[i] = done;
    });
    if (Object.keys(pulses.current).length) kick();
  }, [tubes]);

  // start a pour
  const pourId = pour?.id ?? null;
  useEffect(() => {
    if (!pour) {
      animRef.current = null;
      return;
    }
    const L = live.current;
    const liftNow = (lifts.current[pour.from] ?? 1) * L.layout.lift;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    animRef.current = createAnim(pour, L.layout, L.ph, tubes[pour.from].length, liftNow, nowMs);
    kick();
  }, [pourId]);

  // ---- render ---------------------------------------------------------------
  const now = nowTs.current || (typeof performance !== 'undefined' ? performance.now() : 0);
  const anim = pour ? animRef.current : null;
  let pose: Pose | null = null;
  if (anim) pose = poseAt(anim, Math.max(0, now - anim.start));

  const items: React.ReactElement[] = [];
  tubes.forEach((t, i) => {
    if (anim && i === anim.order.from) return;
    const p = layout.pos[i];
    let segments = segs[i];
    if (anim && pose && i === anim.order.to && pose.gain > 0.0005) {
      const copy = segs[i].map((s) => ({ ...s }));
      const last = copy[copy.length - 1];
      if (last && last.color === anim.order.color) last.vol += pose.gain * ph.unit;
      else copy.push({ color: anim.order.color, vol: pose.gain * ph.unit });
      segments = copy;
    }
    const lift = (lifts.current[i] ?? 0) * layout.lift;
    let glow = 0;
    if (isTubeDone(t) && !(anim && i === anim.order.to && pose && pose.gain < anim.order.count)) {
      const pt = pulses.current[i];
      const pulse = pt !== undefined ? Math.max(0, 1 - (now - pt) / 800) : 0;
      glow = 0.32 + 0.68 * pulse;
    }
    if (hint && (hint[0] === i || hint[1] === i)) glow = Math.max(glow, 0.45 + 0.45 * Math.sin(now / 160));
    items.push(
      <TubeView key={`t${i}`} id={`t${i}`} w={w} x={p.x} y={p.y - lift} angle={0} segments={segments} glow={glow} />,
    );
  });

  let overlay: React.ReactElement | null = null;
  if (anim && pose) {
    const i = anim.order.from;
    const home = layout.pos[i];
    const segments = truncate(segs[i], anim.vStart - pose.spilled * ph.unit);
    const x = pose.pivot.x - ph.pivot.x;
    const y = pose.pivot.y - ph.pivot.y;
    const color = COLORS[anim.order.color];
    const targetVol = (tubes[anim.order.to].length + pose.gain) * ph.unit;
    const surfaceY = anim.targetPos.y + ph.level(0, targetVol);
    const sw = Math.max(2, w * 0.18 * pose.stream);
    const streamTop = anim.Q.y;
    const streamH = Math.max(0, surfaceY - streamTop);
    void home;
    overlay = (
      <G>
        <TubeView key={`p${i}`} id={`t${i}`} w={w} x={x} y={y} angle={pose.angle} segments={segments} glow={0} />
        {pose.stream > 0.02 && streamH > 1 && (
          <G>
            <Rect x={anim.Q.x - sw / 2} y={streamTop} width={sw} height={streamH} rx={sw / 2} fill={color} />
            <Rect x={anim.Q.x - sw * 0.28} y={streamTop} width={sw * 0.22} height={streamH} rx={sw * 0.11} fill="#ffffff" fillOpacity={0.4} />
            <Ellipse cx={anim.Q.x} cy={surfaceY} rx={sw * 1.15} ry={sw * 0.38} fill={lighten(color, 0.45)} fillOpacity={0.85} />
          </G>
        )}
      </G>
    );
  }

  const shelves: React.ReactElement[] = [];
  if (theme.shelf) {
    layout.rows.forEach((r, ri) => {
      const nodes = shelfScene(r.x - 0.5 * w, r.y + H - 0.04 * w, r.width + w, 0.26 * w, `shelf${ri}`);
      shelves.push(<G key={`s${ri}`}>{nodes.map((n, k) => renderNode(n, k))}</G>);
    });
  }

  return (
    <View style={{ width, height }}>
      <Svg
        width={width + 2 * margin}
        height={height + margin}
        pointerEvents="none"
        style={{ position: 'absolute', left: -margin, top: -margin }}
      >
        <G x={margin} y={margin}>
          {shelves}
          {items}
          {overlay}
        </G>
      </Svg>
      {tubes.map((_, i) => {
        const p = layout.pos[i];
        return (
          <Pressable
            key={`hit${i}`}
            onPress={() => onTap(i)}
            style={{
              position: 'absolute',
              left: p.x - layout.gapX / 2,
              top: p.y - 0.7 * w,
              width: w + layout.gapX,
              height: H + 0.9 * w,
            }}
          />
        );
      })}
    </View>
  );
}
