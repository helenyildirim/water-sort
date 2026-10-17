// 12 liquid colors, picked to stay distinguishable from each other.
export const COLORS: string[] = [
  '#2B7BFF', // 0 blue
  '#FFD21E', // 1 yellow
  '#F0384F', // 2 red
  '#36C74B', // 3 green
  '#9239E8', // 4 purple
  '#FF8A1E', // 5 orange
  '#FF4FA3', // 6 pink
  '#17B8A6', // 7 teal
  '#3CCBFF', // 8 sky
  '#B7E21F', // 9 lime
  '#A6683B', // 10 brown
  '#8A98A8', // 11 slate
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, '0');
}

/** Mix `hex` towards `target` by t (0..1). */
export function mix(hex: string, target: string, t: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return '#' + toHex(a[0] + (b[0] - a[0]) * t) + toHex(a[1] + (b[1] - a[1]) * t) + toHex(a[2] + (b[2] - a[2]) * t);
}

export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t);
export const darken = (hex: string, t: number) => mix(hex, '#000000', t);
