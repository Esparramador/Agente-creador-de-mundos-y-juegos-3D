// Kits de los 15 campeones (design/gdd/champion-roster.md). Los números vienen de data.js;
// aquí está el comportamiento. Cada habilidad: { t: tipo de apuntado, ai: pista para bots, cast(g,u,aim,v,ab) }.
// t: 'skill' (dirección), 'point' (punto en rango), 'unit' (enemigo), 'ally' (aliado o uno mismo), 'self'.
import {
  TICK, addBuff, hasBuff, getBuff, removeBuff, applyCC, hasCC, addShield, heal, dealDamage, spawnProjectile,
  spawnZone, dashTo, knockTo, unitsInRadius, unitsInLine, unitsInCone, norm, dist, clamp,
} from './core.js';

const dirOf = (u, aim) => norm(aim.x - u.x, aim.y - u.y);
const ptIn = (u, aim, r) => { const d = Math.hypot(aim.x - u.x, aim.y - u.y); if (d <= r) return [aim.x, aim.y]; const [dx, dy] = dirOf(u, aim); return [u.x + dx * r, u.y + dy * r]; };
const fx = (g, o) => g.fx.push({ age: 0, t: 0.35, ...o });
const isTeam = (a, b) => a.team === b.team;

function lineHit(g, u, aim, range, w, fn, opts = {}) {
  const [dx, dy] = dirOf(u, aim); const bx = u.x + dx * range, by = u.y + dy * range;
  const hits = unitsInLine(g, u.team, u.x, u.y, bx, by, w, opts);
  fx(g, { kind: 'line', x: u.x, y: u.y, x2: bx, y2: by, w, team: u.team, col: opts.col });
  hits.forEach((t, i) => fn(t, i)); return hits;
}
function burst(g, u, x, y, r, fn, opts = {}) {
  const hits = unitsInRadius(g, u.team, x, y, r, opts);
  fx(g, { kind: 'circle', x, y, r, team: opts.allies ? u.team : u.team, col: opts.col, ally: opts.allies });
  hits.forEach(fn); return hits;
}
function burn(g, src, tgt) {
  if (!tgt.alive || tgt.structure) return;
  const cap = tgt.kind === 'monster' ? 40 : 1e9;
  addBuff(tgt, 'burn', 3, { src, onTick: (g2, u) => { if (src.alive || true) dealDamage(g2, src, u, Math.min(cap, u.st.maxHp * 0.02 / 3) * TICK, 'magic', { dot: true, noProc: true }); } });
}

export const KITS = {
  // ======================= TANQUES =======================
  brannoc: {
    order: ['Q', 'E', 'W'],
    tick(g, u) {
      u.p.t = (u.p.t || 0) - TICK;
      if (u.p.t <= 0 && g.t - (u.lastDamaged ?? -99) > 4 && !hasBuff(u, 'yunque')) { addShield(g, u, u, 0.08 * u.st.maxHp, 999, 'yunque'); u.p.t = 8; }
    },
    onDamaged(g, u, src, amt, type, o) {
      const b = getBuff(u, 'templar');
      if (b && o.attack && src && src.alive && !src.structure) dealDamage(g, u, src, b.reflect, 'magic', { noProc: true });
    },
    Q: { t: 'skill', ai: 'dmg', range: 600, cast(g, u, aim, v) {
      lineHit(g, u, aim, 600, 160, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); applyCC(g, t, 'slow', 1.5, { val: 0.4 }); }); return true; } },
    W: { t: 'self', ai: 'buff', cast(g, u, aim, v, ab) {
      const a = [20, 25, 30, 35, 40][u.ranks.W - 1];
      addBuff(u, 'templar', 4, { stats: { armor: a, mr: a }, reflect: 15 + 0.1 * u.st.armor }); return true; } },
    E: { t: 'skill', ai: 'engage', range: 450, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim); let done = false;
      dashTo(g, u, u.x + dx * 450, u.y + dy * 450, 1300, { onPass: (g2, t) => {
        if (done) return; done = true; dealDamage(g, u, t, v, 'phys', { ability: true });
        knockTo(g, t, t.x + dx * 250, t.y + dy * 250, 900, 0.4); u.dash = null; } });
      return true; } },
    R: { t: 'point', ai: 'ult', range: 700, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 700);
      spawnZone(g, { x, y, r: 300, team: u.team, delay: 0.75, t: 0, warn: true, onTrigger(g2) {
        burst(g, u, x, y, 300, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'airborne', 1.25); });
        for (let i = 0; i < 3; i++) { const a = i * 2.094; g.addObstacle(x + Math.cos(a) * 220, y + Math.sin(a) * 220, 70, 3, '#8d6e63'); }
      } }); return true; } },
  },
  morgra: {
    order: ['Q', 'E', 'W'],
    tick(g, u) {
      if (u.hp < 0.4 * u.st.maxHp && g.t >= (u.p.cd || 0) && g.t - (u.lastCombat ?? -99) < 3) {
        u.p.cd = g.t + 60;
        addBuff(u, 'sangre', 3, { stats: { tenacity: 0.3 }, onTick: (g2, x) => heal(g2, x, x, 0.02 * x.st.maxHp * TICK) });
        g.emit('text', { x: u.x, y: u.y, txt: 'Sangre Ancestral', col: '#ff7043' });
      }
    },
    Q: { t: 'self', ai: 'cc', range: 350, cast(g, u, aim, v) {
      burst(g, u, u.x, u.y, 350, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'taunt', 1, { src: u }); }); return true; } },
    W: { t: 'self', ai: 'buff', cast(g, u) { addBuff(u, 'piel', 3, { stats: { dmgReduct: [0.15, 0.18, 0.21, 0.24, 0.27][u.ranks.W - 1] } }); return true; } },
    E: { t: 'unit', ai: 'dmg', range: 200, cast(g, u, aim, v) {
      dealDamage(g, u, aim.unit, v, 'magic', { ability: true }); addBuff(u, 'jabali', 2, { pct: { ms: 0.3 } }); return true; } },
    R: { t: 'skill', ai: 'ult', range: 1000, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1400, range: 1000, w: 240, team: u.team, src: u, pierce: true, color: '#ff8a65',
        onHit: (g2, t) => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'airborne', 1); } });
      addBuff(u, 'estampida', 3, { pct: { ms: 0.3 } }); return true; } },
  },
  ossuar: {
    order: ['Q', 'E', 'W'],
    onUnitDeath(g, u, dead) {
      if (dead.team !== u.team && dead.team !== 2 && dist(u, dead) < 900 && (u.p.bones || 0) < 30) {
        u.p.bones = (u.p.bones || 0) + 1; addBuff(u, 'huesos', 1e9, { stats: { armor: u.p.bones, mr: u.p.bones } });
      }
    },
    Q: { t: 'skill', ai: 'cc', range: 1000, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1600, range: 1000, w: 90, team: u.team, src: u, color: '#e0e0e0',
        onHit: (g2, t) => { dealDamage(g, u, t, v, 'magic', { ability: true }); const [ex, ey] = norm(u.x - t.x, u.y - t.y); knockTo(g, t, u.x - ex * 140, u.y - ey * 140, 1600, 0.5); } });
      return true; } },
    W: { t: 'ally', ai: 'shield', range: 600, cast(g, u, aim, v) { addShield(g, u, aim.unit, v, 3); return true; } },
    E: { t: 'point', ai: 'cc', range: 650, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 650);
      spawnZone(g, { x, y, r: 250, team: u.team, delay: 0.5, t: 0, warn: true, onTrigger() {
        burst(g, u, x, y, 250, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'root', 1); }); } });
      return true; } },
    R: { t: 'point', ai: 'ult', range: 700, cast(g, u, aim) {
      const [x, y] = ptIn(u, aim, 700); spawnZone(g, { x, y, r: 400, team: u.team, t: 2.5, kind: 'crypt', col: '#b0bec5' }); return true; } },
  },
  // ======================= LUCHADORES =======================
  kaelith: {
    order: ['Q', 'E', 'W'],
    onAttack(g, u, t, hit) {
      u.p.n = (u.p.n || 0) + 1;
      if (u.p.n % 3 === 0) hit.extra.push([Math.min(t.kind === 'monster' ? 300 : 1e9, 0.04 * t.st.maxHp), 'true']);
      const j = getBuff(u, 'juicio');
      if (j) { hit.extra.push([j.val, 'phys']); hit.after.push(() => applyCC(g, t, 'stun', 0.75)); removeBuff(u, 'juicio'); }
    },
    Q: { t: 'skill', ai: 'dmg', range: 300, cast(g, u, aim, v) { return kaelQ(g, u, aim, v); }, recast(g, u, aim) { kaelQ(g, u, aim, u.p.qv, true); return true; } },
    W: { t: 'self', ai: 'buff', cast(g, u) { addBuff(u, 'spellshield', 1.5); return true; } },
    E: { t: 'skill', ai: 'engage', range: 350, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim); dashTo(g, u, u.x + dx * 350, u.y + dy * 350, 1200, { onEnd: () => addBuff(u, 'juicio', 4, { val: v }) }); return true; } },
    R: { t: 'unit', ai: 'execute', range: 600, champs: true, cast(g, u, aim, v) {
      const t = aim.unit; dashTo(g, u, t.x, t.y, 1800, { onEnd: () => {
        if (!t.alive) return; const miss = 1 - t.hp / t.st.maxHp; dealDamage(g, u, t, v * (1 + miss), 'phys', { ability: true });
        fx(g, { kind: 'circle', x: t.x, y: t.y, r: 160, team: u.team, col: '#ffd54a' }); } }); return true; } },
  },
  tharok: {
    order: ['Q', 'E', 'W'],
    onAttack(g, u) {
      const b = getBuff(u, 'frenesi'); const n = Math.min(5, (b ? b.n : 0) + 1);
      addBuff(u, 'frenesi', 4, { n, stats: { as: 0.08 * n } }).t = 4;
    },
    Q: { t: 'self', ai: 'dmg', range: 250, cast(g, u, aim, v) {
      spawnZone(g, { x: u.x, y: u.y, r: 250, team: u.team, t: 1.5, every: 0.5, follow: u, col: '#ef5350', onTick() {
        let champ = 0; burst(g, u, u.x, u.y, 250, t => { const d = dealDamage(g, u, t, v / 3, 'phys', { ability: true }); if (t.kind === 'champ') champ += d; });
        if (champ) heal(g, u, u, champ * 0.3); } }); return true; } },
    W: { t: 'self', ai: 'buff', range: 400, cast(g, u) { burst(g, u, u.x, u.y, 400, t => addBuff(t, 'grito', 3, { stats: { dmgOut: -0.2 } })); return true; } },
    E: { t: 'point', ai: 'engage', range: 600, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 600); dashTo(g, u, x, y, 1300, { onEnd: () => burst(g, u, u.x, u.y, 220, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); applyCC(g, t, 'slow', 1, { val: 0.5 }); }) }); return true; } },
    R: { t: 'self', ai: 'survive', cast(g, u) { addBuff(u, 'ira', 5, { undying: true }); g.emit('text', { x: u.x, y: u.y, txt: '¡IRA!', col: '#ff1744' }); return true; } },
  },
  yssra: {
    order: ['Q', 'E', 'W'],
    onCast(g, u) { spawnZone(g, { x: u.x, y: u.y, r: 220, team: u.team, t: 3, kind: 'puddle', col: '#4fc3f7' }); },
    tick(g, u) {
      if (g.zones.some(z => z.kind === 'puddle' && z.team === u.team && Math.hypot(u.x - z.x, u.y - z.y) < z.r))
        addBuff(u, 'corriente', 0.2, { pct: { ms: 0.2 }, stats: { regen: 10 } });
    },
    Q: { t: 'skill', ai: 'dmg', range: 475, cast(g, u, aim, v) {
      lineHit(g, u, aim, 475, 130, t => { dealDamage(g, u, t, v * 0.6, 'phys', { ability: true }); dealDamage(g, u, t, v * 0.6, 'magic', { ability: true, noProc: true }); }); return true; } },
    W: { t: 'self', ai: 'shield', cast(g, u, aim, v) { addShield(g, u, u, v, 3); addBuff(u, 'burbuja', 3); return true; } },
    onDamaged(g, u, src, amt, type, o) { if (hasBuff(u, 'burbuja') && o.attack && src && !src.structure) applyCC(g, src, 'slow', 1, { val: 0.3 }); },
    E: { t: 'skill', ai: 'engage', range: 500, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      dashTo(g, u, u.x + dx * 500, u.y + dy * 500, 1200, { onPass: (g2, t) => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'airborne', 0.5); } }); return true; } },
    R: { t: 'point', ai: 'ult', range: 900, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 900);
      burst(g, u, x, y, 450, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'slow', 2, { val: 0.6 }); }, { col: '#4fc3f7' });
      spawnZone(g, { x, y, r: 450, team: u.team, t: 6, kind: 'puddle', col: '#4fc3f7' }); return true; } },
  },
  // ======================= MAGOS =======================
  vaelor: {
    order: ['Q', 'E', 'W'],
    Q: { t: 'skill', ai: 'dmg', range: 900, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1500, range: 900, w: 80, team: u.team, src: u, color: '#ff7043',
        onHit: (g2, t) => burst(g, u, t.x, t.y, 150, e => { dealDamage(g, u, e, v, 'magic', { ability: true }); burn(g, u, e); }, { col: '#ff7043' }) });
      return true; } },
    W: { t: 'point', ai: 'cc', range: 800, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 800); const [dx, dy] = dirOf(u, aim); const px = -dy * 300, py = dx * 300;
      const hit = new Set();
      spawnZone(g, { x, y, r: 300, team: u.team, t: 3, kind: 'wall', seg: [x - px, y - py, x + px, y + py], col: '#ff5722', every: TICK, onTick() {
        for (const t of unitsInLine(g, u.team, x - px, y - py, x + px, y + py, 70)) if (!hit.has(t.id)) {
          hit.add(t.id); dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'slow', 2, { val: 0.4 }); burn(g, u, t); } } });
      return true; } },
    E: { t: 'unit', ai: 'cc', range: 650, cast(g, u, aim, v) {
      const t = aim.unit; const burning = hasBuff(t, 'burn');
      dealDamage(g, u, t, v, 'magic', { ability: true }); if (burning) applyCC(g, t, 'stun', 1.25); burn(g, u, t);
      fx(g, { kind: 'circle', x: t.x, y: t.y, r: 90, team: u.team, col: '#ffab40' }); return true; } },
    R: { t: 'point', ai: 'ult', range: 1300, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 1300);
      spawnZone(g, { x, y, r: 320, team: u.team, t: 2, warn: true, col: '#ff3d00' });
      u.channel = { t: 2, every: 0.4, acc: 0, fn() {
        const a = g.rand() * 6.283, d = g.rand() * 220, mx = x + Math.cos(a) * d, my = y + Math.sin(a) * d;
        burst(g, u, mx, my, 170, t => { dealDamage(g, u, t, v / 5, 'magic', { ability: true }); burn(g, u, t); }, { col: '#ff3d00' }); } };
      return true; } },
  },
  nyxe: {
    order: ['Q', 'W', 'E'],
    freeCast: u => ((u.p.casts || 0) + 1) % 4 === 0,
    onCast(g, u) { u.p.casts = (u.p.casts || 0) + 1; },
    Q: { t: 'self', ai: 'dmg', range: 700, cast(g, u, aim, v) {
      const ts = unitsInRadius(g, u.team, u.x, u.y, 700).sort((a, b) => (b.kind === 'champ') - (a.kind === 'champ') || dist(u, a) - dist(u, b));
      if (!ts.length) return false;
      for (let i = 0; i < 3; i++) { const t = ts[i % ts.length];
        spawnProjectile(g, { x: u.x + (i - 1) * 30, y: u.y, speed: 1100, range: 2000, homing: true, target: t, team: u.team, src: u, color: '#ea80fc',
          onHit: (g2, tt) => dealDamage(g, u, tt, v, 'magic', { ability: true }) }); }
      return true; } },
    W: { t: 'point', ai: 'cc', range: 800, cast(g, u, aim) {
      const [x, y] = ptIn(u, aim, 800);
      spawnZone(g, { x, y, r: 250, team: u.team, delay: 1.5, t: 0, warn: true, col: '#ce93d8', onTrigger() {
        burst(g, u, x, y, 250, t => applyCC(g, t, 'sleep', 1.5), { col: '#ce93d8' }); } }); return true; } },
    E: { t: 'point', ai: 'escape', range: 400, cast(g, u, aim) {
      const [x, y] = g.clampToMap(...ptIn(u, aim, 400)); fx(g, { kind: 'circle', x: u.x, y: u.y, r: 60, team: u.team, col: '#ea80fc' });
      u.x = x; u.y = y; u.moveTo = null; addBuff(u, 'fae', 1, { stealth: true }); return true; } },
    R: { t: 'unit', ai: 'ult', range: 700, champs: true, cast(g, u, aim, v) {
      const t = aim.unit; applyCC(g, t, 'blind', 2); applyCC(g, t, 'nearsight', 2);
      addBuff(t, 'pesadilla', 2, { onEnd: (g2, x) => dealDamage(g, u, x, v, 'magic', { ability: true }) }); return true; } },
  },
  zerath: {
    order: ['Q', 'W', 'E'],
    hpCost: u => 0.05 * u.hp,
    onTakedown(g, u) { u.p.ap = (u.p.ap || 0) + 5; addBuff(u, 'devorar', 1e9, { stats: { ap: u.p.ap } }); },
    tick(g, u) { u.untargetable = hasBuff(u, 'fase'); },
    Q: { t: 'point', ai: 'dmg', range: 800, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 800);
      spawnZone(g, { x, y, r: 200, team: u.team, delay: 0.5, t: 0, warn: true, col: '#7c4dff', onTrigger() {
        burst(g, u, x, y, 200, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'slow', 1, { val: 0.6 }); }, { col: '#7c4dff' }); } });
      return true; } },
    W: { t: 'unit', ai: 'dmg', range: 500, cast(g, u, aim, v) {
      const t = aim.unit;
      u.channel = { t: 3, every: 0.25, acc: 0, target: t, fn() {
        if (!t.alive || dist(u, t) > 700) { u.channel = null; return; }
        const d = dealDamage(g, u, t, v / 4, 'magic', { ability: true, dot: true }); heal(g, u, u, d * 0.6); } };
      return true; } },
    E: { t: 'self', ai: 'survive', cast(g, u) { addBuff(u, 'fase', 1); u.untargetable = true; return true; } },
    R: { t: 'point', ai: 'ult', range: 750, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 750);
      spawnZone(g, { x, y, r: 350, team: u.team, t: 2.5, every: 0.1, col: '#651fff', onTick() {
        for (const t of unitsInRadius(g, u.team, x, y, 350)) {
          const [dx, dy] = norm(x - t.x, y - t.y); if (!t.structure && !t.unstoppable) { t.x += dx * 14; t.y += dy * 14; }
          dealDamage(g, u, t, v / 25, 'magic', { ability: true, dot: true }); } } });
      return true; } },
  },
  // ======================= TIRADORES =======================
  lyra: {
    order: ['Q', 'W', 'E'],
    onAttack(g, u, t, hit) {
      if (u.p.last === t.id) u.p.n++; else { u.p.last = t.id; u.p.n = 1; }
      if (u.p.n >= 3) addBuff(u, 'halcon', 3, { stats: { as: 0.3 } });
      if (hasBuff(u, 'voltereta')) removeBuff(u, 'voltereta');
    },
    Q: { t: 'skill', ai: 'dmg', range: 1100, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim); let n = 0;
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 2000, range: 1100, w: 90, team: u.team, src: u, pierce: true, color: '#c5e1a5',
        onHit: (g2, t) => { dealDamage(g, u, t, v * Math.max(0.4, 1 - 0.1 * n++), 'phys', { ability: true }); } }); return true; } },
    W: { t: 'point', ai: 'dmg', range: 900, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 900);
      burst(g, u, x, y, 250, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); applyCC(g, t, 'slow', 2, { val: 0.3 }); }, { col: '#aed581' }); return true; } },
    E: { t: 'skill', ai: 'escape', range: 300, cast(g, u, aim) {
      const [dx, dy] = dirOf(u, aim); dashTo(g, u, u.x + dx * 300, u.y + dy * 300, 1100); addBuff(u, 'voltereta', 4, { stats: { range: 100 } }); return true; } },
    R: { t: 'skill', ai: 'ult', range: 3000, global: true, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1600, range: 16000, w: 140, team: u.team, src: u, champs: true, color: '#fff59d',
        onHit: (g2, t, p) => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'stun', 1 + 2.5 * Math.min(1, p.traveled / 3000)); } });
      return true; } },
  },
  gearix: {
    order: ['Q', 'E', 'W'],
    onAttack(g, u, t, hit) {
      u.p.n = (u.p.n || 0) + 1;
      if (u.p.n % 6 === 0) {
        hit.mult *= 1.5; const [dx, dy] = norm(t.x - u.x, t.y - u.y);
        for (const e of unitsInCone(g, u.team, u.x, u.y, dx, dy, 450, 0.5)) if (e !== t) dealDamage(g, u, e, u.st.ad * 1.05, 'phys', { noProc: true });
        fx(g, { kind: 'cone', x: u.x, y: u.y, dx, dy, r: 450, a: 0.5, team: u.team, col: '#ffcc80' });
      }
    },
    Q: { t: 'point', ai: 'dmg', range: 500, cast(g, u, aim, v) {
      const mine = g.units.filter(x => x.alive && x.kind === 'pet' && x.owner === u);
      if (mine.length >= 2) g.kill(mine[0], null);
      const [x, y] = ptIn(u, aim, 500); g.spawnPet(u, x, y, { hp: 250 + 30 * u.level, dmg: v, range: 500, life: 8, name: 'Torreta' }); return true; } },
    W: { t: 'point', ai: 'cc', range: 700, cast(g, u, aim, v) {
      const [x, y] = ptIn(u, aim, 700);
      burst(g, u, x, y, 250, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'blind', 1.5); }, { col: '#90a4ae' }); return true; } },
    E: { t: 'skill', ai: 'escape', range: 400, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      lineHit(g, u, aim, 400, 140, t => dealDamage(g, u, t, v, 'phys', { ability: true }));
      dashTo(g, u, u.x - dx * 400, u.y - dy * 400, 1400); return true; } },
    R: { t: 'skill', ai: 'ult', range: 1500, cast(g, u, aim, v) {
      const a = { x: aim.x, y: aim.y };
      spawnZone(g, { x: u.x, y: u.y, r: 60, team: u.team, t: 1, warn: true, col: '#ffab00' });
      u.channel = { t: 1, every: 99, acc: 0, fn() {}, onEnd() {
        lineHit(g, u, a, 1500, 150, t => dealDamage(g, u, t, v * (t.hp < 0.35 * t.st.maxHp ? 1.5 : 1), 'phys', { ability: true }), { col: '#ffab00' }); } };
      return true; } },
  },
  // ======================= ASESINOS =======================
  sable: {
    order: ['Q', 'E', 'W'],
    dmgMod(g, u, t, amt) {
      if (t.kind === 'champ' && !g.units.some(a => a.alive && a !== t && a.team === t.team && a.kind === 'champ' && dist(a, t) < 600)) amt *= 1.25;
      const m = getBuff(t, 'ejecucion'); if (m && m.src === u) m.acc += amt; return amt;
    },
    onAttack(g, u) { removeBuff(u, 'velo'); },
    Q: { t: 'skill', ai: 'engage', range: 700, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1700, range: 700, w: 70, team: u.team, src: u, color: '#b39ddb',
        onHit: (g2, t) => { dealDamage(g, u, t, v, 'phys', { ability: true }); u.p.qT = t; u.recast.Q = g.t + 3; } }); return true; },
      recast(g, u) { const t = u.p.qT; if (!t || !t.alive) return false; const [dx, dy] = norm(t.x - u.x, t.y - u.y);
        [u.x, u.y] = g.clampToMap(t.x + dx * 90, t.y + dy * 90); u.moveTo = null; return true; } },
    W: { t: 'self', ai: 'engage', cast(g, u) { addBuff(u, 'velo', 2, { stealth: true, pct: { ms: 0.2 } }); return true; } },
    E: { t: 'self', ai: 'dmg', range: 300, cast(g, u, aim, v) {
      burst(g, u, u.x, u.y, 300, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); applyCC(g, t, 'slow', 1.5, { val: 0.3 }); }, { col: '#9575cd' }); return true; } },
    R: { t: 'unit', ai: 'execute', range: 625, champs: true, cast(g, u, aim, v) {
      const t = aim.unit;
      addBuff(t, 'ejecucion', 3, { src: u, acc: 0, onEnd: (g2, x, b) => { if (x.alive) dealDamage(g, u, x, v + 0.3 * b.acc, 'phys', { ability: true, noProc: true }); } });
      dealDamage(g, u, t, 1, 'phys', { ability: true }); return true; } },
  },
  rakhar: {
    order: ['Q', 'E', 'W'],
    extraVision(g, u) { return g.units.filter(e => e.alive && e.kind === 'champ' && e.team !== u.team && e.hp < 0.5 * e.st.maxHp && dist(u, e) < 1500); },
    tick(g, u) {
      if (this.extraVision(g, u).length) addBuff(u, 'instinto', 0.3, { pct: { ms: 0.15 } });
      const c = getBuff(u, 'caceria'); if (c) c.stealth = g.t - (u.lastCombat ?? -99) > 1.5;
    },
    onAttack(g, u, t, hit) { if (hasBuff(u, 'caceria_crit')) { hit.crit = true; removeBuff(u, 'caceria_crit'); } },
    onTakedown(g, u) { u.cds.E = 0; },
    Q: { t: 'unit', ai: 'dmg', range: 200, cast(g, u, aim, v) {
      const t = aim.unit; [0, 0.15, 0.3].forEach((d, i) => g.after(d, () => { if (t.alive && u.alive) dealDamage(g, u, t, i === 2 ? 2 * v : v, 'phys', { ability: true }); })); return true; } },
    W: { t: 'self', ai: 'cc', range: 325, cast(g, u, aim, v) {
      burst(g, u, u.x, u.y, 325, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); applyCC(g, t, 'fear', 0.75, { src: u }); }, { col: '#ff5252' }); return true; } },
    E: { t: 'unit', ai: 'engage', range: 650, cast(g, u, aim, v) {
      const t = aim.unit; dashTo(g, u, t.x, t.y, 1600, { onEnd: () => { if (t.alive) dealDamage(g, u, t, v, 'phys', { ability: true }); } }); return true; } },
    R: { t: 'self', ai: 'engage', cast(g, u) { addBuff(u, 'caceria', 6, { pct: { ms: 0.4 } }); addBuff(u, 'caceria_crit', 6); return true; } },
  },
  // ======================= SOPORTES =======================
  elowen: {
    order: ['W', 'Q', 'E'],
    onAttack(g, u, t) {},
    Q: { t: 'skill', ai: 'cc', range: 1000, cast(g, u, aim, v) {
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1400, range: 1000, w: 80, team: u.team, src: u, color: '#81c784',
        onHit: (g2, t) => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'root', 1.25); } }); return true; } },
    W: { t: 'ally', ai: 'heal', range: 700, cast(g, u, aim, v) {
      const t = aim.unit; heal(g, u, t, v); if (t !== u) heal(g, u, u, v * 0.5);
      spawnZone(g, { x: t.x + 60, y: t.y + 40, r: 70, team: u.team, t: 6, kind: 'flower', col: '#f48fb1', every: TICK, onTick(g2, z) {
        const a = g.units.find(x => x.alive && x.kind === 'champ' && x.team === u.team && Math.hypot(x.x - z.x, x.y - z.y) < 90);
        if (a) { heal(g, u, a, 15 + 0.1 * u.st.ap); z.alive = false; z.t = 0; } } });
      return true; } },
    E: { t: 'ally', ai: 'shield', range: 700, cast(g, u, aim) { addBuff(aim.unit, 'corteza', 4, { stats: { armor: 20, mr: 20 }, rootNext: true }); return true; } },
    R: { t: 'self', ai: 'heal_ult', range: 450, cast(g, u, aim, v) {
      spawnZone(g, { x: u.x, y: u.y, r: 450, team: u.team, t: 3, every: 0.5, col: '#a5d6a7', ally: true, onTick(g2, z) {
        for (const a of unitsInRadius(g, u.team, z.x, z.y, 450, { allies: true, champs: true })) { heal(g, u, a, v / 6); addBuff(a, 'renacer', 0.6, { src: u }); } } });
      return true; } },
  },
  aurik: {
    order: ['Q', 'E', 'W'],
    tick(g, u) {
      if ((u.p.tk = (u.p.tk || 0) + 1) % 10) return;
      const val = hasBuff(u, 'dragon') ? 10 : 5;
      for (const a of g.units) if (a.alive && a.kind === 'champ' && a.team === u.team && dist(a, u) < 800) addBuff(a, 'escamas', 0.5, { stats: { armor: val } });
    },
    Q: { t: 'skill', ai: 'dmg', range: 550, cast(g, u, aim, v) {
      const hitFn = t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'slow', 1.5, { val: 0.3 }); };
      if (hasBuff(u, 'dragon')) lineHit(g, u, aim, 900, 160, hitFn, { col: '#ffd54f' });
      else { const [dx, dy] = dirOf(u, aim); unitsInCone(g, u.team, u.x, u.y, dx, dy, 550, 0.45).forEach(hitFn);
        fx(g, { kind: 'cone', x: u.x, y: u.y, dx, dy, r: 550, a: 0.45, team: u.team, col: '#ffd54f' }); }
      return true; } },
    W: { t: 'ally', ai: 'shield', range: 800, cast(g, u, aim, v) {
      const t = aim.unit; addShield(g, u, u, v, 2.5); if (t !== u) { addShield(g, u, t, v, 2.5); dashTo(g, u, t.x, t.y, 1500); } return true; } },
    E: { t: 'self', ai: 'cc', range: 300, cast(g, u, aim, v) {
      burst(g, u, u.x, u.y, 300, t => { dealDamage(g, u, t, v, 'magic', { ability: true }); applyCC(g, t, 'stun', 0.75); }, { col: '#ffca28' }); return true; } },
    R: { t: 'self', ai: 'engage', cast(g, u, aim, v) {
      addBuff(u, 'dragon', 8, { stats: { maxHp: 300 }, flying: true }); heal(g, u, u, 300);
      burst(g, u, u.x, u.y, 300, t => dealDamage(g, u, t, v, 'magic', { ability: true }), { col: '#ffd54f' }); return true; } },
  },
};

function kaelQ(g, u, aim, v, isRecast) {
  u.p.qv = v; let champ = false;
  lineHit(g, u, aim, 300, 190, t => { dealDamage(g, u, t, v, 'phys', { ability: true }); if (t.kind === 'champ') champ = true; }, { col: '#ffe082' });
  if (champ && !isRecast) u.recast.Q = g.t + 4;
  return true;
}

// Hechizos de invocador (combat-core.md §Hechizos de invocador)
export const SUMMONERS = {
  flash:    { name: 'Destello',    cd: 300, t: 'point', range: 400 },
  ignite:   { name: 'Prender',     cd: 180, t: 'unit',  range: 600 },
  heal:     { name: 'Curar',       cd: 240, t: 'self' },
  smite:    { name: 'Castigo',     cd: 15,  t: 'unit',  range: 500, charges: 2 },
  teleport: { name: 'Teleportar',  cd: 360, t: 'self' },
  barrier:  { name: 'Barrera',     cd: 180, t: 'self' },
  snowball: { name: 'Bola de Nieve', cd: 40, t: 'skill', range: 1600 },
};
export function castSummoner(g, u, id, aim) {
  switch (id) {
    case 'flash': { const [x, y] = g.clampToMap(...ptIn(u, aim, 400)); fx(g, { kind: 'circle', x: u.x, y: u.y, r: 50, team: u.team, col: '#ffee58' }); u.x = x; u.y = y; u.dash = null; u.moveTo = null; g.unstick(u); return true; }
    case 'ignite': { const t = aim.unit; if (!t || t.team === u.team || dist(u, t) > 600 + t.r) return false;
      const tot = 70 + 20 * u.level; addBuff(t, 'grievous', 5); addBuff(t, 'prender', 5, { onTick: (g2, x) => dealDamage(g, u, x, tot / 5 * TICK, 'true', { dot: true, noProc: true }) }); return true; }
    case 'heal': { const amt = 75 + 15 * u.level; heal(g, null, u, amt); addBuff(u, 'curar_ms', 1, { pct: { ms: 0.3 } });
      const a = g.units.filter(x => x.alive && x.kind === 'champ' && x.team === u.team && x !== u && dist(x, u) < 850).sort((a, b) => a.hp / a.st.maxHp - b.hp / b.st.maxHp)[0];
      if (a) heal(g, null, a, amt); return true; }
    case 'smite': { const t = aim.unit; if (!t || t.team === u.team || t.kind === 'champ' || t.structure || dist(u, t) > 500 + t.r) return false;
      dealDamage(g, u, t, 600 + 35 * (u.level - 1), 'true', { noProc: true }); return true; }
    case 'teleport': { const tw = g.units.filter(x => x.alive && x.structure && x.team === u.team && x.kind === 'tower').sort((a, b) => dist(b, g.base(u.team)) - dist(a, g.base(u.team)))[0];
      if (!tw) return false; u.channel = { t: 4, every: 99, acc: 0, fn() {}, onEnd() { [u.x, u.y] = g.clampToMap(tw.x + 150, tw.y + 150); g.unstick(u); } }; return true; }
    case 'barrier': addShield(g, u, u, 95 + 20 * u.level, 2); return true;
    case 'snowball': {
      if (u.recast.snow > g.t && u.p.snowT && u.p.snowT.alive) { const t = u.p.snowT; u.recast.snow = 0; dashTo(g, u, t.x, t.y, 1600); return 'recast'; }
      const [dx, dy] = dirOf(u, aim);
      spawnProjectile(g, { x: u.x, y: u.y, dx, dy, speed: 1500, range: 1600, w: 80, team: u.team, src: u, color: '#e1f5fe',
        onHit: (g2, t) => { dealDamage(g, u, t, 10 + 5 * u.level, 'true'); u.p.snowT = t; u.recast.snow = g.t + 3; } }); return true;
    }
  }
  return false;
}
