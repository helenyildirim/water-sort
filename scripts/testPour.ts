import { LEVELS } from '../src/game/levelData';
import { decodeTube, pourAmount } from '../src/game/logic';
import { physicsFor } from '../src/art/geometry';
import { computeLayout } from '../src/ui/layout';
import { animDuration, createAnim, poseAt } from '../src/ui/pour';

let checks = 0;
let bad = 0;
for (const [W, Hh] of [[390, 560], [360, 480], [412, 640], [412, 700]]) {
  for (let li = 0; li < LEVELS.length; li += 3) {
    const tubes = LEVELS[li].tubes.map(decodeTube);
    const lay = computeLayout(tubes.length, W, Hh);
    const ph = physicsFor(lay.w);
    for (let a = 0; a < tubes.length; a++) for (let b = 0; b < tubes.length; b++) {
      const count = pourAmount(tubes, a, b);
      if (!count) continue;
      const color = tubes[a][tubes[a].length - 1];
      const anim = createAnim({ id: 1, from: a, to: b, count, color }, lay, ph, tubes[a].length, lay.lift, 0);
      anim.start = 0;
      const T = animDuration(anim);
      for (let k = 0; k <= 40; k++) {
        const p = poseAt(anim, (T * k) / 40);
        checks++;
        const vals = [p.angle, p.pivot.x, p.pivot.y, p.spilled, p.gain, p.stream];
        if (vals.some((v) => !Number.isFinite(v))) { bad++; console.log('NaN', li + 1, a, b, k); break; }
        if (p.spilled < -1e-6 || p.spilled > count + 1e-6 || p.gain > count + 1e-6) { bad++; console.log('range', li + 1, a, b, k, p.spilled, p.gain); break; }
      }
      const end = poseAt(anim, T);
      if (Math.abs(end.angle) > 1e-6 || Math.abs(end.pivot.x - anim.homePivot.x) > 1e-6 || Math.abs(end.pivot.y - anim.homePivot.y) > 1e-6 || Math.abs(end.spilled - count) > 1e-6 || Math.abs(end.gain - count) > 1e-6) {
        bad++; console.log('final pose mismatch', li + 1, a, b, end);
      }
    }
  }
}
console.log('pose checks', checks, bad === 0 ? 'ALL OK' : `FAILURES ${bad}`);
