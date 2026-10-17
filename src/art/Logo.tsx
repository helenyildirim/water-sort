import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { APP_TITLE } from '../config';

function Drop({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  // teardrop with its point up
  const d = `M${x} ${y - 12 * s} C${x + 3 * s} ${y - 5 * s} ${x + 9 * s} ${y - 1 * s} ${x + 9 * s} ${y + 5 * s} A${9 * s} ${9 * s} 0 0 1 ${x - 9 * s} ${y + 5 * s} C${x - 9 * s} ${y - 1 * s} ${x - 3 * s} ${y - 5 * s} ${x} ${y - 12 * s}Z`;
  return <Path d={d} fill={color} />;
}

export function Logo({ width = 300 }: { width?: number }) {
  const h = width * 0.66;
  return (
    <Svg width={width} height={h} viewBox="0 0 320 211">
      <Defs>
        <LinearGradient id="logo-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#cfe3ff" />
        </LinearGradient>
        <LinearGradient id="logo-bot" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5ae6ff" />
          <Stop offset="1" stopColor="#1b8cff" />
        </LinearGradient>
      </Defs>
      <SvgText x={160} y={92} fontSize={84} fontWeight="900" textAnchor="middle" stroke="#2b66d1" strokeWidth={16} strokeLinejoin="round" fill="#2b66d1">
        {APP_TITLE[0]}
      </SvgText>
      <SvgText x={160} y={92} fontSize={84} fontWeight="900" textAnchor="middle" fill="url(#logo-top)">
        {APP_TITLE[0]}
      </SvgText>
      <SvgText x={160} y={186} fontSize={84} fontWeight="900" textAnchor="middle" stroke="#0a3b94" strokeWidth={16} strokeLinejoin="round" fill="#0a3b94">
        {APP_TITLE[1]}
      </SvgText>
      <SvgText x={160} y={186} fontSize={84} fontWeight="900" textAnchor="middle" fill="url(#logo-bot)">
        {APP_TITLE[1]}
      </SvgText>
      <Drop x={14} y={150} s={0.9} color="#3fc8ff" />
      <Drop x={306} y={150} s={0.9} color="#3fc8ff" />
      <Drop x={160} y={14} s={1.1} color="#ffffff" />
    </Svg>
  );
}
