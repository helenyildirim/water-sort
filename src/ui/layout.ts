import { TUBE_H_RATIO } from '../art/geometry';

export type BoardLayout = {
  w: number;
  H: number;
  gapX: number;
  boardW: number;
  boardH: number;
  pos: { x: number; y: number; row: number }[];
  rows: { y: number; x: number; width: number }[];
  lift: number;
};

const gapFor = (per: number) => (per >= 6 ? 0.28 : 0.42);
const GAP_Y = 0.62;
const TOP = 0.95; // head room above the first row (lift + pour animation)
const BOTTOM = 0.25;

/** Picks the biggest bottle size that fits `n` bottles into the area. */
export function computeLayout(n: number, availW: number, availH: number): BoardLayout {
  let best = { w: 0, per: 1, gap: 0.42 };
  for (let per = 1; per <= Math.min(7, n); per++) {
    const rows = Math.ceil(n / per);
    const gap = gapFor(per);
    const wByW = availW / (per + (per - 1) * gap);
    const wByH = availH / (TOP + rows * TUBE_H_RATIO + (rows - 1) * GAP_Y + BOTTOM);
    const w = Math.min(wByW, wByH, 66);
    if (w > best.w + 0.5) best = { w, per, gap };
  }
  const w = best.w;
  const H = TUBE_H_RATIO * w;
  const gapX = best.gap * w;
  const rowCount = Math.ceil(n / best.per);

  // spread bottles evenly across rows (e.g. 7 -> 4 + 3)
  const sizes: number[] = [];
  const base = Math.floor(n / rowCount);
  const extra = n % rowCount;
  for (let r = 0; r < rowCount; r++) sizes.push(base + (r < extra ? 1 : 0));

  const contentH = (TOP + rowCount * TUBE_H_RATIO + (rowCount - 1) * GAP_Y + BOTTOM) * w;
  const offsetY = Math.max(0, (availH - contentH) / 2);

  const pos: BoardLayout['pos'] = [];
  const rows: BoardLayout['rows'] = [];
  for (let r = 0; r < rowCount; r++) {
    const cnt = sizes[r];
    const rowW = cnt * w + (cnt - 1) * gapX;
    const x0 = (availW - rowW) / 2;
    const y = offsetY + TOP * w + r * (H + GAP_Y * w);
    rows.push({ y, x: x0, width: rowW });
    for (let c = 0; c < cnt; c++) pos.push({ x: x0 + c * (w + gapX), y, row: r });
  }
  return { w, H, gapX, boardW: availW, boardH: availH, pos, rows, lift: 0.55 * w };
}
