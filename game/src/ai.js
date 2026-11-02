// IA de bots (design/gdd/bots-ai.md): capa estratégica (objetivos/agrupación) + táctica (pelea, último golpe, huida).
import { dist, norm, hasCC, mitigation, canCast } from './core.js';

export const DIFF = {
  facil:   { acc: 0.5,  lh: 0.4, skip: 0.45, strat: false, dodge: false, fight: 1.4 },
  normal:  { acc: 0.75, lh: 0.7, skip: 0.15, strat: true,  dodge: false, fight: 1.2 },
  dificil: { acc: 0.9,  lh: 0.9, skip: 0.0,  strat: true,  dodge: true,  fight: 1.05 },
};
export const BUILDS = {
  Tanque:   ['botas', 'coraza_de_hondaforja', 'manto_onirico', 'cinturon_gigante', 'hacha_de_colmillo', 'cinturon_gigante'],
  Luchador: ['botas', 'hacha_de_colmillo', 'coraza_de_hondaforja', 'filo_del_ocaso', 'manto_onirico', 'cinturon_gigante'],
  Mago:     ['botas', 'baculo_de_ceniza', 'orbe_del_vacio', 'manto_onirico', 'tomo_amplificador', 'tomo_amplificador'],
  Tirador:  ['botas', 'arco_de_tormenta', 'filo_del_ocaso', 'espada_larga', 'manto_onirico', 'espada_larga'],
  Asesino:  ['botas', 'hacha_de_colmillo', 'filo_del_ocaso', 'espada_larga', 'coraza_de_hondaforja', 'espada_larga'],
  Soporte:  ['botas', 'incensario_dorado', 'manto_onirico', 'tomo_amplificador', 'coraza_de_hondaforja', 'cinturon_gigante'],
};
const ITEM_COST = { botas: 300, espada_larga: 350, tomo_amplificador: 435, cinturon_gigante: 900, filo_del_ocaso: 3000, arco_de_tormenta: 2900, baculo_de_ceniza: 3100,
  orbe_del_vacio: 2800, coraza_de_hondaforja: 2900, manto_onirico: 2800, hacha_de_colmillo: 3200, incensario_dorado: 2300 };

const power = u => u.hp * (u.st.ad * u.st.as + u.st.ap * 0.6 + 30 + u.level * 12) / 100;

function shop(g, u) {
  const b = BUILDS[u.data.class];
  let guard = 6;
  while (guard-- && u.items.length < 6) {
    const next = b[u.items.length]; if (!next || u.gold < ITEM_COST[next]) break;
    if (!g.buy(u, next)) break;
  }
}
function nextCost(u) { const n = BUILDS[u.data.class][u.items.length]; return n ? ITEM_COST[n] : 1e9; }

function aimAt(g, u, t, D) {
  const lead = Math.min(0.5, dist(u, t) / 1500);
  const err = (1 - D.acc) * 160;
  return { x: t.x + (t.vx || 0) * lead + (g.rand() - 0.5) * 2 * err, y: t.y + (t.vy || 0) * lead + (g.rand() - 0.5) * 2 * err, unit: t };
}

function tryAbilities(g, u, t, ctx, D) {
  if (!canCast(u)) return;
  const d = dist(u, t), tPct = t.hp / t.st.maxHp, my = u.hp / u.st.maxHp;
  for (const k of ['R', 'E', 'Q', 'W']) {
    if (!g.abilityReady(u, k)) continue;
    const ka = u.kit[k], range = (ka.range || 400) + (ka.t === 'self' ? 0 : 60);
    if (u.recast[k] > g.t && ka.recast) { if (t.kind === 'champ' && d < 900) g.cmdCast(u, k, aimAt(g, u, t, D)); continue; }
    let use = false, aim = aimAt(g, u, t, D);
    switch (ka.ai) {
      case 'dmg': case 'cc': use = d <= range + t.r; break;
      case 'engage': use = d <= range + t.r + 50 && (t.kind !== 'champ' || ctx.fight); break;
      case 'ult': use = t.kind === 'champ' && d <= range + t.r && (tPct < 0.65 || ctx.enemiesNear >= 2) && ctx.fight; if (ka.global) use = t.kind === 'champ' && tPct < 0.35 && d < 3000; break;
      case 'execute': use = t.kind === 'champ' && d <= range + t.r && tPct < 0.45; break;
      case 'buff': use = d < 450; break;
      case 'survive': use = my < 0.35 && ctx.enemiesNear > 0; break;
      case 'escape': use = false; break;
      case 'shield': case 'heal': {
        const ally = ctx.allies.filter(a => dist(a, u) < (ka.range || 0) + 50 || a === u).sort((a, b) => a.hp / a.st.maxHp - b.hp / b.st.maxHp)[0];
        if (ally && ally.hp / ally.st.maxHp < (ka.ai === 'heal' ? 0.65 : 0.75) && ctx.enemiesNear) { use = true; aim = { x: ally.x, y: ally.y, unit: ally }; }
        break; }
      case 'heal_ult': use = ctx.allies.filter(a => dist(a, u) < 450 && a.hp / a.st.maxHp < 0.5).length >= 1 && ctx.enemiesNear > 0; break;
    }
    if (ka.t === 'unit' && (t.structure || (ka.champs && t.kind !== 'champ'))) use = false;
    if (t.kind !== 'champ' && (k === 'R' || ka.ai === 'cc' && u.resType === 'mana' && u.res < u.resMax * 0.5)) use = false;
    if (use && g.cmdCast(u, k, aim)) return;
  }
}

function useSummoners(g, u, t, ctx, fleeing) {
  const my = u.hp / u.st.maxHp;
  u.summoners.forEach((s, i) => {
    if (u.sumCd[i] > 0 && !(s === 'smite' && u.smiteCharges > 0)) return;
    if (s === 'heal' && my < 0.3 && ctx.enemiesNear) g.cmdSummoner(u, i, {});
    if (s === 'barrier' && my < 0.25 && ctx.enemiesNear) g.cmdSummoner(u, i, {});
    if (s === 'ignite' && t && t.kind === 'champ' && t.hp / t.st.maxHp < 0.3 && dist(u, t) < 600) g.cmdSummoner(u, i, { unit: t });
    if (s === 'flash' && fleeing && my < 0.15 && ctx.closest && dist(ctx.closest, u) < 450) { const b = g.base(u.team); const [dx, dy] = norm(b.x - u.x, b.y - u.y); g.cmdSummoner(u, i, { x: u.x + dx * 400, y: u.y + dy * 400 }); }
    if (s === 'snowball' && t && t.kind === 'champ' && ctx.fight && dist(u, t) < 1500) g.cmdSummoner(u, i, { x: t.x, y: t.y });
  });
}
function smiteIf(g, u, m) {
  const i = u.summoners.indexOf('smite'); if (i < 0 || u.smiteCharges <= 0) return;
  const dmg = 600 + 35 * (u.level - 1);
  if (m && m.alive && (m.epicType || (m.big && (m.camp.type === 'golem' || m.camp.type === 'bestia')) || u.smiteCharges === 2) && m.hp <= dmg && dist(u, m) < 500 + m.r) g.cmdSummoner(u, i, { unit: m });
}

function lanePath(g, u) {
  const L = g.map.lanes[u.team]; const role = u.role === 'support' ? 'bot' : u.role;
  return L[role] || L.mid || Object.values(L)[0];
}
function progressAlong(path, x, y) { // índice continuo aproximado
  let best = 0, bd = 1e18;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1]; const vx = bx - ax, vy = by - ay; const L = vx * vx + vy * vy;
    const tt = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L)); const px = ax + tt * vx, py = ay + tt * vy;
    const d = (x - px) ** 2 + (y - py) ** 2; if (d < bd) { bd = d; best = i + tt; }
  }
  return best;
}
function pointAt(path, s) { const i = Math.min(path.length - 2, Math.floor(s)), f = s - i; const [ax, ay] = path[i], [bx, by] = path[i + 1]; return [ax + (bx - ax) * f, ay + (by - ay) * f]; }

// punto seguro: la torre aliada más cercana que esté entre el bot y su base, o la base
function safeSpot(g, u) {
  const b = g.base(u.team); const myD = dist(u, b);
  const t = g.units.filter(t => t.alive && t.kind === 'tower' && t.team === u.team && dist(t, b) < myD).sort((a, c) => dist(a, u) - dist(c, u))[0];
  if (t && dist(t, u) > 300) { const [dx, dy] = norm(b.x - t.x, b.y - t.y); return [t.x + dx * 250, t.y + dy * 250]; }
  return [b.x, b.y];
}
function underEnemyTower(g, u, x = u.x, y = u.y) {
  return g.units.find(t => t.alive && t.kind === 'tower' && t.team !== u.team && Math.hypot(t.x - x, t.y - y) < 800);
}

export function botThink(g, u) {
  const D = DIFF[g.difficulty] || DIFF.normal;
  if (!u.alive) { shop(g, u); return; }
  if (g.inFountain(u)) shop(g, u);
  if (u.channel && !u.channel.recall) return;
  if (g.rand() < D.skip) return;
  const vis = e => g.isVisibleTo(u.team, e);
  const enemies = g.champs.filter(e => e.alive && e.team !== u.team && vis(e) && !e.untargetable && dist(u, e) < 1400);
  const allies = g.champs.filter(a => a.alive && a.team === u.team && dist(u, a) < 1400);
  const my = u.hp / u.st.maxHp;
  const near = enemies.filter(e => dist(u, e) < 900);
  const closest = enemies.sort((a, b) => dist(u, a) - dist(u, b))[0];
  const ctx = { enemiesNear: near.length, allies, closest, fight: false };
  const base = g.base(u.team);
  if (u.channel && u.channel.recall) { if (near.length) u.channel = null; else return; }

  // 1) huir
  if ((my < 0.25 && near.length) || (my < 0.12 && !g.inFountain(u))) {
    useSummoners(g, u, closest, ctx, true);
    for (const k of ['E', 'W', 'R', 'Q']) { const ka = u.kit[k]; if ((ka.ai === 'escape' || ka.ai === 'survive') && g.abilityReady(u, k)) { const [dx, dy] = norm(base.x - u.x, base.y - u.y); if (g.cmdCast(u, k, { x: u.x + dx * 400, y: u.y + dy * 400, unit: u })) break; } }
    if (!near.length && my < 0.3 && !g.rules.aram && dist(u, base) > 2500) { g.cmdRecall(u); return; }
    u.state = 'huir'; { const [sx, sy] = my < 0.15 || dist(u, base) < 4000 ? [base.x, base.y] : safeSpot(g, u); g.cmdMove(u, sx, sy); } return;
  }
  const threats = g.units.some(m => m.alive && m.team !== u.team && m.team !== 2 && (m.kind === 'minion' || m.kind === 'tower') && dist(m, u) < 950);
  if (my < 0.3 && threats && !g.inFountain(u)) { u.state = 'retirada'; const [sx, sy] = safeSpot(g, u); g.cmdMove(u, sx, sy); return; }
  // 2) volver a base
  if (!g.rules.aram && !near.length && !threats && dist(u, base) > 3000 && (my < 0.35 || u.gold >= nextCost(u) + 150 && g.t > 200 || (u.resType === 'mana' && u.res < 0.15 * u.resMax))) { u.state = 'base'; g.cmdRecall(u); return; }
  if (g.inFountain(u) && g.rules.fountainHeal !== false && (my < 0.9 || (u.resType === 'mana' && u.res < 0.8 * u.resMax)) && !near.length) { u.state = 'curar'; g.cmdStop(u); return; }

  // 3) pelea
  let target = null;
  if (enemies.length) {
    target = enemies.slice().sort((a, b) => (a.hp / a.st.maxHp) * dist(u, a) - (b.hp / b.st.maxHp) * dist(u, b))[0];
    const allyPow = allies.reduce((s, a) => s + power(a), 0) * (1 + 0.15 * g.units.filter(m => m.alive && m.kind === 'minion' && m.team === u.team && dist(m, u) < 700).length / 6);
    const enemyPow = g.champs.filter(e => e.alive && e.team !== u.team && vis(e) && dist(target, e) < 1200).reduce((s, e) => s + power(e), 0) || 1;
    const towerRisk = underEnemyTower(g, u, target.x, target.y);
    const ratio = allyPow / enemyPow;
    ctx.fight = ratio > D.fight || (target.hp / target.st.maxHp < 0.25 && my > 0.4);
    if (towerRisk && (my < 0.5 || target.hp / target.st.maxHp > 0.2) && !g.units.some(m => m.alive && m.kind === 'minion' && m.team === u.team && dist(m, towerRisk) < 750)) ctx.fight = false;
    if (ctx.fight && dist(u, target) < 1100) {
      u.state = 'pelea'; useSummoners(g, u, target, ctx, false); tryAbilities(g, u, target, ctx, D); g.cmdAttack(u, target); return;
    }
    if (near.length && ratio < 0.8) { u.state = 'retirada'; const [sx, sy] = safeSpot(g, u); g.cmdMove(u, sx, sy); tryAbilities(g, u, closest, ctx, D); return; }
    // hostigamiento con habilidades desde lejos
    if (dist(u, target) < 950 && my > 0.5) tryAbilities(g, u, target, ctx, D);
  }
  // ayudar a aliados con escudos/curas aunque no pelee
  if (allies.some(a => a.hp / a.st.maxHp < 0.6) && closest) tryAbilities(g, u, closest, ctx, D);

  // 4) estrategia
  const goal = D.strat ? strategicGoal(g, u, D) : null;
  if (goal) { u.state = goal.kind; return actOn(g, u, goal, ctx, D); }
  u.state = g.rules.dominion ? 'altar' : u.role === 'jungle' ? 'jungla' : 'carril';
  if (g.rules.dominion) return dominion(g, u, ctx, D);
  if (u.role === 'jungle') return jungle(g, u, ctx, D);
  return lane(g, u, ctx, D);
}

function strategicGoal(g, u, D) {
  const team = u.team, aliveA = g.champs.filter(c => c.alive && c.team === team).length, aliveE = g.champs.filter(c => c.alive && c.team !== team).length;
  for (const k of ['lord', 'dragon', 'herald', 'avatar']) {
    const m = g.epic[k]; if (!m || !m.alive) continue;
    const d = dist(u, m);
    const join = u.role === 'jungle' && d < 6000 || d < 3500 || (k === 'lord' && aliveA > aliveE) || (g.difficulty === 'dificil' && aliveA >= aliveE);
    if (join && aliveA >= aliveE && (k !== 'lord' || aliveA - aliveE >= 1 || g.minutes() > 30)) {
      const helpers = g.champs.filter(c => c.alive && c.team === team && dist(c, m) < 1500).length;
      const need = k === 'lord' ? 4 : k === 'dragon' ? (u.level >= 9 ? 2 : 3) : 2;
      if (helpers < need) { if (d > 1600) return { kind: 'gather', x: m.x, y: m.y }; continue; }
      return { kind: 'epic', unit: m };
    }
  }
  // defender torres
  const hurt = g.units.find(t => t.alive && t.kind === 'tower' && t.team === team && t.hp < t.st.maxHp * 0.7 && g.champs.some(e => e.alive && e.team !== team && dist(e, t) < 1000) && dist(u, t) < 5000);
  if (hurt && u.role !== 'jungle') return { kind: 'gather', x: hurt.x, y: hurt.y };
  // asedio en grupo al final
  if (!g.rules.dominion && (g.minutes() > (g.rules.siegeMinute || 25) || (g.minutes() > 16 && g.towersDown[team] - g.towersDown[1 - team] >= 3))) {
    const lanes = g.map.lanes[team]; const path = lanes.mid || Object.values(lanes)[0];
    return { kind: 'push', path };
  }
  return null;
}

function actOn(g, u, goal, ctx, D) {
  if (goal.kind === 'epic') {
    const m = goal.unit; smiteIf(g, u, m);
    if (dist(u, m) < 900) tryAbilities(g, u, m, ctx, D);
    g.cmdAttack(u, m); return;
  }
  if (goal.kind === 'gather') { g.cmdMove(u, goal.x + (g.rand() - 0.5) * 300, goal.y + (g.rand() - 0.5) * 300); return; }
  if (goal.kind === 'push') return lane(g, u, ctx, D, goal.path, true);
}

function lane(g, u, ctx, D, pathOverride, pushHard) {
  const path = pathOverride || lanePath(g, u);
  if (u.role === 'support' && !pathOverride) {
    const adc = g.champs.find(c => c.alive && c.team === u.team && c.role === 'bot');
    if (adc && dist(adc, g.base(u.team)) > 2500) { g.cmdMove(u, adc.x + (u.team ? 150 : -150), adc.y + (u.team ? -150 : 150)); maybeWard(g, u); return; }
  }
  const myS = progressAlong(path, u.x, u.y);
  const allyMinions = g.units.filter(m => m.alive && m.kind === 'minion' && m.team === u.team && m.path === path || (m.alive && m.kind === 'minion' && m.team === u.team && m.lane === (u.role === 'support' ? 'bot' : u.role) && !pathOverride));
  const enemyMin = g.units.filter(m => m.alive && (m.kind === 'minion' || m.kind === 'pet') && m.team !== u.team && dist(m, u) < 900 && g.isVisibleTo(u.team, m));
  // último golpe
  const myDmg = u.st.ad;
  const incoming = m => g.units.reduce((s, a) => s + (a.alive && a.target === m && a !== u ? a.st.ad * (a.kind === 'tower' ? 3 : 1) : 0), 0);
  const delay = 0.25 / u.st.as + (u.st.range > 300 ? dist(u, enemyMin[0] || u) / 2000 : 0) + 0.15;
  const lh = enemyMin.filter(m => m.hp - incoming(m) * delay * 0.8 <= myDmg * mitigation(m.st.armor)).sort((a, b) => a.hp - b.hp)[0];
  if (lh && g.rand() < D.lh + 0.2) { g.cmdAttack(u, lh); return; }
  // torre enemiga tanqueada por súbditos
  const tw = g.units.find(t => t.alive && t.structure && t.team !== u.team && g.isStructureTargetable(t) && dist(t, u) < 1000);
  if (tw) {
    const tank = g.units.some(m => m.alive && m.kind === 'minion' && m.team === u.team && dist(m, tw) < 750);
    const targetingMe = tw.target === u;
    if ((tank || pushHard && tank) && !targetingMe && (tw.kind !== 'tower' || tw.target)) { if (enemyMin.length && !pushHard && g.rand() < 0.5) { g.cmdAttack(u, enemyMin[0]); return; } g.cmdAttack(u, tw); return; }
    if (tw.kind === 'tower' && (targetingMe || !tank) && dist(u, tw) < 850) { const [dx, dy] = norm(u.x - tw.x, u.y - tw.y); g.cmdMove(u, u.x + dx * 350, u.y + dy * 350); return; }
  }
  if (enemyMin.length && (pushHard || allyMinions.length || g.rand() < 0.3)) {
    const t = enemyMin.sort((a, b) => a.hp - b.hp)[0];
    if (!underEnemyTower(g, u, t.x, t.y) || allyMinions.some(m => dist(m, t) < 500)) { g.cmdAttack(u, t); return; }
  }
  // posición: justo detrás del súbdito aliado más adelantado, o junto a la torre propia
  let frontM = null, front = -1;
  for (const m of allyMinions) { const p = progressAlong(path, m.x, m.y); if (p > front) { front = p; frontM = m; } }
  let x, y;
  if (frontM) {
    const prev = path[Math.max(0, (frontM.wp || 1) - 1)]; const [dx, dy] = norm(prev[0] - frontM.x, prev[1] - frontM.y);
    const back = u.st.range > 300 ? 380 : 170; x = frontM.x + dx * back; y = frontM.y + dy * back;
  } else {
    const b = g.base(u.team); const myTowers = g.units.filter(t => t.alive && t.kind === 'tower' && t.team === u.team && t.lane === (u.role === 'support' ? 'bot' : u.role));
    const t = myTowers.sort((a, c) => dist(c, b) - dist(a, b))[0] || { x: b.x, y: b.y };
    const [dx, dy] = norm(b.x - t.x, b.y - t.y); x = t.x + dx * 300; y = t.y + dy * 300;
  }
  if (Math.hypot(x - u.x, y - u.y) > 120) g.cmdMove(u, x + (g.rand() - 0.5) * 100, y + (g.rand() - 0.5) * 100);
  maybeWard(g, u);
}
function maybeWard(g, u) {
  if (u.wardCharges > 0 && (u.role === 'support' || g.rand() < 0.02) && g.t > 90) {
    const spots = g.brushes.filter(b => Math.hypot(b.x - u.x, b.y - u.y) < 600);
    if (spots.length && !g.units.some(w => w.kind === 'ward' && w.team === u.team && Math.hypot(w.x - spots[0].x, w.y - spots[0].y) < 300)) g.cmdWard(u, spots[0].x, spots[0].y);
  }
}
function jungle(g, u, ctx, D) {
  // emboscada: enemigo débil cerca de un carril
  if (u.level >= 3) {
    const prey = g.champs.find(e => e.alive && e.team !== u.team && g.isVisibleTo(u.team, e) && e.hp / e.st.maxHp < 0.5 && dist(u, e) < 3000 && !underEnemyTower(g, u, e.x, e.y));
    if (prey) { g.cmdMove(u, prey.x, prey.y); return; }
  }
  const camps = g.camps.filter(c => c.units.some(m => m.alive)).sort((a, b) => (dist(u, a) + (a.side !== u.team ? 2500 : 0)) - (dist(u, b) + (b.side !== u.team ? 2500 : 0)));
  const c = camps[0];
  if (!c) return lane(g, u, ctx, D, g.map.lanes[u.team].mid);
  const m = c.units.filter(x => x.alive).sort((a, b) => (b.big - a.big) || a.hp - b.hp)[0];
  smiteIf(g, u, m);
  if (dist(u, m) < 700) tryAbilities(g, u, m, ctx, D);
  g.cmdAttack(u, m);
}
function dominion(g, u, ctx, D) {
  const alts = g.altars.slice().sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
  const idx = { top: 0, jungle: 1, bot: 2 }[u.role] ?? 1;
  const mine = u.team === 0 ? g.altars[[0, 1, 2][idx]] : g.altars[[2, 1, 0][idx]];
  const want = mine.owner !== u.team ? mine : alts.find(a => a.owner !== u.team);
  if (want) { if (Math.hypot(want.x - u.x, want.y - u.y) > 150) g.cmdMove(u, want.x + (g.rand() - 0.5) * 150, want.y + (g.rand() - 0.5) * 150); else g.cmdStop(u); return; }
  return u.role === 'jungle' ? jungle(g, u, ctx, D) : lane(g, u, ctx, D, null, g.minutes() > 8);
}
