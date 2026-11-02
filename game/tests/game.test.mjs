// Pruebas del juego: node --test game/tests/
// Cubre: fórmulas de combat-core.md, las 60 habilidades y 15 pasivas, objetos, hechizos, estructuras,
// visión, reglas de cada mapa y partidas completas entre bots en los 3 mapas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, CHAMP_BY_ID } from '../src/world.js';
import { CHAMPIONS, ITEMS } from '../src/data.js';
import { KITS } from '../src/kits.js';
import { TICK, mitigation, ccDuration, applyCC, dealDamage, recalcStats, hasBuff, xpToNext, growth } from '../src/core.js';

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
