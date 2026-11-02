import { LEVELS } from '../src/game/levelData';
import { applyPour, decodeTube, isSolved, CAP } from '../src/game/logic';
import { solve } from '../src/game/solver';

let bad = 0;
for (let i = 0; i < LEVELS.length; i++) {
  const tubes = LEVELS[i].tubes.map(decodeTube);
  const counts = new Map<number, number>();
  tubes.forEach((t) => t.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
  for (const [, n] of counts) if (n !== CAP) { console.log('bad count at level', i + 1); bad++; }
  const sol = solve(tubes, 200000);
  if (!sol) { console.log('unsolved level', i + 1); bad++; continue; }
  let cur = tubes;
  for (const [a, b] of sol) { const r = applyPour(cur, a, b); if (!r) { console.log('illegal move level', i + 1); bad++; break; } cur = r.tubes; }
  if (!isSolved(cur)) { console.log('replay not solved level', i + 1); bad++; }
  if (sol.length !== LEVELS[i].par) console.log('par drift level', i + 1, sol.length, LEVELS[i].par);
}
const show = [1, 5, 20, 60, 120, 200, 300];
for (const l of show) console.log('level', l, 'tubes', LEVELS[l - 1].tubes.length, 'par', LEVELS[l - 1].par);
console.log(bad === 0 ? 'ALL OK' : `FAILURES: ${bad}`);
if (bad > 0) process.exit(1);
