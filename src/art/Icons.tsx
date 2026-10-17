import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'pause'
  | 'undo'
  | 'restart'
  | 'addTube'
  | 'bulb'
  | 'gear'
  | 'home'
  | 'grid'
  | 'palette'
  | 'star'
  | 'trophy'
  | 'gift'
  | 'lock'
  | 'check'
  | 'left'
  | 'right'
  | 'close'
  | 'play'
  | 'dots';

type Def = { stroke?: string[]; fill?: string[] };

const DEFS: Record<IconName, Def> = {
  pause: { fill: [] },
  undo: { stroke: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'] },
  restart: { stroke: ['M20 12a8 8 0 1 1-2.6-5.9', 'M20 4v5h-5'] },
  addTube: { stroke: ['M8 3h8', 'M9 3v10a3 3 0 0 0 6 0V3', 'M19 15v6', 'M16 18h6'] },
  bulb: {
    stroke: [
      'M9 18h6',
      'M10 21h4',
      'M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.6V16h5.6v-.6c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z',
    ],
  },
  gear: { fill: [] },
  home: { fill: ['M3 11.2 12 3l9 8.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z'] },
  grid: { fill: [] },
  palette: {
    fill: [
      'M12 3a9 9 0 1 0 0 18c1.6 0 2.2-1.1 1.5-2.3-.6-1.1 0-2.3 1.3-2.3H17a4 4 0 0 0 4-4c0-5-4-9.4-9-9.4Z',
    ],
  },
  star: { fill: ['M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8Z'] },
  trophy: {
    fill: ['M7 3.5h10V9a5 5 0 0 1-10 0Z', 'M9 18h6v3H9Z', 'M11 14.5h2V18h-2Z'],
    stroke: ['M7 5.5H4v1.5a3 3 0 0 0 3 3', 'M17 5.5h3v1.5a3 3 0 0 1-3 3'],
  },
  gift: {
    fill: ['M4 10h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z', 'M3 7h18v3H3Z'],
    stroke: ['M12 7v14', 'M12 7c-1.5-4-6-4-5 0 .5 1.5 3 1.2 5 0Zm0 0c1.5-4 6-4 5 0-.5 1.5-3 1.2-5 0Z'],
  },
  lock: { stroke: ['M7.5 11V8a4.5 4.5 0 0 1 9 0v3'], fill: ['M5.5 11h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z'] },
  check: { stroke: ['M5 12.5l4.5 4.5L19 7.5'] },
  left: { stroke: ['M15 5l-7 7 7 7'] },
  right: { stroke: ['M9 5l7 7-7 7'] },
  close: { stroke: ['M6 6l12 12', 'M18 6 6 18'] },
  play: { fill: ['M8 5.2v13.6a.6.6 0 0 0 .9.5l11-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5Z'] },
  dots: { fill: [] },
};

export function Icon({ name, size = 24, color = '#fff', strokeWidth = 2.2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const def = DEFS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {def.fill?.map((d, i) => (
        <Path key={`f${i}`} d={d} fill={color} />
      ))}
      {def.stroke?.map((d, i) => (
        <Path key={`s${i}`} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {name === 'pause' && (
        <>
          <Rect x={6} y={4.5} width={4} height={15} rx={1.4} fill={color} />
          <Rect x={14} y={4.5} width={4} height={15} rx={1.4} fill={color} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x={3.5} y={3.5} width={7} height={7} rx={2} fill={color} />
          <Rect x={13.5} y={3.5} width={7} height={7} rx={2} fill={color} />
          <Rect x={3.5} y={13.5} width={7} height={7} rx={2} fill={color} />
          <Rect x={13.5} y={13.5} width={7} height={7} rx={2} fill={color} />
        </>
      )}
      {name === 'dots' && (
        <>
          <Circle cx={5} cy={12} r={2.2} fill={color} />
          <Circle cx={12} cy={12} r={2.2} fill={color} />
          <Circle cx={19} cy={12} r={2.2} fill={color} />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle cx={12} cy={12} r={6.4} fill={color} />
          {[0, 45, 90, 135].map((a) => (
            <Rect key={a} x={10.2} y={1.8} width={3.6} height={20.4} rx={1.6} fill={color} rotation={a} originX={12} originY={12} />
          ))}
          <Circle cx={12} cy={12} r={2.7} fill="#0b1b40" />
        </>
      )}
      {name === 'palette' && (
        <>
          <Circle cx={8} cy={10} r={1.5} fill="#0b1b40" />
          <Circle cx={12} cy={7.5} r={1.5} fill="#0b1b40" />
          <Circle cx={16} cy={10} r={1.5} fill="#0b1b40" />
        </>
      )}
    </Svg>
  );
}

/** Gold coin used in the top bars. */
export function Coin({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={15} fill="#b8741a" />
      <Circle cx={16} cy={15} r={14} fill="#ffc43a" />
      <Circle cx={16} cy={15} r={10.6} fill="#ffdf74" stroke="#e39a1c" strokeWidth={1.4} />
      <Path d="M10.5 19.5 9.6 12l4.2 3.3L16 10.5l2.2 4.8 4.2-3.3-.9 7.5Z" fill="#e0861a" />
      <Path d="M8 8c2-3 5-4.6 8-4.6" fill="none" stroke="#fff7d1" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
    </Svg>
  );
}
