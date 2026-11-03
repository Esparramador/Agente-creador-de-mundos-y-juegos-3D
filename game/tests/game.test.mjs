// Pruebas del juego: node --test game/tests/
// Cubre: fórmulas de combat-core.md, las 60 habilidades y 15 pasivas, objetos, hechizos, estructuras,
// visión, reglas de cada mapa y partidas completas entre bots en los 3 mapas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, CHAMP_BY_ID } from '../src/world.js';
import { CHAMPIONS, ITEMS } from '../src/data.js';
import { KITS } from '../src/kits.js';
import { TICK, mitigation, ccDuration, applyCC, dealDamage, recalcStats, hasBuff, xpToNext, growth } from '../src/core.js';
import { wallCircles } from '../src/maps.js';
import { findPath, segmentBlocked } from '../src/nav.js';

const steps = (g, s) => { for (let i = 0; i < Math.round(s / TICK); i++) g.step(); };
// arena controlada: sin súbditos ni bots, jugador en el centro del mapa y un enemigo enfrente
function arena(champId, enemyId = 'brannoc', opts = {}) {
  const g = new Game({ mapId: 'grieta_ceniza', picks: { 0: [champId], 1: [enemyId] }, seed: 3, ...opts });
  g.nextWave = 1e9; g.epicNext = { dragon: 1e9, herald: 1e9, lord: 1e9 }; g.camps.forEach(c => c.next = 1e9);
  const p = g.player, e = g.champs.find(c => c.team === 1 && c.cid === enemyId);
  for (const c of g.champs) if (c !== p && c !== e) { c.alive = false; c.respawnAt = 1e9; c.x = -9999; }
  for (const c of [p, e]) { c.level = 18; c.ranks = { Q: 5, W: 5, E: 5, R: 3 }; c.recalc = true; g.recalcRes(c); recalcStats(g, c); c.hp = c.st.maxHp; c.res = c.resMax || 100; }
  p.x = 7000; p.y = 6000; e.x = 7250; e.y = 6000; e.isPlayer = true; // el enemigo no piensa (lo tratamos como jugador inactivo)
  g.updateVision();
  return { g, p, e };
}

test('fórmulas de combat-core.md (criterios de aceptación)', () => {
  assert.equal(100 * mitigation(100), 50);              // 100 de daño contra 100 de armadura = 50
  assert.ok(Math.abs(ccDuration(2, 0.3) - 1.4) < 1e-9); // aturdimiento de 2 s con 30% de tenacidad = 1,4 s
  assert.equal(xpToNext(1), 280); assert.equal(xpToNext(2), 380);
  assert.ok(mitigation(-20) > 1);                         // resistencia negativa amplifica
  assert.equal(growth(100, 10, 1), 100);
});

test('datos: 15 campeones con Q/W/E/R, 6 clases, 12 objetos', () => {
  assert.equal(CHAMPIONS.length, 15);
  assert.equal(new Set(CHAMPIONS.map(c => c.class)).size, 6);
  for (const c of CHAMPIONS) {
    assert.deepEqual(c.abilities.map(a => a.key), ['Q', 'W', 'E', 'R'], c.id);
    assert.ok(KITS[c.id], `kit de ${c.id}`);
    for (const k of ['Q', 'W', 'E', 'R']) assert.equal(typeof KITS[c.id][k].cast, 'function', `${c.id} ${k}`);
  }
  assert.equal(ITEMS.length, 12);
});

// Las 60 habilidades: cada una se lanza y produce un efecto observable
for (const c of CHAMPIONS) {
  for (const k of ['Q', 'W', 'E', 'R']) {
    test(`habilidad ${c.name} ${k} — ${c.abilities.find(a => a.key === k).name}`, () => {
      const { g, p, e } = arena(c.id, c.id === 'brannoc' ? 'kaelith' : 'brannoc');
      if (k === 'R' && c.id === 'ossuar') { e.x = 7300; }
      // daños previos para que las habilidades condicionales (ejecuciones, curas) tengan efecto
      p.hp = p.st.maxHp * 0.5; e.hp = e.st.maxHp * 0.9;
      if (c.id === 'vaelor' && k === 'E') g.units.find(u => u === e).buffs.push({ key: 'burn', t: 3, stats: {}, pct: {} });
      const before = { ehp: e.hp, php: p.hp, px: p.x, py: p.y, ecc: e.cc.length, pb: p.buffs.length, eb: e.buffs.length,
        z: g.zones.length, pr: g.projectiles.length, units: g.units.length, shield: 0 };
      const ok = g.cmdCast(p, k, { x: e.x, y: e.y, unit: (KITS[c.id][k].t === 'ally') ? p : e });
      assert.ok(ok, `${c.id} ${k} debería lanzarse`);
      assert.ok(p.cds[k] > 0 || p.recast[k] > g.t, 'entra en enfriamiento');
      let effect = false, maxCc = 0;
      for (let i = 0; i < 120 && !effect; i++) {
        g.step();
        maxCc = Math.max(maxCc, e.cc.length);
        effect = e.hp < before.ehp - 1 || maxCc > 0 || p.hp > before.php + 1 || Math.hypot(p.x - before.px, p.y - before.py) > 50 ||
          p.buffs.length > before.pb || e.buffs.length > before.eb || g.zones.length > before.z || g.units.length > before.units || !!p.channel ||
          p.buffs.some(b => b.shield > 0);
      }
      assert.ok(effect, `${c.id} ${k} no produjo ningún efecto observable`);
      for (const u of g.units) assert.ok(Number.isFinite(u.hp) && Number.isFinite(u.x) && Number.isFinite(u.y), 'sin NaN');
    });
  }
}

test('pasivas: Kaelith (3er golpe verdadero), Brannoc (escudo), Lyra (vel. ataque), Gearix (escopeta)', () => {
  let { g, p, e } = arena('kaelith');
  let hits = 0;
  const orig = g.performAttack.bind(g); g.performAttack = (u, t) => { if (u === p) hits++; return orig(u, t); };
  g.cmdAttack(p, e); while (hits < 3) g.step(); steps(g, 0.1);
  const trueHits = g.events.filter(x => x.type === 'dmg' && x.src === p && x.dtype === 'true');
  assert.equal(trueHits.length, 1, 'el tercer golpe añade daño verdadero');
  assert.ok(Math.abs(trueHits[0].amt - 0.04 * e.st.maxHp) < 1, '4% de la vida máxima');
  ({ g, p, e } = arena('brannoc')); p.lastDamaged = -99; p.p.t = 0; steps(g, 0.2);
  assert.ok(p.buffs.some(b => b.key === 'yunque' && b.shield > 0), 'Piel de Yunque da escudo');
  ({ g, p, e } = arena('lyra')); g.cmdAttack(p, e); steps(g, 6);
  assert.ok(hasBuff(p, 'halcon'), 'Ojo de Halcón');
  ({ g, p, e } = arena('gearix')); g.cmdAttack(p, e); steps(g, 8); assert.ok(p.p.n >= 6, 'Cargador cuenta balas');
});

test('pasivas: Zerath gana PH con asesinatos, Ossuar acumula huesos, Elowen revive aliados', () => {
  let { g, p, e } = arena('zerath'); const ap0 = p.st.ap;
  e.hp = 1; dealDamage(g, p, e, 100, 'true'); steps(g, 0.1); assert.ok(p.st.ap >= ap0 + 5, 'Devorar');
  ({ g, p, e } = arena('ossuar')); const m = g.spawnMinion(1, 'mid', 'melee', [p.x + 100, p.y]); dealDamage(g, p, m, 9999, 'true'); steps(g, 0.1);
  assert.equal(p.p.bones, 1);
  ({ g, p, e } = arena('elowen')); g.cmdCast(p, 'R', { x: p.x, y: p.y }); steps(g, 0.6);
  p.hp = 1; dealDamage(g, e, p, 9999, 'true'); assert.ok(p.alive && p.hp > 1, 'Renacer del Bosque revive');
});

test('control de masas: aturdir impide moverse/lanzar; dormir se rompe con daño', () => {
  const { g, p, e } = arena('vaelor');
  applyCC(g, p, 'stun', 1); assert.equal(g.cmdCast(p, 'Q', { x: e.x, y: e.y }), false);
  steps(g, 1.1); assert.ok(g.cmdCast(p, 'Q', { x: e.x, y: e.y }));
  applyCC(g, e, 'sleep', 2); dealDamage(g, p, e, 10, 'true'); assert.ok(!e.cc.some(c => c.kind === 'sleep'));
});

test('tienda: solo en la fuente o muerto; estadísticas y venta al 70%', () => {
  const { g, p } = arena('kaelith'); p.gold = 5000;
  assert.equal(g.buy(p, 'filo_del_ocaso'), false, 'fuera de la fuente no se compra');
  const b = g.base(0); p.x = b.x; p.y = b.y; const ad0 = p.st.ad;
  assert.ok(g.buy(p, 'filo_del_ocaso')); recalcStats(g, p); assert.ok(p.st.ad >= ad0 + 55 - 0.01); assert.equal(p.gold, 2000);
  assert.ok(g.sell(p, 0)); assert.equal(p.gold, 4100);
  p.gold = 100; assert.equal(g.buy(p, 'botas'), false, 'sin oro suficiente');
});

test('hechizos de invocador: Destello, Castigo, Prender, Barrera', () => {
  const { g, p, e } = arena('rakhar'); p.summoners = ['flash', 'smite'];
  const x0 = p.x; assert.ok(g.cmdSummoner(p, 0, { x: p.x - 1000, y: p.y })); assert.ok(Math.abs(p.x - (x0 - 400)) < 2);
  const m = g.spawnMinion(1, 'mid', 'melee', [p.x + 200, p.y]); const hp = m.hp; assert.ok(g.cmdSummoner(p, 1, { unit: m })); assert.ok(m.hp < hp || !m.alive);
  assert.equal(g.cmdSummoner(p, 1, { unit: e }), false, 'Castigo no afecta a campeones');
  p.summoners = ['ignite', 'barrier']; p.sumCd = [0, 0]; e.x = p.x + 300;
  assert.ok(g.cmdSummoner(p, 0, { unit: e })); assert.ok(hasBuff(e, 'prender'));
  assert.ok(g.cmdSummoner(p, 1, {})); assert.ok(p.buffs.some(b => b.shield > 0));
});

test('estructuras: orden de destrucción y anti-backdoor', () => {
  const g = new Game({ mapId: 'grieta_ceniza', allBots: true, seed: 1 });
  const t = lane => g.units.filter(u => u.kind === 'tower' && u.team === 1 && u.lane === lane).sort((a, b) => a.tier - b.tier);
  const [t1, t2] = t('mid'); const nexus = g.nexus1;
  assert.ok(g.isStructureTargetable(t1)); assert.ok(!g.isStructureTargetable(t2)); assert.ok(!g.isStructureTargetable(nexus));
  const hp = t2.hp; dealDamage(g, g.champs[0], t2, 500, 'true'); assert.equal(t2.hp, hp, 'torre interior invulnerable');
  g.kill(t1, null); assert.ok(g.isStructureTargetable(t2));
});

test('visión: un enemigo en un matorral no se ve desde fuera', () => {
  const { g, p, e } = arena('lyra'); const br = g.brushes[0];
  e.x = br.x; e.y = br.y; p.x = br.x + br.r + 300; p.y = br.y; g.updateVision();
  assert.ok(!g.isVisibleTo(0, e)); p.x = br.x + 20; g.updateVision(); assert.ok(g.isVisibleTo(0, e));
  p.x = br.x + br.r + 300; g.cmdWard(p, br.x, br.y); g.updateVision(); assert.ok(g.isVisibleTo(0, e), 'un guardián revela el matorral');
});

test('progresión: experiencia, niveles y definitiva en 6/11/16', () => {
  const g = new Game({ mapId: 'grieta_ceniza', seed: 2 }); const p = g.player;
  assert.equal(p.level, 1); g.addXp(p, 280); assert.equal(p.level, 2);
  assert.equal(g.canRank(p, 'R'), false); while (p.level < 6) g.addXp(p, 1000); assert.ok(g.canRank(p, 'R'));
});

test('ARAM: nivel 3, 1400 de oro, la fuente no cura', () => {
  const g = new Game({ mapId: 'puente_niebla', seed: 5 }); const p = g.player;
  assert.equal(p.level, 3); assert.equal(p.gold, 1400); assert.deepEqual(p.summoners, ['flash', 'snowball']);
  p.hp = 100; steps(g, 2); assert.ok(p.hp < 150, 'la fuente no cura en ARAM');
});

test('Grieta: la fuente cura y dispara a los enemigos', () => {
  const g = new Game({ mapId: 'grieta_ceniza', seed: 5 }); const p = g.player; p.hp = 100; steps(g, 1); assert.ok(p.hp > 100 + 0.05 * p.st.maxHp);
  const b = g.base(1); p.x = b.x; p.y = b.y; steps(g, 1.5); assert.ok(!p.alive || p.hp < p.st.maxHp * 0.5, 'láser de la fuente enemiga');
});

test('Ruinas: capturar altares da puntos y se gana a 500', () => {
  const g = new Game({ mapId: 'ruinas_eclipse', allBots: true, seed: 9 }); g.nextWave = 1e9;
  for (const c of g.champs) { c.isPlayer = true; if (c.team === 1) { c.alive = false; c.respawnAt = 1e9; } }
  const a = g.champs.filter(c => c.team === 0);
  g.altars.forEach((alt, i) => { a[i].x = alt.x; a[i].y = alt.y; });
  steps(g, 7); assert.ok(g.altars.every(x => x.owner === 0));
  steps(g, 430); assert.ok(g.over); assert.equal(g.winner, 0); assert.ok(g.points[0] >= 500);
});

test('objetivos épicos: Dragón da mejora permanente y Señor da mejora temporal', () => {
  const { g, p } = arena('tharok'); g.t = 300;
  const d = g.spawnEpic('dragon'); dealDamage(g, p, d, 1e6, 'true'); assert.equal(g.dragons[0].length, 1);
  const l = g.spawnEpic('lord'); dealDamage(g, p, l, 1e6, 'true'); g.recalcTeamBonus(); assert.ok(g.teamBonus[0].lord); assert.ok(g.teamBonus[0].adFlat >= 40);
});

// ---------------- reglas Wild Rift de la Grieta (maps.md, match-flow.md) ----------------
// partida sin bots ni oleadas: los campeones no piensan, solo corre el reloj de la simulación
function quiet(mapId, seed = 7) {
  const g = new Game({ mapId, allBots: true, seed });
  for (const c of g.champs) c.isPlayer = true;
  g.nextWave = 1e9; g.camps.forEach(c => c.next = 1e9);
  return g;
}
const runTo = (g, t) => { while (g.t < t) g.step(); };

test('Grieta: sin inhibidores; 3 torres por carril y torres de Nexo tras la torre base', () => {
  const g = quiet('grieta_ceniza');
  assert.equal(g.units.filter(u => u.kind === 'inhib').length, 0);
  assert.deepEqual(g.map.inhibs, [[], []]);
  for (const team of [0, 1]) for (const lane of ['top', 'mid', 'bot']) assert.equal(g.units.filter(u => u.kind === 'tower' && u.team === team && u.lane === lane).length, 3, `${lane} ${team}`);
  const tn = g.units.filter(u => u.kind === 'tower' && u.team === 1 && u.tier === 4);
  assert.ok(tn.every(t => !g.isStructureTargetable(t)), 'torres de Nexo protegidas');
  for (const t of g.units.filter(u => u.kind === 'tower' && u.team === 1 && u.lane === 'mid').sort((a, b) => a.tier - b.tier)) g.kill(t, null);
  assert.ok(tn.every(t => g.isStructureTargetable(t)), 'la torre base caída abre las torres de Nexo (sin inhibidor)');
});

test('Grieta: la torre base caída trae súper-súbditos en ese carril (y lo anuncia)', () => {
  const g = quiet('grieta_ceniza');
  const mid = g.units.filter(u => u.kind === 'tower' && u.team === 1 && u.lane === 'mid').sort((a, b) => a.tier - b.tier);
  g.nextWave = 65; runTo(g, 66); // primera oleada normal
  assert.ok(!g.units.some(u => u.kind === 'minion' && u.mtype === 'super'), 'sin súper-súbditos con las torres en pie');
  mid.forEach(t => g.kill(t, null));
  assert.ok(g.events.some(e => e.type === 'announce' && /Torre base destruida/.test(e.txt)), 'anuncio de torre base');
  g.spawnWave(); runTo(g, g.t + 6);
  const sup = g.units.filter(u => u.kind === 'minion' && u.mtype === 'super');
  assert.ok(sup.length >= 1 && sup.every(m => m.team === 0 && m.lane === 'mid'), 'súper-súbdito azul solo en el carril central');
});

test('Grieta: Dragón a las 6:00 y reaparece 4:30 tras morir; valores en game.epicFirst (contrato con render.js)', () => {
  const g = quiet('grieta_ceniza');
  assert.deepEqual(g.epicFirst, { dragon: 360, herald: 360, lord: 660, avatar: 600 }); assert.equal(g.heraldUntil, 660); assert.equal(g.rules.firstWave, 65);
  assert.equal(new Game({ mapId: 'grieta_ceniza', allBots: true, seed: 1 }).nextWave, 65, 'primera oleada a 1:05');
  runTo(g, 359); assert.ok(!g.epic.dragon); runTo(g, 361); assert.ok(g.epic.dragon && g.epic.dragon.alive, 'dragón a los 360 s');
  assert.deepEqual([g.epic.dragon.x, g.epic.dragon.y], [9700, 9700], 'foso del río inferior');
  const k = g.champs[0]; dealDamage(g, k, g.epic.dragon, 1e6, 'true');
  assert.equal(g.epicNext.dragon, g.t + 270); runTo(g, g.epicNext.dragon - 1); assert.ok(!g.epic.dragon); runTo(g, g.epicNext.dragon + 1); assert.ok(g.epic.dragon, 'reaparece a los 270 s');
});

test('Grieta: Heraldo a las 6:00 en el foso del Señor y desaparece cuando sale el Señor a las 11:00', () => {
  const g = quiet('grieta_ceniza');
  runTo(g, 361); const h = g.epic.herald; assert.ok(h && h.alive, 'Heraldo a los 360 s'); assert.deepEqual([h.x, h.y], [4300, 4300]);
  runTo(g, 659); assert.ok(g.epic.herald && g.epic.herald.alive && !g.epic.lord);
  runTo(g, 661); assert.ok(!g.epic.herald && !h.alive, 'el Heraldo se retira'); assert.ok(g.epic.lord && g.epic.lord.alive, 'el Señor lo sustituye a los 660 s');
  assert.deepEqual([g.epic.lord.x, g.epic.lord.y], [4300, 4300]);
});

test('Puente y Ruinas: comportamiento intacto (oleada a 30/65 s, inhibidor del Puente, Avatar a 600 s, sin muros)', () => {
  const p = quiet('puente_niebla'); assert.equal(p.rules.firstWave, 30); assert.equal(new Game({ mapId: 'puente_niebla', allBots: true, seed: 1 }).nextWave, 30); assert.equal(p.units.filter(u => u.kind === 'inhib').length, 2); assert.equal(p.obstacles.length, 0);
  assert.deepEqual(p.epicFirst, { dragon: 300, herald: 480, lord: 1200, avatar: 600 }); assert.equal(p.heraldUntil, 1185);
  p.nextWave = 30; runTo(p, 31); assert.ok(p.units.some(u => u.kind === 'minion'), 'oleada ARAM a los 30 s');
  const r = quiet('ruinas_eclipse'); assert.equal(r.rules.firstWave, 65); assert.equal(new Game({ mapId: 'ruinas_eclipse', allBots: true, seed: 1 }).nextWave, 65); assert.equal(r.obstacles.length, 4, 'solo las 4 rocas'); assert.equal(r.map.walls.length, 0);
  runTo(r, 599); assert.ok(!r.epic.avatar); runTo(r, 601); assert.ok(r.epic.avatar, 'Avatar a los 600 s');
  dealDamage(r, r.champs[0], r.epic.avatar, 1e6, 'true'); assert.equal(r.epicNext.avatar, r.t + 240);
});

test('campamentos: cada monstruo lleva ctype (contrato con render3d)', () => {
  const g = quiet('grieta_ceniza'); g.spawnCamp(g.camps[0]);
  assert.ok(g.camps[0].units.length && g.camps[0].units.every(m => m.ctype === g.camps[0].type));
});

// ---------------- muros y navegación (maps.md §Muros, nav.js) ----------------
test('muros de la Grieta: a ≥ 300 u de carriles, campamentos, estructuras, fuentes y terreno de dragón; huecos ≥ 500 u', () => {
  const g = quiet('grieta_ceniza'); const m = g.map;
  const walls = g.obstacles.filter(o => o.wall); assert.ok(walls.length > 200, `hay ${walls.length} círculos de muro`);
  const pts = [];
  for (const team of [0, 1]) { for (const lane of Object.values(m.lanes[team])) for (const p of lane) pts.push([...p, 'carril']); pts.push([...m.fountain[team], 'fuente']); }
  for (const c of m.camps) pts.push([c[1], c[2], `campamento ${c[0]}`]);
  for (const s of g.structures) pts.push([s.x, s.y, s.name]);
  for (const [x, y] of [[6200, 6200], [7800, 7800], [5300, 7900], [6100, 8700]]) pts.push([x, y, 'terreno de dragón'], [m.W - x, m.H - y, 'terreno de dragón']);
  for (const [x, y, what] of pts) { const d = Math.min(...walls.map(w => Math.hypot(w.x - x, w.y - y))); assert.ok(d >= 300, `${what} (${x}, ${y}) a ${d.toFixed(0)} u de un muro`); }
  // huecos: los círculos de polilíneas distintas están a ≥ 500 u (cada hueco declarado mide ≥ 560 entre extremos)
  for (let i = 0; i < m.walls.length; i++) for (let j = i + 1; j < m.walls.length; j++) {
    const a = wallCircles(m.walls[i], m.wr), b = wallCircles(m.walls[j], m.wr);
    let d = 1e9; for (const p of a) for (const q of b) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1]));
    assert.ok(d >= 500, `muros ${i} y ${j} a ${d.toFixed(0)} u`);
  }
  // simetría: cada muro tiene su reflejo (W−x, H−y)
  const key = c => `${Math.round(c.x)},${Math.round(c.y)}`; const set = new Set(walls.map(key));
  for (const w of walls) assert.ok(set.has(key({ x: m.W - w.x, y: m.H - w.y })), `muro sin reflejo en ${key(w)}`);
});

test('nav.js: hay camino desde la base a cada campamento, a los dos fosos y a la base rival; los muros obligan a rodear', () => {
  const g = quiet('grieta_ceniza'); const [bx, by] = g.map.nexus[0];
  for (const c of g.camps) assert.ok(findPath(g, { x: bx, y: by }, { x: c.x, y: c.y }), `sin camino a ${c.type} (${c.x}, ${c.y})`);
  for (const k of ['dragon', 'lord']) assert.ok(findPath(g, { x: bx, y: by }, { x: g.map.epic[k][0], y: g.map.epic[k][1] }), `sin camino al foso ${k}`);
  assert.ok(findPath(g, { x: bx, y: by }, { x: g.map.nexus[1][0], y: g.map.nexus[1][1] }));
  // de la T2 superior a la T1 central hay un muro en medio: el segmento recto choca y la ruta tiene puntos intermedios
  assert.ok(segmentBlocked(g, 1500, 7500, 5600, 8400), 'el muro bloquea la recta');
  const r = findPath(g, { x: 1500, y: 7500 }, { x: 5600, y: 8400 }); assert.ok(r.length >= 2, `ruta con ${r.length} puntos`);
  assert.deepEqual(r[r.length - 1], [5600, 8400]);
  for (let i = 0; i < r.length; i++) { const [ax, ay] = i ? r[i - 1] : [1500, 7500]; assert.ok(!segmentBlocked(g, ax, ay, r[i][0], r[i][1], 20), `tramo ${i} choca`); }
});

test('cmdMove rodea los muros: un campeón llega de la T2 superior a la T1 central en menos de 25 s', () => {
  const { g, p } = arena('kaelith'); p.x = 1500; p.y = 7500; g.cmdMove(p, 5600, 8400);
  assert.ok(p.route && p.route.length >= 2, 'cmdMove deja la ruta en u.route');
  let t = 0; while (Math.hypot(p.x - 5600, p.y - 8400) > 60 && t < 25) { g.step(); t += TICK; }
  assert.ok(t < 25, `tardó ${t.toFixed(1)} s`);
  // persecución: el objetivo está al otro lado del muro y aun así se le alcanza
  const { g: g2, p: p2, e } = arena('kaelith'); p2.x = 1500; p2.y = 7500; e.x = 5600; e.y = 8400; g2.updateVision(); g2.cmdAttack(p2, e);
  t = 0; while (Math.hypot(p2.x - e.x, p2.y - e.y) > p2.st.range + p2.r + e.r + 1 && t < 30) { g2.step(); t += TICK; }
  assert.ok(t < 30, `persecución: ${t.toFixed(1)} s`);
});

test('bot jungla: completa los 6 campamentos de su lado en menos de 240 s sin atascarse', { timeout: 120000 }, () => {
  const g = new Game({ mapId: 'grieta_ceniza', allBots: true, seed: 4, difficulty: 'normal' });
  g.nextWave = 1e9; g.epicNext = { dragon: 1e9, herald: 1e9, lord: 1e9, avatar: 1e9 };
  const j = g.champs.find(c => c.team === 0 && c.role === 'jungle');
  for (const c of g.champs) if (c !== j) { c.isPlayer = true; if (c.team === 1) { c.alive = false; c.respawnAt = 1e9; } }
  j.level = 18; j.ranks = { Q: 5, W: 5, E: 5, R: 3 }; g.recalcRes(j); recalcStats(g, j); j.hp = j.st.maxHp; j.res = j.resMax || 100;
  runTo(g, 90 + 240);
  const mine = g.camps.filter(c => c.side === 0);
  assert.ok(mine.every(c => (c.clears || 0) >= 1), `campamentos limpiados: ${mine.map(c => `${c.type}=${c.clears || 0}`).join(' ')}`);
});

// Partidas completas entre bots: terminan con ganador y sin valores inválidos
for (const [mapId, maxMin] of [['ruinas_eclipse', 30], ['puente_niebla', 45], ['grieta_ceniza', 60]]) {
  test(`partida completa entre bots: ${mapId}`, { timeout: 300000 }, () => {
    const g = new Game({ mapId, allBots: true, seed: 11, difficulty: 'normal' });
    while (!g.over && g.t < maxMin * 60) {
      g.step();
      if (Math.round(g.t / TICK) % 900 === 0) for (const u of g.units) assert.ok(Number.isFinite(u.hp) && Number.isFinite(u.x), `NaN en ${u.name}`);
    }
    assert.ok(g.over, `${mapId} terminó en ${(g.t / 60).toFixed(1)} min`);
    assert.ok(g.winner === 0 || g.winner === 1);
    const tk = g.kills[0] + g.kills[1]; assert.ok(tk > 0, 'hubo combate');
    console.log(`  ${mapId}: ${(g.t / 60).toFixed(1)} min, ganador ${g.winner ? 'Crepúsculo' : 'Aurora'}, asesinatos ${g.kills.join('-')}, torres ${g.towersDown.join('-')}, puntos ${g.points.join('-')}`);
  });
}
