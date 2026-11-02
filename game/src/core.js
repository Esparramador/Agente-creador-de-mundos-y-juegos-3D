// Núcleo de combate: estadísticas, daño, control de masas, buffs, proyectiles y zonas.
// Implementa design/gdd/combat-core.md. Sin dependencias de navegador (se prueba en Node).

export const TICK = 1 / 30;
export const AURORA = 0, CREPUSCULO = 1, NEUTRAL = 2;
export const TEAM_NAMES = ['Aurora', 'Crepúsculo', 'Neutral'];

// ---------- utilidades ----------
export const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const dist = (a, b) => Math.sqrt(dist2(a, b));
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function norm(dx, dy) { const l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// distancia de un punto a un segmento
export function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const t = clamp((wx * vx + wy * vy) / (vx * vx + vy * vy || 1), 0, 1);
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

// ---------- fórmulas (combat-core.md §Formulas) ----------
export const growth = (base, g, lvl) => base + g * (lvl - 1) * (0.7025 + 0.0175 * (lvl - 1));
export function mitigation(resist) { return resist >= 0 ? 100 / (100 + resist) : 2 - 100 / (100 - resist); }
export const effectiveCd = (cd, ah) => cd * 100 / (100 + ah);
export const ccDuration = (d, tenacity) => d * (1 - clamp(tenacity, 0, 0.9));
export const xpToNext = lvl => 280 + 100 * (lvl - 1); // de nivel lvl a lvl+1
export const respawnTime = (lvl, minutes) => Math.min(50, 6 + 2.5 * lvl) + (minutes > 30 ? 0.15 * (minutes - 30) * 60 / 60 : 0);

// ---------- buffs y estadísticas ----------
// buff = { key, t, stats:{flat}, pct:{mult}, tags:Set-like obj, src, onTick(g,u,b), onEnd(g,u,b) }
export function addBuff(u, key, t, opts = {}) {
  let b = u.buffs.find(x => x.key === key);
  if (b && !opts.stack) { b.t = Math.max(b.t, t); Object.assign(b, opts); return b; }
  b = { key, t, stats: {}, pct: {}, ...opts }; u.buffs.push(b); return b;
}
export const hasBuff = (u, key) => u.buffs.some(b => b.key === key);
export const getBuff = (u, key) => u.buffs.find(b => b.key === key);
export const removeBuff = (u, key) => { u.buffs = u.buffs.filter(b => b.key !== key); };

const STAT_KEYS = ['maxHp', 'ad', 'ap', 'armor', 'mr', 'as', 'ms', 'range', 'ah', 'crit', 'critDmg', 'ls', 'mpen', 'arpen', 'tenacity', 'dmgReduct', 'healPower', 'regen', 'dmgOut'];

export function recalcStats(g, u) {
  const s = {};
  for (const k of STAT_KEYS) s[k] = 0;
  const b = u.base, L = u.level || 1;
  if (u.kind === 'champ') {
    s.maxHp = growth(b.hp, b.hp_g, L); s.ad = growth(b.ad, b.ad_g, L);
    s.armor = growth(b.armor, b.armor_g, L); s.mr = growth(b.mr, b.mr_g, L);
    s.ms = b.ms; s.range = b.range; s.critDmg = 0.75; s.regen = 1.2 + 0.12 * L;
    s.as = b.attack_speed; var asBonus = b.attack_speed_growth_pct / 100 * (L - 1);
    s.baseAd = s.ad;
  } else {
    Object.assign(s, b); s.baseAd = s.ad; var asBonus = 0;
  }
  // objetos
  for (const it of u.items || []) {
    const st = it.stats;
    s.ad += st.ad || 0; s.ap += st.ap || 0; s.maxHp += st.hp || 0; s.armor += st.armor || 0; s.mr += st.mr || 0;
    asBonus += st.as || 0; s.ms += st.ms || 0; s.crit += st.crit || 0; s.ah += st.ah || 0; s.mpen += st.mpen || 0;
    s.healPower += st.heal_power || 0;
    if (it.id === 'filo_del_ocaso') s.critDmg += 0.35;
  }
  let pct = { ms: 0, ad: 0, ap: 0, armor: 0, mr: 0, maxHp: 0 };
  for (const bf of u.buffs) {
    for (const k in bf.stats) { if (k === 'as') asBonus += bf.stats[k]; else s[k] = (s[k] || 0) + bf.stats[k]; }
    for (const k in bf.pct) pct[k] = (pct[k] || 0) + bf.pct[k];
  }
  // mejoras de equipo (dragones, Señor, sinergia de facción)
  const tb = g && g.teamBonus ? g.teamBonus[u.team] : null;
  if (tb && u.kind === 'champ') {
    pct.ad += tb.adPct || 0; pct.ap += tb.apPct || 0; pct.armor += tb.armorPct || 0; pct.mr += tb.armorPct || 0;
    s.ad += tb.adFlat || 0; s.ap += tb.apFlat || 0; s.ah += tb.ah || 0; s.ms += tb.ms || 0;
    if (tb.ahPct) s.ah += 100 * tb.ahPct;
  }
  if ((u.items || []).some(i => i.id === 'baculo_de_ceniza')) pct.ap += 0.3;
  for (const k of ['ad', 'ap', 'armor', 'mr', 'maxHp']) s[k] *= 1 + (pct[k] || 0);
  s.as = Math.min(2.5, s.as * (1 + asBonus));
  // ralentizaciones: sólo la mayor
  let slow = 0; for (const c of u.cc) if (c.kind === 'slow') slow = Math.max(slow, c.val);
  s.ms = Math.max(110, s.ms * (1 + (pct.ms || 0)) * (1 - slow));
  s.adBonus = s.ad - s.baseAd;
  const prevMax = u.st ? u.st.maxHp : s.maxHp;
  u.st = s;
  if (prevMax && s.maxHp !== prevMax && u.hp > 0) u.hp = Math.min(s.maxHp, u.hp * s.maxHp / prevMax);
  return s;
}

// ---------- control de masas ----------
export const CC_NO_TENACITY = new Set(['airborne']);
export function applyCC(g, tgt, kind, dur, opts = {}) {
  if (!tgt.alive || tgt.kind === 'tower' || tgt.kind === 'inhib' || tgt.kind === 'nexus') return 0;
  if (tgt.untargetable || hasBuff(tgt, 'spellshield_used')) return 0;
  if (tgt.unstoppable && kind !== 'slow') return 0;
  const d = CC_NO_TENACITY.has(kind) ? dur : ccDuration(dur, tgt.st.tenacity);
  const ex = tgt.cc.find(c => c.kind === kind);
  if (ex) { ex.t = Math.max(ex.t, d); if (opts.val) ex.val = Math.max(ex.val || 0, opts.val); Object.assign(ex, { ...opts, val: ex.val }); }
  else tgt.cc.push({ kind, t: d, ...opts });
  if (kind !== 'slow') { tgt.channel = null; if (tgt.dash && kind === 'airborne' && !opts.keepDash) tgt.dash = null; }
  if (g && kind !== 'slow') g.emit('cc', { tgt, kind, d });
  return d;
}
export const hasCC = (u, kind) => u.cc.some(c => c.kind === kind);
export const isHardCC = u => u.cc.some(c => ['stun', 'airborne', 'sleep', 'taunt', 'fear', 'suppress'].includes(c.kind));
export const canMove = u => u.alive && !u.cc.some(c => ['stun', 'root', 'airborne', 'sleep'].includes(c.kind)) && !u.channel;
export const canAct = u => u.alive && !u.dash && !u.cc.some(c => ['stun', 'airborne', 'sleep', 'taunt', 'fear'].includes(c.kind));
export const canCast = u => canAct(u) && !hasCC(u, 'silence') && !u.channel;
export const canAttack = u => canAct(u) && !u.channel;

// ---------- escudos y curación ----------
export function addShield(g, src, tgt, amount, t, key = 'shield') {
  amount *= 1 + ((src && src.st && src.st.healPower) || 0);
  const b = addBuff(tgt, key, t, { shield: amount, stack: true });
  b.shield = amount;
  if (src && src !== tgt && src.kind === 'champ') onAllyHelp(g, src, tgt);
  return amount;
}
export function heal(g, src, tgt, amount) {
  if (!tgt.alive) return 0;
  amount *= 1 + ((src && src.st && src.st.healPower) || 0);
  if (hasBuff(tgt, 'grievous')) amount *= 0.6;
  const before = tgt.hp; tgt.hp = Math.min(tgt.st.maxHp, tgt.hp + amount);
  if (g && amount > 5) g.emit('heal', { tgt, amount: tgt.hp - before });
  if (src && src !== tgt && src.kind === 'champ') onAllyHelp(g, src, tgt);
  return tgt.hp - before;
}
function onAllyHelp(g, src, tgt) {
  if ((src.items || []).some(i => i.id === 'incensario_dorado')) addBuff(tgt, 'incensario', 4, { stats: { as: 0.25 } });
}

// ---------- daño ----------
// type: 'phys' | 'magic' | 'true'. opts: { ability:bool, attack:bool, noProc, crit }
export function dealDamage(g, src, tgt, raw, type, opts = {}) {
  if (!tgt || !tgt.alive || raw <= 0) return 0;
  if (tgt.untargetable || tgt.invulnerable) return 0;
  if (tgt.structure && !g.isStructureTargetable(tgt)) return 0;
  // escudo de hechizos (Kaelith W)
  if (src && src.kind === 'champ' && hasBuff(tgt, 'spellshield') && src.team !== tgt.team) {
    removeBuff(tgt, 'spellshield'); g.emit('text', { x: tgt.x, y: tgt.y, txt: 'Bloqueado', col: '#ffd54a' }); return 0;
  }
  let amt = raw * (1 + ((src && src.st && src.st.dmgOut) || 0));
  if (src && src.kind === 'champ' && src.kit && src.kit.dmgMod) amt = src.kit.dmgMod(g, src, tgt, amt, type, opts);
  if (src && src.team != null && g.teamBonus && tgt.structure) amt *= 1 + (g.teamBonus[src.team].structDmg || 0);
  if (type !== 'true') {
    let res = type === 'phys' ? tgt.st.armor : tgt.st.mr;
    if (res > 0 && src && src.st) res *= 1 - (type === 'phys' ? src.st.arpen : src.st.mpen);
    amt *= mitigation(res);
  }
  amt *= 1 - clamp(tgt.st.dmgReduct || 0, 0, 0.9);
  if (tgt.kit && tgt.kit.dmgTakenMod) amt = tgt.kit.dmgTakenMod(g, tgt, src, amt, type, opts);
  // escudos
  let left = amt;
  for (const b of tgt.buffs) if (b.shield > 0 && left > 0) { const a = Math.min(b.shield, left); b.shield -= a; left -= a; if (b.shield <= 0) b.t = 0; }
  // vida mínima (R de Tharok)
  let minHp = 0; for (const b of tgt.buffs) if (b.undying) minHp = 1;
  const before = tgt.hp;
  tgt.hp = Math.max(minHp && !(src && src.structure && src.isNexusTower) ? minHp : 0, tgt.hp - left);
  const dealt = before - tgt.hp + (amt - left);
  tgt.lastDamaged = g.t;
  if (dealt > 0 && tgt.cc.length) tgt.cc = tgt.cc.filter(c => c.kind !== 'sleep');
  if (src) {
    if (src.kind === 'champ') { tgt.dmgBy[src.id] = g.t; src.stats.dmg += dealt; if (tgt.kind === 'champ') src.stats.champDmg += dealt; src.lastCombat = g.t; }
    if (tgt.kind === 'champ') tgt.lastCombat = g.t;
    if (src.st && src.st.ls && opts.attack) heal(g, src, src, dealt * src.st.ls);
    if (tgt.kit && tgt.kit.onDamaged) tgt.kit.onDamaged(g, tgt, src, dealt, type, opts);
    if (src.kit && src.kit.onDealt && !opts.noProc) src.kit.onDealt(g, src, tgt, dealt, type, opts);
    // furia
    if (src.resType === 'fury') src.res = Math.min(100, src.res + (opts.attack ? 6 : 3));
    if (tgt.resType === 'fury') tgt.res = Math.min(100, tgt.res + 2);
    if (tgt.kind === 'champ' && src.kind === 'champ' && src.team !== tgt.team) {
      tgt.lastHitByChamp = { id: src.id, t: g.t };
      src.aggroChamp = { t: g.t, victim: tgt };
    }
    if (opts.attack && (tgt.items || []).some(i => i.id === 'coraza_de_hondaforja') && src.alive && src.kind !== 'tower')
      dealDamage(g, tgt, src, dealt * 0.25, 'magic', { noProc: true });
    if (tgt.attackedBy) tgt.attackedBy = src;
  }
  if (tgt.kind === 'monster' && src) { tgt.aggro = src; }
  g.emit('dmg', { src, tgt, amt: dealt, dtype: type, crit: opts.crit, dot: opts.dot });
  if (tgt.hp <= 0) g.kill(tgt, src);
  return dealt;
}

// ---------- proyectiles, zonas y desplazamientos ----------
export function enemiesOf(g, team) { return g.units.filter(u => u.alive && u.team !== team && !u.untargetable && u.kind !== 'ward'); }
export function unitsInRadius(g, team, x, y, r, f = {}) {
  return g.units.filter(u => u.alive && !u.untargetable && u.kind !== 'ward' && u.kind !== 'turret_obj' &&
    (f.allies ? u.team === team : u.team !== team) && (!f.champs || u.kind === 'champ') &&
    (f.structures || !u.structure) && Math.hypot(u.x - x, u.y - y) <= r + u.r);
}
export function unitsInLine(g, team, ax, ay, bx, by, w, f = {}) {
  return g.units.filter(u => u.alive && !u.untargetable && u.team !== team && !u.structure && u.kind !== 'ward' &&
    (!f.champs || u.kind === 'champ') && segDist(u.x, u.y, ax, ay, bx, by) <= w / 2 + u.r);
}
export function unitsInCone(g, team, x, y, dx, dy, range, halfAngle) {
  const c = Math.cos(halfAngle);
  return g.units.filter(u => {
    if (!u.alive || u.untargetable || u.team === team || u.structure || u.kind === 'ward') return false;
    const vx = u.x - x, vy = u.y - y, l = Math.hypot(vx, vy);
    return l <= range + u.r && (l < 1 || (vx * dx + vy * dy) / l >= c);
  });
}

// proyectil: {x,y,dx,dy,speed,range,w,team,src,pierce,champs,onHit,homing,target,color}
export function spawnProjectile(g, p) {
  p.traveled = 0; p.hit = new Set(); p.alive = true; p.w = p.w || 70; p.color = p.color || '#fff';
  g.projectiles.push(p); return p;
}
export function updateProjectile(g, p) {
  let step = p.speed * TICK;
  if (p.homing) {
    if (!p.target || !p.target.alive) { p.alive = false; return; }
    const [dx, dy] = norm(p.target.x - p.x, p.target.y - p.y); p.dx = dx; p.dy = dy;
    if (Math.hypot(p.target.x - p.x, p.target.y - p.y) <= step + p.target.r) { p.alive = false; p.onHit(g, p.target, p); return; }
    p.x += dx * step; p.y += dy * step; return;
  }
  const ox = p.x, oy = p.y; p.x += p.dx * step; p.y += p.dy * step; p.traveled += step;
  const hits = g.units.filter(u => u.alive && !u.untargetable && u.team !== p.team && !u.structure && u.kind !== 'ward' &&
    !p.hit.has(u.id) && (!p.champs || u.kind === 'champ') && u.kind !== 'turret_obj' &&
    segDist(u.x, u.y, ox, oy, p.x, p.y) <= p.w / 2 + u.r)
    .sort((a, b) => dist2(a, { x: ox, y: oy }) - dist2(b, { x: ox, y: oy }));
  for (const u of hits) {
    p.hit.add(u.id); p.onHit(g, u, p);
    if (!p.pierce) { p.alive = false; return; }
  }
  if (p.traveled >= p.range) { p.alive = false; if (p.onEnd) p.onEnd(g, p); }
}

// zona: {x,y,r,team,t,delay,every,onTick(g,z),onTrigger(g,z),onEnd,color,kind}
export function spawnZone(g, z) { z.age = 0; z.acc = 0; z.alive = true; z.triggered = false; g.zones.push(z); return z; }
export function updateZone(g, z) {
  z.age += TICK;
  if (z.delay && !z.triggered && z.age >= z.delay) { z.triggered = true; z.onTrigger && z.onTrigger(g, z); }
  if (!z.delay || z.triggered) {
    if (z.every) { z.acc += TICK; while (z.acc >= z.every) { z.acc -= z.every; z.onTick && z.onTick(g, z); } }
  }
  if (z.age >= (z.delay || 0) + (z.t || 0)) { z.alive = false; z.onEnd && z.onEnd(g, z); }
}

// desplazamiento: velocidad en u/s
export function dashTo(g, u, x, y, speed, opts = {}) {
  const [cx, cy] = g.clampToMap(x, y);
  u.dash = { tx: cx, ty: cy, speed, onEnd: opts.onEnd, onPass: opts.onPass, hit: new Set(), w: opts.w || 120, unstoppable: opts.unstoppable };
  u.moveTo = null;
}
export function knockTo(g, u, x, y, speed, dur) {
  if (u.structure || u.unstoppable) return;
  applyCC(g, u, 'airborne', dur, { keepDash: true });
  const [cx, cy] = g.clampToMap(x, y); u.dash = { tx: cx, ty: cy, speed, hit: new Set(), forced: true };
}
export function abilityValue(u, ab) {
  const rank = u.ranks[ab.key]; if (!rank) return 0;
  let v = ab.base[rank - 1];
  const r = ab.ratio || {}, s = u.st;
  v += (r.ad || 0) * s.ad + (r.ad_bonus || 0) * s.adBonus + (r.ap || 0) * s.ap + (r.armor || 0) * s.armor +
    (r.hp_bonus || 0) * (s.maxHp - growth(u.base.hp, u.base.hp_g, u.level));
  return v;
}
