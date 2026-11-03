// Simula partidas reales entre bots para medir POPULARIDAD y PORCENTAJE DE VICTORIAS de cada set de objetos
// (assets/data/item_sets.json). Cada bot elige un set de su campeón; en la primera ronda al azar y después con
// preferencia por los que más ganan (así la popularidad sale de la simulación, no de una tabla).
//   node game/tools/simular_sets.mjs [partidas=120] [ronda=40] [tope_min=20] [hilos=auto]
// Al terminar: python3 tools/build_design.py (regenera game/src/data.js conservando estas cifras).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SETS_PATH = join(root, 'assets/data/item_sets.json');

if (!isMainThread) {
  const { Game } = await import('../src/world.js');
  const { ITEM_SETS } = await import('../src/data.js');
  parentPort.on('message', ({ seed, weights, cap }) => {
    const byChamp = {}; for (const s of ITEM_SETS) (byChamp[s.champ] = byChamp[s.champ] || []).push(s);
    const setPicker = (cid, rand) => { const sets = byChamp[cid]; const w = sets.map(s => weights[s.id] || 1); let r = rand() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < sets.length; i++) { r -= w[i]; if (r <= 0) return sets[i]; } return sets[sets.length - 1]; };
    const t0 = Date.now();
    const g = new Game({ mapId: 'grieta_ceniza', allBots: true, seed, setPicker, difficulty: 'normal' });
    while (!g.over && g.t < cap * 60) g.step();
    // sin Nexo caído al tope: gana quien lleva más torres, luego muertes, luego oro
    const score = t => g.towersDown[t] * 1e6 + g.kills[t] * 1e3 + g.champs.filter(c => c.team === t).reduce((a, c) => a + c.stats.gold, 0);
    const winner = g.over ? g.winner : score(0) >= score(1) ? 0 : 1;
    parentPort.postMessage({ seed, winner, t: g.t, over: g.over, ms: Date.now() - t0, uses: g.champs.map(c => ({ set: c.setId, team: c.team, items: c.items.length })) });
  });
} else {
  const [N = 120, ROUND = 40, CAP = 20, TH = Math.max(1, Math.min(8, cpus().length - 1))] = process.argv.slice(2).map(Number);
  const sets = JSON.parse(readFileSync(SETS_PATH, 'utf8'));
  const tally = Object.fromEntries(sets.map(s => [s.id, { games: 0, wins: 0 }]));
  const weightsNow = () => Object.fromEntries(sets.map(s => { const t = tally[s.id]; return [s.id, Math.pow((t.wins + 1) / (t.games + 2), 4)]; }));
  const workers = Array.from({ length: TH }, () => new Worker(fileURLToPath(import.meta.url)));
  let done = 0, next = 0, round = 0, weights = Object.fromEntries(sets.map(s => [s.id, 1]));
  const t0 = Date.now(); let items = 0, nUnits = 0;
  console.log(`${N} partidas (rondas de ${ROUND}, tope ${CAP} min) en ${TH} hilos…`);
  await new Promise(resolve => {
    const launch = w => { if (next >= N) return; const seed = 1000 + next++; w.postMessage({ seed, weights, cap: CAP }); };
    for (const w of workers) {
      w.on('message', m => {
        for (const u of m.uses) { if (!u.set || !tally[u.set]) continue; tally[u.set].games++; if (u.team === m.winner) tally[u.set].wins++; items += u.items; nUnits++; }
        done++;
        if (done % 10 === 0 || done === N) console.log(`  ${done}/${N} · última ${(m.t / 60).toFixed(1)} min${m.over ? '' : ' (tope)'} en ${(m.ms / 1000).toFixed(1)} s · ${((Date.now() - t0) / 1000).toFixed(0)} s totales`);
        if (done % ROUND === 0 && done < N) { round++; weights = weightsNow(); }
        if (done >= N) { if (done === N) resolve(); return; }
        launch(w);
      });
      launch(w);
    }
  });
  for (const w of workers) w.terminate();
  for (const s of sets) { const t = tally[s.id]; s.games = t.games; s.wins = t.wins; s.popularity = t.games; s.winrate = t.games ? t.wins / t.games : 0; }
  writeFileSync(SETS_PATH, JSON.stringify(sets, null, 1));
  const meta = { partidas: N, ronda: ROUND, tope_min: CAP, hilos: TH, fecha: new Date().toISOString(), segundos: Math.round((Date.now() - t0) / 1000), objetos_medios_por_bot: +(items / nUnits).toFixed(2) };
  writeFileSync(join(root, 'production/qa/evidence/2026-11-03-simulacion-sets.json'), JSON.stringify({ meta, sets: sets.map(s => ({ id: s.id, games: s.games, wins: s.wins, winrate: +s.winrate.toFixed(4) })) }, null, 1));
  console.log(`OK ${SETS_PATH}: ${sets.length} sets, ${N} partidas en ${meta.segundos} s; usos por set min ${Math.min(...sets.map(s => s.games))} · máx ${Math.max(...sets.map(s => s.games))}; objetos medios por bot ${meta.objetos_medios_por_bot}`);
  console.log('Ahora: python3 tools/build_design.py');
}
