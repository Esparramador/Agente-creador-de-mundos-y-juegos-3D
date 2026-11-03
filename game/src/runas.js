// Runas (design/gdd/runes-and-item-sets.md). Estructura Wild Rift: 1 clave + rama primaria (3 menores de la
// rama de la clave) + 1 menor secundaria de otra rama. Datos en assets/data/runes.json (vía data.js);
// aquí viven los efectos reales: world.js llama a los ganchos (onDealt, onAttack, onDamaged, onCC, onTakedown, tick).
// Puro (sin DOM): se prueba en Node.
import { RUNES as DATA, ITEM_SETS } from './data.js';
import { TICK, addBuff, getBuff, removeBuff, hasBuff, heal, dealDamage, addShield, applyCC, spawnZone, unitsInRadius, dist } from './core.js';

export const BRANCHES = DATA.branches;
export const RUNES = DATA.runes;
export const RUNE_BY_ID = Object.fromEntries(RUNES.map(r => [r.id, r]));
export const KEYSTONES = RUNES.filter(r => r.slot === 'clave');
export const minorsOf = branch => RUNES.filter(r => r.slot === 'menor' && r.branch === branch);
export const branchOf = id => (RUNE_BY_ID[id] || {}).branch;

/** Comprueba una página {key, minors[3], secondary}. Devuelve { ok, errores[] }. */
export function validarPagina(p) {
  const e = [];
  if (!p || typeof p !== 'object') return { ok: false, errores: ['sin página'] };
  const k = RUNE_BY_ID[p.key];
  if (!k || k.slot !== 'clave') e.push('clave desconocida');
  const minors = Array.isArray(p.minors) ? p.minors : [];
  if (minors.length !== 3) e.push('hacen falta 3 menores de la rama primaria');
  if (new Set(minors).size !== minors.length) e.push('menores repetidas');
  for (const id of minors) { const r = RUNE_BY_ID[id]; if (!r || r.slot !== 'menor') e.push(`menor desconocida: ${id}`); else if (k && r.branch !== k.branch) e.push(`${r.name} no es de la rama ${k.branch}`); }
  const s = RUNE_BY_ID[p.secondary];
  if (!s || s.slot !== 'menor') e.push('secundaria desconocida'); else if (k && s.branch === k.branch) e.push('la secundaria debe ser de otra rama');
  return { ok: !e.length, errores: e };
}
/** Página recomendada para un campeón: la del set destacado (item_sets.json). */
export function paginaRecomendada(champId) {
  const s = ITEM_SETS.find(x => x.champ === champId && x.featured) || ITEM_SETS.find(x => x.champ === champId);
  if (s) return { key: s.runes.key, minors: s.runes.minors.slice(), secondary: s.runes.secondary };
  return { key: 'vencedor', minors: ['brutal', 'triunfo', 'ardor'], secondary: 'placas_de_hueso' };
}
export function normalizarPagina(p, champId) { return validarPagina(p).ok ? { key: p.key, minors: p.minors.slice(), secondary: p.secondary } : paginaRecomendada(champId); }
export const idsDe = p => [p.key, ...p.minors, p.secondary];
const has = (u, id) => !!u.runes && (u.runes.key === id || u.runes.secondary === id || u.runes.minors.includes(id));
const L = u => u.level || 1;
// 1 de fuerza adaptativa = 1 AD o 2 PH; el tipo de daño adaptativo es el de la estadística dominante
const adaptivo = u => (u.st.ap > u.st.adBonus ? 'magic' : 'phys');
const cdOk = (g, u, id, cd) => { const t = (u.p.rcd = u.p.rcd || {})[id] || -1e9; if (g.t - t < cd) return false; u.p.rcd[id] = g.t; return true; };
const champEnemy = (u, t) => t && t.kind === 'champ' && t.team !== u.team;

/** Aplica la página al campeón: u.runes y un buff permanente con las estadísticas planas de las menores. */
export function aplicarRunas(g, u, page) {
  u.runes = normalizarPagina(page, u.cid);
  const stats = {};
  for (const id of idsDe(u.runes)) { const r = RUNE_BY_ID[id]; for (const k in r.stats || {}) stats[k] = (stats[k] || 0) + r.stats[k]; }
  removeBuff(u, 'runas'); addBuff(u, 'runas', 1e9, { stats, runa: true });
  u.p.rcd = {};
  return u.runes;
}

function hits3(g, u, key, win) { const l = (u.p[key] = (u.p[key] || []).filter(t => g.t - t < win)); l.push(g.t); if (l.length >= 3) { u.p[key] = []; return true; } return false; }

/** Daño infligido por u a t (desde core.dealDamage vía kit.onDealt; nunca con noProc). */
export function runasOnDealt(g, u, t, amt, type, o = {}) {
  if (!u.runes || !champEnemy(u, t) || amt <= 0) return;
  const R = u.runes.key;
  if (R === 'tormenta_rapida' && hits3(g, u, 'elec', 3) && cdOk(g, u, R, 20)) dealDamage(g, u, t, 30 + 8 * L(u), adaptivo(u), { noProc: true, runa: R });
  if (R === 'siega_sombria' && t.hp < 0.5 * t.st.maxHp && cdOk(g, u, R, 25)) { u.p.almas = (u.p.almas || 0) + 1; dealDamage(g, u, t, 20 + 5 * L(u) + 5 * u.p.almas, adaptivo(u), { noProc: true, runa: R }); }
  if (R === 'primer_tajo' && !(u.lastHitByChamp && u.lastHitByChamp.id === t.id && g.t - u.lastHitByChamp.t < 3) && cdOk(g, u, R, 25)) { g.giveGold(u, 15, true); addBuff(u, 'primer_tajo', 3, { stats: { dmgOut: 0.07 } }); }
  if (R === 'vencedor') { const b = getBuff(u, 'vencedor'); const n = Math.min(6, (b ? b.n : 0) + 1); const ranged = u.st.range >= 300;
    addBuff(u, 'vencedor', 6, { n, stats: { ad: 2 * n, ap: 4 * n, omnivamp: n === 6 ? (ranged ? 0.05 : 0.09) : 0 } }).t = 6; }
  if (R === 'asedio' && o.attack) { if (u.p.asedioT !== t.id) { u.p.asedioT = t.id; u.p.asedioN = 0; } if (++u.p.asedioN >= 3) { u.p.asedioN = 0; dealDamage(g, u, t, 30 + 6 * L(u), adaptivo(u), { noProc: true, runa: R }); addBuff(t, 'expuesto', 6, { src: u }); } }
  if (R === 'paso_de_fase' && hits3(g, u, 'fase', 4) && cdOk(g, u, R, 15)) addBuff(u, 'paso_de_fase', 3, { pct: { ms: 0.3 }, stats: { ah: 10 } });
  if (R === 'luciernaga' && o.ability && cdOk(g, u, R, 3)) dealDamage(g, u, t, 10 + 3 * L(u), 'magic', { noProc: true, runa: R });
  if (R === 'cometa_de_ceniza' && o.ability && cdOk(g, u, R, 12)) g.after(0.6, () => { if (t.alive && u.alive) dealDamage(g, u, t, 30 + 6 * L(u), 'magic', { noProc: true, runa: R }); });
  if (has(u, 'golpe_barato') && t.cc.length && cdOk(g, u, 'golpe_barato', 4)) dealDamage(g, u, t, 10 + 2 * L(u), 'true', { noProc: true, runa: 'golpe_barato' });
  if (has(u, 'chamuscar') && o.ability && cdOk(g, u, 'chamuscar', 10)) g.after(1, () => { if (t.alive && u.alive) dealDamage(g, u, t, 15 + 2 * L(u), 'magic', { noProc: true, dot: true, runa: 'chamuscar' }); });
}
/** Ataque básico de u sobre t (world.performAttack, antes de resolver el daño): modifica `hit`. */
export function runasOnAttack(g, u, t, hit) {
  if (!u.runes) return; const R = u.runes.key;
  if (R === 'compas_letal' && champEnemy(u, t)) { const b = getBuff(u, 'compas'); const n = Math.min(6, (b ? b.n : 0) + 1); addBuff(u, 'compas', 6, { n, stats: { as: 0.1 * n, range: n === 6 ? 50 : 0 } }).t = 6; }
  if (R === 'pies_de_viento' && cdOk(g, u, R, 2)) hit.after.push(() => { heal(g, u, u, 5 + 1.5 * L(u)); addBuff(u, 'viento', 1, { pct: { ms: 0.2 } }); });
  if (R === 'garra_del_sepulcro' && (u.p.garra || 0) >= 3 && champEnemy(u, t)) {
    u.p.garra = 0; hit.extra.push([0.03 * u.st.maxHp, 'magic']);
    hit.after.push(() => { heal(g, u, u, 0.015 * u.st.maxHp); u.p.garraHp = (u.p.garraHp || 0) + 3; addBuff(u, 'garra_hp', 1e9, { stats: { maxHp: u.p.garraHp } }); });
  }
}
/** Daño recibido por u (core.dealDamage vía kit.onDamaged). */
export function runasOnDamaged(g, u, src, amt) {
  if (!u.runes || !champEnemy(u, src) || amt <= 0) return;
  if (u.runes.key === 'custodio' && cdOk(g, u, 'custodio', 60)) {
    const v = 40 + 10 * L(u); addShield(g, u, u, v, 2, 'custodio');
    const a = unitsInRadius(g, u.team, u.x, u.y, 350, { allies: true, champs: true }).filter(x => x !== u).sort((p, q) => dist(p, u) - dist(q, u))[0];
    if (a) addShield(g, u, a, v, 2, 'custodio');
  }
}
/** u ha inmovilizado (aturdir, enraizar, levantar, dormir, provocar, asustar) a t. */
export function runasOnCC(g, u, t) {
  if (!u.runes || !champEnemy(u, t)) return;
  if (u.runes.key === 'senor_de_la_escarcha' && cdOk(g, u, 'senor_de_la_escarcha', 20)) {
    addBuff(u, 'escarcha', 2.5, { stats: { armor: 30, mr: 30 } });
    spawnZone(g, { x: t.x, y: t.y, r: 250, team: u.team, t: 2, every: 0.25, kind: 'hielo', col: '#80deea', onTick(g2, z) { for (const e of unitsInRadius(g2, u.team, z.x, z.y, z.r)) applyCC(g2, e, 'slow', 0.5, { val: 0.3 }); } });
  }
}
/** u ha participado en la muerte del campeón v. */
export function runasOnTakedown(g, u, v) {
  if (!u.runes) return;
  if (has(u, 'triunfo')) { heal(g, u, u, 0.1 * (u.st.maxHp - u.hp)); g.giveGold(u, 20, true); }
  if (has(u, 'trofeos')) { u.p.trofeos = Math.min(5, (u.p.trofeos || 0) + 1); addBuff(u, 'trofeos', 1e9, { stats: { ad: 2 * u.p.trofeos, ap: 4 * u.p.trofeos } }); }
  if (u.runes.key === 'siega_sombria') { u.p.rcd = u.p.rcd || {}; u.p.rcd.siega_sombria = g.t - 24; }
}
/** Cada tick del campeón (world.updateChampion). */
export function runasTick(g, u) {
  if (!u.runes) return;
  if (u.runes.key === 'garra_del_sepulcro') { if (g.t - (u.lastCombat ?? -99) < 3) { u.p.garraAcc = (u.p.garraAcc || 0) + TICK; if (u.p.garraAcc >= 3) { u.p.garraAcc = 0; u.p.garra = Math.min(3, (u.p.garra || 0) + 1); } } }
  if (has(u, 'segundo_aliento') && u.hp < 0.5 * u.st.maxHp) heal(null, null, u, (4 + 0.5 * L(u)) * TICK);
  if (has(u, 'tormenta_creciente')) { const n = Math.floor(g.t / 300); if (n !== u.p.tormentaN) { u.p.tormentaN = n; addBuff(u, 'tormenta_creciente', 1e9, { stats: { ad: 4 * n, ap: 7 * n } }); } }
}
/** Multiplicador del daño que u inflige a t (core.dealDamage vía kit.dmgMod). */
export function runasDmgMod(g, u, t, amt) {
  if (u.runes && has(u, 'golpe_de_gracia') && champEnemy(u, t) && t.hp < 0.4 * t.st.maxHp) amt *= 1.08;
  return amt;
}
/** Multiplicador del daño que recibe u (Asedio deja al objetivo expuesto). */
export function runasDmgTakenMod(g, u, src, amt) { return hasBuff(u, 'expuesto') && src && src.kind === 'champ' && src.team !== u.team ? amt * 1.08 : amt; }
