// Simulación de la partida: maps.md, progression-economy.md, match-flow.md.
// Determinista con semilla; no usa el DOM, así que se prueba en Node (tests/).
import { CHAMPIONS, ITEMS } from './data.js';
import { KITS, SUMMONERS, castSummoner } from './kits.js';
import { buildMap } from './maps.js';
import { botThink } from './ai.js';
import {
  TICK, NEUTRAL, rng, dist, dist2, norm, clamp, recalcStats, addBuff, hasBuff, getBuff, removeBuff, applyCC, hasCC,
  canMove, canAct, canCast, canAttack, dealDamage, heal, abilityValue, effectiveCd, xpToNext, respawnTime,
  spawnProjectile, updateProjectile, updateZone, spawnZone, unitsInRadius, segDist,
} from './core.js';

export const CHAMP_BY_ID = Object.fromEntries(CHAMPIONS.map(c => [c.id, c]));
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const RES_TYPE = { 'Maná': 'mana', 'Furia': 'fury', 'Energía': 'energy', 'Munición (6 balas)': 'none', 'Ninguno': 'none', 'Ninguno (vida)': 'hp' };
const ROLE_OF = c => /Jungla/.test(c.role) ? 'jungle' : c.class === 'Soporte' ? 'support' : c.class === 'Tirador' ? 'bot' : /Mid/.test(c.role) ? 'mid' : 'top';
const DRAGON_TYPES = ['Ceniza', 'Marea', 'Raíz', 'Forja'];
const FACTION_BONUS = { 'Horda de Colmillo Rojo': 'adPct', 'Bosque Onírico': 'ah', 'Orden del Sol Partido': 'armorPct', 'Concilio de la Torre Gris': 'apPct' };

export class Game {
  constructor(o = {}) {
    this.opts = o; this.rand = rng(o.seed || 12345);
    this.map = buildMap(o.mapId || 'grieta_ceniza'); this.rules = this.map.rules;
    this.t = 0; this.units = []; this.projectiles = []; this.zones = []; this.fx = []; this.events = []; this.timers = [];
    this.obstacles = this.map.rocks.map(([x, y, r]) => ({ x, y, r, perm: true }));
    this.brushes = this.map.brushes.map(([x, y, r]) => ({ x, y, r }));
    this.nextId = 1; this.over = false; this.winner = null; this.difficulty = o.difficulty || 'normal';
    this.teamBonus = [{}, {}]; this.dragons = [[], []]; this.lordUntil = [0, 0]; this.avatarUntil = [0, 0];
    this.kills = [0, 0]; this.towersDown = [0, 0]; this.points = [0, 0]; this.firstBlood = false;
    this.goldHistory = [[], []]; this.wave = 0; this.nextWave = this.rules.aram ? 30 : 65; this.feed = [];
    this.visible = [new Set(), new Set()]; this.visTimer = 0; this.aiTimer = 0; this.secTimer = 0;
    this.epic = {}; this.altars = (this.map.altars || []).map(([name, x, y]) => ({ name, x, y, owner: null, prog: 0, by: null }));
    this.relics = (this.map.relics || []).map(([x, y]) => ({ x, y, next: 60 }));
    this.buildStructures(); this.buildCamps(); this.buildTeams(o);
    this.applyFactionSynergy();
  }
  // ---------------- utilidades ----------------
  emit(type, d) { this.events.push({ type, t: this.t, ...d }); if (this.events.length > 400) this.events.splice(0, 200); }
  after(delay, fn) { this.timers.push({ at: this.t + delay, fn }); }
  base(team) { const [x, y] = this.map.fountain[team]; return { x, y }; }
  inFountain(u) { return dist(u, this.base(u.team)) < 900; }
  clampToMap(x, y) {
    const b = this.map.bounds;
    return [clamp(x, 100, this.map.W - 100), clamp(y, b ? b.y0 : 100, b ? b.y1 : this.map.H - 100)];
  }
  addObstacle(x, y, r, t, col) { const o = { x, y, r, col }; this.obstacles.push(o); this.after(t, () => { this.obstacles = this.obstacles.filter(z => z !== o); }); }
  unstick(u) { for (const o of this.obstacles) { const d = Math.hypot(u.x - o.x, u.y - o.y); if (d < o.r + u.r) { const [nx, ny] = norm(u.x - o.x, u.y - o.y); u.x = o.x + nx * (o.r + u.r + 1); u.y = o.y + ny * (o.r + u.r + 1); } } }
  minutes() { return this.t / 60; }

  makeUnit(kind, team, x, y, props = {}) {
    const u = { id: this.nextId++, kind, team, x, y, r: 40, alive: true, level: 1, buffs: [], cc: [], items: [], dmgBy: {},
      p: {}, cds: {}, ranks: {}, recast: {}, attackCd: 0, windup: null, moveTo: null, target: null, dash: null, channel: null,
      stats: { k: 0, d: 0, a: 0, cs: 0, gold: 0, dmg: 0, champDmg: 0, wards: 0 }, ...props };
    recalcStats(this, u); u.hp = u.st.maxHp; this.units.push(u); return u;
  }

  // ---------------- construcción ----------------
  buildStructures() {
    this.structures = [];
    for (const team of [0, 1]) {
      const tw = this.map.towers[team], byLane = {};
      for (const [x, y, lane, tier] of tw) {
        const hp = [0, 5000, 3600, 3300, 2700][tier] * (this.rules.towerHpMult || 1);
        const u = this.makeUnit('tower', team, x, y, { r: 90, structure: true, lane, tier, name: 'Torre',
          base: { maxHp: hp, ad: 152, armor: 40, mr: 40, as: 1.2, range: 775, ms: 0 }, isNexusTower: tier === 4, ramp: 0, rampTarget: null });
        (byLane[lane] = byLane[lane] || []).push(u);
      }
      const inhibs = this.map.inhibs[team].map(([x, y, lane]) => this.makeUnit('inhib', team, x, y, { r: 110, structure: true, lane, name: 'Inhibidor', base: { maxHp: 4000, armor: 20, mr: 20, ms: 0, ad: 0, as: 0, range: 0 } }));
      const [nx, ny] = this.map.nexus[team];
      const nexus = this.makeUnit('nexus', team, nx, ny, { r: 170, structure: true, name: 'Nexo', base: { maxHp: 5500, armor: 20, mr: 20, ms: 0, ad: 0, as: 0, range: 0 } });
      // requisitos: cada torre necesita la anterior de su carril
      for (const lane in byLane) {
        if (lane === 'nexus') continue;
        const ts = byLane[lane].sort((a, b) => a.tier - b.tier);
        ts.forEach((t, i) => { t.req = i ? [ts[i - 1]] : []; t.reqMode = 'all'; });
      }
      for (const ih of inhibs) { const ts = (byLane[ih.lane] || []).sort((a, b) => b.tier - a.tier); ih.req = ts.length ? [ts[0]] : []; ih.reqMode = 'all'; ih.respawnAt = 0; }
      const lastTowers = Object.keys(byLane).filter(l => l !== 'nexus').map(l => byLane[l].sort((a, b) => b.tier - a.tier)[0]);
      for (const t of byLane.nexus || []) { t.req = inhibs.length ? inhibs : lastTowers; t.reqMode = 'any'; }
      nexus.req = (byLane.nexus || []).length ? byLane.nexus : (inhibs.length ? inhibs : lastTowers); nexus.reqMode = 'all';
      this.structures.push(...this.units.filter(u => u.structure && u.team === team));
      this['nexus' + team] = nexus;
    }
  }
  isStructureTargetable(s) {
    if (!s.req || !s.req.length) return true;
    const down = x => !x.alive;
    return s.reqMode === 'any' ? s.req.some(down) : s.req.every(down);
  }
  buildCamps() {
    this.camps = this.map.camps.map(([type, x, y, side]) => ({ type, x, y, side, units: [], next: this.rules.aram ? 1e9 : 90 }));
  }
  spawnCamp(c) {
    const D = {
      golem: [[1400, 38, 'Gólem de Ceniza', 70]], bestia: [[1400, 42, 'Bestia Ígnea', 70]],
      lobos: [[900, 24, 'Lobo Alfa', 55], [300, 10, 'Lobo', 45], [300, 10, 'Lobo', 45]],
      aves: [[700, 18, 'Ave Carroñera', 60], [200, 7, 'Ave', 45], [200, 7, 'Ave', 45], [200, 7, 'Ave', 45]],
      roca: [[800, 20, 'Roca Viva', 60], [800, 20, 'Roca Viva', 60]], sapo: [[1000, 18, 'Sapo de Lava', 65]],
    }[c.type];
    const mult = 1 + 0.08 * Math.floor(this.minutes() / 3);
    c.units = D.map(([hp, ad, name, r], i) => this.makeUnit('monster', NEUTRAL, c.x + (i ? Math.cos(i * 2) * 120 : 0), c.y + (i ? Math.sin(i * 2) * 120 : 0),
      { r, name, camp: c, home: { x: c.x, y: c.y }, base: { maxHp: hp * mult, ad: ad * mult, armor: 10, mr: 10, as: 0.7, range: 150, ms: 360 },
        gold: { golem: 100, bestia: 100, lobos: i ? 16 : 55, aves: i ? 10 : 45, roca: 50, sapo: 80 }[c.type], xp: { golem: 200, bestia: 200, lobos: i ? 25 : 95, aves: i ? 20 : 75, roca: 90, sapo: 150 }[c.type], big: !i }));
  }
  buildTeams(o) {
    const size = this.map.teamSize, roles = this.map.roles;
    const pool = CHAMPIONS.map(c => c.id).sort(() => this.rand() - 0.5);
    const taken = new Set(); this.champs = [];
    const pick = (role) => {
      const fits = pool.filter(id => !taken.has(id) && (this.rules.aram || ROLE_OF(CHAMP_BY_ID[id]) === role));
      const id = (fits.length ? fits : pool.filter(id => !taken.has(id)))[0]; taken.add(id); return id;
    };
    for (const team of [0, 1]) {
      const picks = (o.picks && o.picks[team]) || [];
      const list = [];
      const freeRoles = roles.slice();
      for (const id of picks) { taken.add(id); }
      for (const id of picks) {
        let role = this.rules.aram ? 'mid' : ROLE_OF(CHAMP_BY_ID[id]);
        if (!freeRoles.includes(role)) role = freeRoles[0];
        freeRoles.splice(freeRoles.indexOf(role), 1); list.push([id, role]);
      }
      while (list.length < size) { const role = freeRoles.shift(); list.push([pick(role), role]); }
      list.forEach(([id, role], i) => {
        const isPlayer = o.player !== false && team === (o.playerTeam || 0) && i === 0 && !o.allBots;
        this.champs.push(this.spawnChampion(id, team, role, isPlayer, i));
      });
    }
    this.player = this.champs.find(c => c.isPlayer) || null;
  }
  spawnChampion(id, team, role, isPlayer, idx) {
    const c = CHAMP_BY_ID[id], [fx, fy] = this.map.fountain[team];
    const sums = this.rules.aram ? ['flash', 'snowball'] : role === 'jungle' ? ['flash', 'smite'] : role === 'support' ? ['flash', 'heal'] :
      role === 'bot' ? ['flash', 'heal'] : role === 'top' ? ['flash', 'teleport'] : ['flash', 'ignite'];
    const u = this.makeUnit('champ', team, fx + (idx - 2) * 70, fy + (idx % 2) * 70, {
      r: 45, cid: id, name: c.name, data: c, kit: KITS[id], base: c.base_stats, role, isPlayer,
      ab: Object.fromEntries(c.abilities.map(a => [a.key, a])), resType: RES_TYPE[c.resource] || 'mana',
      summoners: (isPlayer && this.opts.playerSummoners) || sums, sumCd: [0, 0], smiteCharges: 2,
      xp: 0, gold: this.rules.startGold || 500, wardCharges: 2, wardRecharge: 0, streak: 0, respawnAt: 0,
      lastDamaged: -99, lastCombat: -99,
    });
    u.ranks = { Q: 0, W: 0, E: 0, R: 0 };
    const lvl = this.rules.startLevel || 1;
    while (u.level < lvl) { u.level++; }
    this.recalcRes(u); u.res = u.resMax; recalcStats(this, u); u.hp = u.st.maxHp;
    if (u.kit.init) u.kit.init(this, u);
    if (!isPlayer) this.autoLevel(u);
    return u;
  }
  applyFactionSynergy() {
    for (const team of [0, 1]) {
      const n = {}; for (const c of this.champs) if (c.team === team) n[c.data.faction] = (n[c.data.faction] || 0) + 1;
      this.synergy = this.synergy || [[], []];
      for (const f in n) if (n[f] >= 2) {
        const mult = n[f] >= 3 ? 2 : 1; const k = FACTION_BONUS[f] || 'ms';
        this.synergy[team].push({ faction: f, count: n[f], stat: k, val: k === 'ms' ? 10 * mult : k === 'ah' ? 3 * mult : 0.03 * mult });
      }
    }
    this.recalcTeamBonus();
  }
  recalcTeamBonus() {
    for (const team of [0, 1]) {
      const b = { adPct: 0, apPct: 0, armorPct: 0, ah: 0, ms: 0, adFlat: 0, apFlat: 0, structDmg: 0 };
      for (const s of this.synergy[team]) b[s.stat] += s.val;
      const ds = this.dragons[team], cnt = {}; ds.forEach(d => cnt[d] = (cnt[d] || 0) + 1);
      const soul = ds.length >= 4 ? Object.keys(cnt).sort((a, z) => cnt[z] - cnt[a])[0] : null;
      for (const d of [...ds, ...(soul ? [soul] : [])]) {
        if (d === 'Ceniza') { b.adPct += 0.06; b.apPct += 0.06; } if (d === 'Raíz') b.armorPct += 0.08; if (d === 'Forja') b.ah += 6;
      }
      b.marea = (cnt['Marea'] || 0) + (soul === 'Marea' ? 1 : 0); b.soul = soul;
      if (this.t < this.lordUntil[team]) { b.adFlat += 40; b.apFlat += 40; b.lord = true; }
      if (this.altars.length && this.altars.filter(a => a.owner === team).length >= 2) b.structDmg = 0.2;
      this.teamBonus[team] = b;
    }
  }

  // ---------------- recursos y niveles ----------------
  recalcRes(u) {
    if (u.resType === 'mana') u.resMax = 300 + 40 * (u.level - 1);
    else if (u.resType === 'energy') u.resMax = 200;
    else if (u.resType === 'fury') u.resMax = 100;
    else u.resMax = 0;
  }
  addXp(u, amt) {
    if (u.kind !== 'champ' || u.level >= 18) return;
    u.xp += amt * (this.rules.xpMult || 1);
    while (u.level < 18 && u.xp >= xpToNext(u.level)) {
      u.xp -= xpToNext(u.level); u.level++; this.recalcRes(u); u.res = Math.min(u.resMax, u.res + 40);
      const before = u.st.maxHp; recalcStats(this, u); u.hp += Math.max(0, u.st.maxHp - before) * 0;
      this.emit('levelup', { u });
      if (!u.isPlayer) this.autoLevel(u);
    }
  }
  pointsLeft(u) { return u.level - (u.ranks.Q + u.ranks.W + u.ranks.E + u.ranks.R); }
  canRank(u, k) {
    if (this.pointsLeft(u) <= 0) return false;
    if (k === 'R') return u.ranks.R < 3 && u.level >= [6, 11, 16][u.ranks.R];
    return u.ranks[k] < 5 && u.ranks[k] < Math.ceil(u.level / 2);
  }
  cmdLevel(u, k) { if (this.canRank(u, k)) { u.ranks[k]++; return true; } return false; }
  autoLevel(u) {
    let guard = 20;
    while (this.pointsLeft(u) > 0 && guard--) {
      if (this.canRank(u, 'R')) { u.ranks.R++; continue; }
      const order = u.kit.order || ['Q', 'E', 'W'];
      const need = order.find(k => u.ranks[k] === 0 && this.canRank(u, k));
      const k = need || order.find(k => this.canRank(u, k));
      if (!k) break; u.ranks[k]++;
    }
  }
  giveGold(u, amt, reason) { if (!u || u.kind !== 'champ') return; amt *= this.rules.goldMult || 1; u.gold += amt; u.stats.gold += amt; if (reason && u.isPlayer) this.emit('gold', { u, amt }); }

  // ---------------- comandos (jugador y bots) ----------------
  cmdMove(u, x, y, attackMove = false) {
    if (!u.alive) return; [x, y] = this.clampToMap(x, y);
    if (u.channel && !u.channel.noCancel) { if (u.channel.recall || u.channel.cancelable !== false) u.channel = null; }
    u.moveTo = { x, y }; u.target = null; u.attackMove = attackMove; u.windup = null;
  }
  cmdAttack(u, t) { if (!u.alive || !t || !t.alive || t.team === u.team) return; if (u.channel && u.channel.recall) u.channel = null; u.target = t; u.moveTo = null; u.attackMove = false; }
  cmdStop(u) { u.moveTo = null; u.target = null; u.windup = null; }
  abilityReady(u, k) {
    const ab = u.ab[k]; if (!ab || !u.ranks[k]) return false;
    if (u.recast[k] > this.t && u.kit[k].recast) return true;
    if ((u.cds[k] || 0) > 0) return false;
    return this.costOk(u, k);
  }
  costOf(u, k) {
    const ab = u.ab[k];
    if (u.kit.freeCast && u.kit.freeCast(u)) return 0;
    if (u.resType === 'mana' || u.resType === 'energy') return ab.cost || 0;
    return 0;
  }
  costOk(u, k) { if (u.resType === 'hp') return u.hp > 0.05 * u.hp + 1; return (u.res || 0) >= this.costOf(u, k); }
  cmdCast(u, k, aim) {
    const ab = u.ab[k], kab = u.kit[k];
    if (!ab || !u.ranks[k] || !canCast(u)) return false;
    aim = { ...aim };
    if (u.recast[k] > this.t && kab.recast) {
      if (kab.recast(this, u, aim)) { u.recast[k] = 0; this.afterCast(u, k, true); return true; }
    }
    if ((u.cds[k] || 0) > 0 || !this.costOk(u, k)) return false;
    // validar objetivo
    const range = kab.range || ab.range || 0;
    if (kab.t === 'unit') {
      const t = aim.unit;
      if (!t || !t.alive || t.team === u.team || t.untargetable || t.structure || (kab.champs && t.kind !== 'champ') || dist(u, t) > range + t.r + u.r + 20 || !this.isVisibleTo(u.team, t)) return false;
    }
    if (kab.t === 'ally') {
      let t = aim.unit; if (!t || t.team !== u.team || !t.alive || t.kind !== 'champ' || dist(u, t) > range + t.r) t = u; aim.unit = t;
    }
    if (aim.x == null) { aim.x = u.x + 1; aim.y = u.y; }
    if (Math.abs(aim.x - u.x) < 1 && Math.abs(aim.y - u.y) < 1) aim.x += 1;
    const v = abilityValue(u, ab);
    const cost = this.costOf(u, k);
    const ok = kab.cast(this, u, aim, v, ab);
    if (!ok) return false;
    if (u.resType === 'hp') { const c = u.kit.hpCost(u); u.hp = Math.max(1, u.hp - c); } else if (cost) u.res -= cost;
    const cdBase = ab.cooldown[u.ranks[k] - 1];
    u.cds[k] = effectiveCd(cdBase, u.st.ah);
    this.afterCast(u, k, false);
    this.emit('cast', { u, k, name: ab.name });
    return true;
  }
  afterCast(u, k) {
    if (u.kit.onCast) u.kit.onCast(this, u, k);
    if (u.items.some(i => i.id === 'hacha_de_colmillo')) addBuff(u, 'hacha', 6);
    if (u.channel && u.channel.recall) u.channel = null;
    removeBuff(u, 'velo'); u.lastCast = this.t;
  }
  cmdSummoner(u, slot, aim) {
    const id = u.summoners[slot]; if (!id || !u.alive) return false;
    const recasting = id === 'snowball' && u.recast.snow > this.t;
    if (id === 'smite') { if (u.smiteCharges <= 0) return false; }
    else if (u.sumCd[slot] > 0 && !recasting) return false;
    if (id !== 'flash' && !canCast(u)) return false;
    if (id === 'flash' && (hasCC(u, 'stun') || hasCC(u, 'airborne') || hasCC(u, 'root') || hasCC(u, 'sleep'))) return false;
    const r = castSummoner(this, u, id, { ...aim });
    if (!r) return false;
    if (id === 'smite') { u.smiteCharges--; if (u.sumCd[slot] <= 0) u.sumCd[slot] = SUMMONERS.smite.cd; }
    else if (r !== 'recast') u.sumCd[slot] = SUMMONERS[id].cd;
    this.emit('cast', { u, k: 'S' + slot, name: SUMMONERS[id].name });
    return true;
  }
  cmdRecall(u) {
    if (!u.alive || u.channel) return false;
    u.moveTo = null; u.target = null;
    u.channel = { t: 8, every: 99, acc: 0, recall: true, fn() {}, onEnd: () => { const b = this.base(u.team); u.x = b.x; u.y = b.y; this.emit('recall', { u }); } };
    return true;
  }
  cmdWard(u, x, y) {
    if (!u.alive || u.wardCharges <= 0 || Math.hypot(x - u.x, y - u.y) > 600) return false;
    u.wardCharges--; if (!u.wardRecharge) u.wardRecharge = 120;
    const w = this.makeUnit('ward', u.team, ...this.clampToMap(x, y), { r: 20, name: 'Guardián', life: 90, owner: u, base: { maxHp: 3, ad: 0, armor: 0, mr: 0, as: 0, range: 0, ms: 0 } });
    u.stats.wards++; return w;
  }
  buy(u, id) {
    const it = ITEM_BY_ID[id];
    if (!it || u.items.length >= 6 || u.gold < it.cost) return false;
    if (u.alive && !this.inFountain(u)) return false;
    u.gold -= it.cost; u.items.push(it); recalcStats(this, u); this.emit('buy', { u, it }); return true;
  }
  sell(u, idx) {
    const it = u.items[idx]; if (!it || (u.alive && !this.inFountain(u))) return false;
    u.items.splice(idx, 1); u.gold += Math.round(it.cost * 0.7); recalcStats(this, u); return true;
  }
  spawnPet(owner, x, y, o) {
    const p = this.makeUnit('pet', owner.team, x, y, { r: 35, owner, name: o.name, life: o.life, petDmg: o.dmg,
      base: { maxHp: o.hp, ad: o.dmg, armor: 20, mr: 20, as: 1, range: o.range, ms: 0 } });
    return p;
  }

  // ---------------- muerte y recompensas ----------------
  kill(v, killer) {
    if (!v.alive) return;
    if (v.kind === 'champ') {
      const rn = getBuff(v, 'renacer');
      if (rn && !v.p.revived) { v.p.revived = true; v.hp = 0.2 * v.st.maxHp; removeBuff(v, 'renacer'); this.emit('text', { x: v.x, y: v.y, txt: '¡Renace!', col: '#a5d6a7' }); return; }
    }
    v.alive = false; v.hp = 0; v.channel = null; v.dash = null; v.target = null; v.moveTo = null;
    if (killer && killer.kind === 'pet') killer = killer.owner;
    for (const c of this.champs) if (c.kit.onUnitDeath && c.alive) c.kit.onUnitDeath(this, c, v);
    const nearAllies = (team, r = 1600) => this.champs.filter(c => c.alive && c.team === team && dist(c, v) < r);
    if (v.kind === 'champ') return this.onChampDeath(v, killer);
    if (v.kind === 'minion') {
      if (killer && killer.kind === 'champ') { this.giveGold(killer, v.gold, true); killer.stats.cs++; }
      const xs = nearAllies(1 - v.team); xs.forEach(c => this.addXp(c, v.xp * (1 + 0.15 * (xs.length - 1)) / xs.length));
    }
    if (v.kind === 'monster') {
      const k = killer && killer.kind === 'champ' ? killer : null;
      if (k) {
        this.giveGold(k, v.gold, true); k.stats.cs += v.big ? 4 : 1; this.addXp(k, v.xp);
        if (v.camp && v.big && v.camp.type === 'golem') addBuff(k, 'golem_buff', 120, { stats: { ah: 10 }, manaRegen: 5 });
        if (v.camp && v.big && v.camp.type === 'bestia') addBuff(k, 'bestia_buff', 120, {});
        if (v.epicType) this.onEpicKilled(v, k);
      } else if (v.epicType) this.onEpicKilled(v, null);
    }
    if (v.structure) this.onStructureDeath(v, killer);
    if (v.kind === 'pet' || v.kind === 'ward') this.units = this.units.filter(x => x !== v);
  }
  onChampDeath(v, killer) {
    v.stats.d++; v.respawnAt = this.t + respawnTime(v.level, this.minutes());
    let k = killer && killer.kind === 'champ' && killer.team !== v.team ? killer : null;
    if (!k) { const ids = Object.entries(v.dmgBy).filter(([id, t]) => this.t - t < 10).sort((a, b) => b[1] - a[1]);
      k = ids.length ? this.champs.find(c => c.id === +ids[0][0] && c.team !== v.team) : null; }
    const assists = this.champs.filter(c => c !== k && c.team !== v.team && ((v.dmgBy[c.id] && this.t - v.dmgBy[c.id] < 10) || (dist(c, v) < 1600 && c.alive)));
    const bounty = Math.min(1000, 300 + 100 * Math.max(0, v.streak - 1));
    v.streak = 0; v.dmgBy = {};
    const team = 1 - v.team; this.kills[team]++;
    if (k) {
      k.stats.k++; k.streak++;
      this.giveGold(k, bounty + (this.firstBlood ? 0 : 100), true);
      if (!this.firstBlood) { this.firstBlood = true; this.emit('announce', { txt: `¡Primera sangre! ${k.name} elimina a ${v.name}`, team }); }
      if (k.kit.onTakedown) k.kit.onTakedown(this, k, v);
    }
    for (const a of assists) { a.stats.a++; this.giveGold(a, bounty * 0.5 / Math.max(1, assists.length)); if (a.kit.onTakedown) a.kit.onTakedown(this, a, v); }
    const xs = this.champs.filter(c => c.alive && c.team === team && dist(c, v) < 1600);
    xs.forEach(c => this.addXp(c, (140 + 20 * v.level) * (1 + 0.15 * (xs.length - 1)) / xs.length));
    this.feed.push({ t: this.t, killer: k ? k.name : 'Ejecutado', victim: v.name, team, kTeam: k ? k.team : team });
    this.emit('kill', { killer: k, victim: v, team });
  }
  onStructureDeath(s, killer) {
    const team = 1 - s.team;
    if (s.kind === 'tower') {
      this.towersDown[team]++;
      for (const c of this.champs) if (c.team === team) this.giveGold(c, 50);
      if (killer && killer.kind === 'champ') this.giveGold(killer, 150, true);
      this.emit('announce', { txt: `Torre ${s.team === 0 ? 'de Aurora' : 'de Crepúsculo'} destruida`, team });
    }
    if (s.kind === 'inhib') { s.respawnAt = this.t + 300; this.emit('announce', { txt: '¡Inhibidor destruido! Súper-súbditos en camino', team }); }
    if (s.kind === 'nexus') this.endGame(team);
  }
  endGame(winner) { if (this.over) return; this.over = true; this.winner = winner; this.emit('announce', { txt: `¡VICTORIA de ${winner === 0 ? 'Aurora' : 'Crepúsculo'}!`, team: winner }); }

  // ---------------- objetivos épicos ----------------
  spawnEpic(kind) {
    const m = this.map.epic; let o;
    if (kind === 'dragon') { const type = DRAGON_TYPES[Math.floor(this.rand() * 4)];
      o = this.makeUnit('monster', NEUTRAL, ...m.dragon, { r: 110, name: `Dragón de ${type}`, epicType: 'dragon', dragonType: type, home: { x: m.dragon[0], y: m.dragon[1] }, gold: 0, xp: 300,
        base: { maxHp: 3500 + 200 * this.minutes(), ad: 90 + 3 * this.minutes(), armor: 30, mr: 30, as: 0.5, range: 450, ms: 0 } }); }
    if (kind === 'herald') o = this.makeUnit('monster', NEUTRAL, ...m.herald, { r: 110, name: 'Heraldo de Forja', epicType: 'herald', home: { x: m.herald[0], y: m.herald[1] }, gold: 0, xp: 400,
        base: { maxHp: 5000, ad: 95, armor: 40, mr: 40, as: 0.6, range: 250, ms: 0 } });
    if (kind === 'lord') o = this.makeUnit('monster', NEUTRAL, ...m.lord, { r: 130, name: 'Señor de la Ceniza', epicType: 'lord', home: { x: m.lord[0], y: m.lord[1] }, gold: 0, xp: 800,
        base: { maxHp: 9000 + 150 * (this.minutes() - 20), ad: 160, armor: 70, mr: 70, as: 0.6, range: 450, ms: 0 } });
    if (kind === 'avatar') o = this.makeUnit('monster', NEUTRAL, ...m.avatar, { r: 110, name: 'Avatar del Eclipse', epicType: 'avatar', home: { x: m.avatar[0], y: m.avatar[1] }, gold: 0, xp: 300,
        base: { maxHp: 4000, ad: 110, armor: 40, mr: 40, as: 0.6, range: 350, ms: 0 } });
    this.epic[kind] = o; this.emit('announce', { txt: `Ha aparecido: ${o.name}`, team: 2 }); return o;
  }
  onEpicKilled(v, k) {
    const team = k ? k.team : (Object.entries(v.dmgBy).sort((a, b) => b[1] - a[1])[0] ? this.champs.find(c => c.id === +Object.entries(v.dmgBy).sort((a, b) => b[1] - a[1])[0][0]).team : null);
    if (team == null) return;
    const mates = this.champs.filter(c => c.team === team);
    if (v.epicType === 'dragon') {
      this.dragons[team].push(v.dragonType); mates.forEach(c => this.giveGold(c, 75)); this.addTerrain(v.dragonType);
      this.epicNext.dragon = this.t + 300; this.emit('announce', { txt: `${team ? 'Crepúsculo' : 'Aurora'} mata al ${v.name}${this.dragons[team].length === 4 ? ' — ¡ALMA DE DRAGÓN!' : ''}`, team });
    }
    if (v.epicType === 'herald') {
      mates.forEach(c => this.giveGold(c, 200)); this.epicNext.herald = 1e9;
      const lane = this.map.lanes[team].mid; const start = lane.reduce((b, p) => (Math.hypot(p[0] - v.x, p[1] - v.y) < Math.hypot(b[0] - v.x, b[1] - v.y) ? p : b));
      this.spawnMinion(team, 'mid', 'ram', start); this.emit('announce', { txt: '¡El ariete del Heraldo avanza por el centro!', team });
    }
    if (v.epicType === 'lord') { mates.forEach(c => this.giveGold(c, 300)); this.lordUntil[team] = this.t + 180; this.epicNext.lord = this.t + 360; this.emit('announce', { txt: `${team ? 'Crepúsculo' : 'Aurora'} obtiene la mejora del Señor de la Ceniza`, team }); }
    if (v.epicType === 'avatar') { this.avatarUntil[team] = this.t + 30; this.epicNext.avatar = this.t + 240; this.emit('announce', { txt: '¡Puntos dobles durante 30 s!', team }); }
    this.epic[v.epicType] = null; this.recalcTeamBonus();
  }
  addTerrain(type) {
    const n = this.dragons[0].length + this.dragons[1].length, W = this.map.W, H = this.map.H;
    const spots = [[6200, 6200], [7800, 7800], [5400, 7000], [8600, 7000]], [x, y] = spots[(n - 1) % 4];
    if (type === 'Ceniza' || type === 'Raíz') { this.brushes.push({ x, y, r: 230 }, { x: W - x, y: H - y, r: 230 }); }
    if (type === 'Forja') { this.obstacles.push({ x, y, r: 160, perm: true }, { x: W - x, y: H - y, r: 160, perm: true }); }
    if (type === 'Marea') { for (const [a, b] of [[x, y], [W - x, H - y]]) spawnZone(this, { x: a, y: b, r: 260, team: -1, t: 1e9, kind: 'tide', col: '#4fc3f7' }); }
  }

  // ---------------- súbditos ----------------
  spawnWave() {
    this.wave++;
    const k = Math.floor(this.t / 90);
    for (const team of [0, 1]) for (const lane of Object.keys(this.map.lanes[team])) {
      const enemyInhib = this.units.find(u => u.kind === 'inhib' && u.team !== team && u.lane === lane);
      const sup = enemyInhib && !enemyInhib.alive;
      const types = ['melee', 'melee', 'melee', ...(this.wave % 3 === 0 ? ['siege'] : []), ...(sup ? ['super'] : []), 'caster', 'caster', 'caster'];
      types.forEach((ty, i) => this.after(i * 0.7, () => this.spawnMinion(team, lane, ty, null, k)));
    }
  }
  spawnMinion(team, lane, type, start, k = Math.floor(this.t / 90)) {
    const path = this.map.lanes[team][lane]; const [sx, sy] = start || path[0];
    const S = { melee: [480 + 22 * k, 12 + 1.5 * k, 110, 21, 60, 0], caster: [296 + 10 * k, 24 + 1.5 * k, 550, 14, 30, 0], siege: [900 + 40 * k, 40 + 3 * k, 300, 60 + 2 * k, 90, 10],
      super: [1600 + 100 * k, 80 + 5 * k, 170, 60, 100, 30], ram: [3000, 0, 150, 0, 0, 60] }[type];
    const lord = this.t < this.lordUntil[team] ? 1.5 : 1;
    const m = this.makeUnit('minion', team, sx, sy, { r: type === 'ram' ? 70 : type === 'super' || type === 'siege' ? 45 : 32, mtype: type, lane, path, wp: start ? path.findIndex(p => p[0] === sx && p[1] === sy) + 1 : 1,
      name: { melee: 'Súbdito', caster: 'Súbdito mago', siege: 'Súbdito de asedio', super: 'Súper-súbdito', ram: 'Ariete' }[type], gold: S[3], xp: S[4],
      base: { maxHp: S[0] * lord, ad: S[1] * lord, armor: S[5], mr: S[5], as: type === 'caster' ? 0.67 : 1.0, range: S[2], ms: type === 'ram' ? 300 : 325 } });
    if (type === 'ram') m.ram = true;
    return m;
  }

  // ---------------- visión ----------------
  isVisibleTo(team, u) { if (u.team === team || u.structure) return true; return this.visible[team].has(u.id); }
  inBrush(u) { return this.brushes.find(b => Math.hypot(u.x - b.x, u.y - b.y) < b.r); }
  updateVision() {
    for (const team of [0, 1]) {
      const src = this.units.filter(u => u.alive && u.team === team && u.kind !== 'inhib');
      const vis = new Set();
      for (const u of this.units) {
        if (!u.alive || u.team === team || u.structure) continue;
        const br = this.inBrush(u); const stealth = u.buffs.some(b => b.stealth);
        for (const s of src) {
          let r = s.kind === 'champ' ? (hasCC(s, 'nearsight') ? 300 : 1350) : s.kind === 'minion' ? 1100 : s.kind === 'ward' ? 900 : s.kind === 'pet' ? 600 : 1350;
          if (s.kind === 'nexus') r = 1500;
          const d = dist(s, u); if (d > r) continue;
          if (stealth && d > 220) continue;
          if (br && (s.kind !== 'ward' || Math.hypot(s.x - br.x, s.y - br.y) > br.r) && this.inBrush(s) !== br) continue;
          vis.add(u.id); break;
        }
      }
      for (const c of src) if (c.kind === 'champ' && c.kit.extraVision) for (const e of c.kit.extraVision(this, c)) vis.add(e.id);
      // los atacantes se revelan durante un instante
      for (const u of this.units) if (u.alive && u.team !== team && u.lastRevealed && this.t - u.lastRevealed < 1 && !u.buffs.some(b => b.stealth)) vis.add(u.id);
      this.visible[team] = vis;
    }
  }

  // ---------------- bucle principal ----------------
  step() {
    if (this.over) return;
    const g = this; g.t += TICK;
    // temporizadores
    if (this.timers.length) { const due = this.timers.filter(x => x.at <= g.t); this.timers = this.timers.filter(x => x.at > g.t); due.forEach(x => x.fn()); }
    if (g.t >= this.nextWave) { this.spawnWave(); this.nextWave += 30; }
    this.secTimer += TICK;
    if (this.secTimer >= 1) { this.secTimer -= 1; this.everySecond(); }
    this.visTimer += TICK; if (this.visTimer >= 0.1) { this.visTimer = 0; this.updateVision(); }
    this.aiTimer += TICK;
    const think = this.aiTimer >= 0.25; if (think) this.aiTimer = 0;
    for (const u of this.units) this.updateUnit(u, think);
    for (const c of this.champs) { c.vx = (c.x - (c.ox ?? c.x)) / TICK; c.vy = (c.y - (c.oy ?? c.y)) / TICK; c.ox = c.x; c.oy = c.y; }
    for (const p of this.projectiles) updateProjectile(this, p);
    this.projectiles = this.projectiles.filter(p => p.alive);
    for (const z of this.zones) {
      if (z.follow) { z.x = z.follow.x; z.y = z.follow.y; if (!z.follow.alive) z.alive = false; }
      if (z.alive) updateZone(this, z);
    }
    this.zones = this.zones.filter(z => z.alive);
    for (const f of this.fx) f.age += TICK; this.fx = this.fx.filter(f => f.age < f.t);
    this.updateDominion();
    this.units = this.units.filter(u => u.alive || u.kind === 'champ' || u.structure || u.kind === 'monster' && u.camp);
  }
  everySecond() {
    const g = this, m = this.minutes();
    if (g.t >= 65) for (const c of this.champs) this.giveGold(c, 2.04);
    // campamentos
    for (const c of this.camps) {
      if (c.units.length && c.units.every(u => !u.alive)) { c.units = []; c.next = g.t + (c.type === 'golem' || c.type === 'bestia' ? 300 : 135); this.units = this.units.filter(u => u.alive || u.camp !== c); }
      if (!c.units.length && g.t >= c.next) this.spawnCamp(c);
    }
    // épicos
    const e = this.map.epic; this.epicNext = this.epicNext || { dragon: 300, herald: 480, lord: 1200, avatar: 600 };
    if (e.dragon && !this.epic.dragon && g.t >= this.epicNext.dragon) this.spawnEpic('dragon');
    if (e.herald && !this.epic.herald && g.t >= this.epicNext.herald && g.t < 1185 && !(this.epic.lord)) this.spawnEpic('herald');
    if (e.herald && this.epic.herald && g.t >= 1185) { this.epic.herald.alive = false; this.epic.herald = null; }
    if (e.lord && !this.epic.lord && g.t >= this.epicNext.lord && !this.epic.herald) this.spawnEpic('lord');
    if (e.avatar && !this.epic.avatar && g.t >= this.epicNext.avatar) this.spawnEpic('avatar');
    // inhibidores reaparecen
    for (const s of this.units) if (s.kind === 'inhib' && !s.alive && s.respawnAt && g.t >= s.respawnAt) { s.alive = true; s.hp = s.st.maxHp; s.respawnAt = 0; }
    // reliquias (ARAM)
    for (const r of this.relics) if (r.next && g.t >= r.next) { r.up = true; r.next = 0; }
    // marea
    for (const team of [0, 1]) { const mr = this.teamBonus[team].marea; if (mr && Math.floor(g.t) % 5 === 0) for (const c of this.champs) if (c.alive && c.team === team) heal(this, null, c, (c.st.maxHp - c.hp) * 0.03 * mr); }
    this.recalcTeamBonus();
    if (Math.floor(g.t) % 60 === 0) for (const t of [0, 1]) this.goldHistory[t].push(Math.round(this.champs.filter(c => c.team === t).reduce((s, c) => s + c.stats.gold, 0)));
  }
  updateDominion() {
    if (!this.altars.length) return;
    for (const a of this.altars) {
      const near = [0, 1].map(t => this.champs.filter(c => c.alive && c.team === t && Math.hypot(c.x - a.x, c.y - a.y) < 300).length);
      const who = near[0] && !near[1] ? 0 : near[1] && !near[0] ? 1 : null;
      if (who != null && a.owner !== who) { if (a.by !== who) { a.by = who; a.prog = 0; } a.prog += TICK; if (a.prog >= 6) { a.owner = who; a.prog = 0; this.emit('announce', { txt: `${who ? 'Crepúsculo' : 'Aurora'} captura el altar ${a.name}`, team: who }); this.recalcTeamBonus(); } }
      else if (who == null && !near[0] && !near[1]) a.prog = Math.max(0, a.prog - TICK);
    }
    this.domAcc = (this.domAcc || 0) + TICK;
    if (this.domAcc >= 2.5) {
      this.domAcc -= 2.5;
      for (const t of [0, 1]) { const n = this.altars.filter(a => a.owner === t).length; this.points[t] += n * (this.t < this.avatarUntil[t] ? 2 : 1); }
      const w = this.rules.winPoints;
      if (this.points[0] >= w || this.points[1] >= w) {
        if (this.points[0] === this.points[1]) this.endGame(this.altars.filter(a => a.owner === 0).length >= 2 ? 0 : 1);
        else this.endGame(this.points[0] > this.points[1] ? 0 : 1);
      }
    }
  }

  updateUnit(u, think) {
    const g = this;
    if (!u.alive) {
      if (u.kind === 'champ' && g.t >= u.respawnAt) this.respawn(u);
      else if (u.kind === 'champ' && think && !u.isPlayer) botThink(this, u);
      return;
    }
    recalcStats(this, u);
    // buffs
    for (const b of u.buffs) { b.t -= TICK; if (b.onTick) b.onTick(this, u, b); }
    const ended = u.buffs.filter(b => b.t <= 0); if (ended.length) { u.buffs = u.buffs.filter(b => b.t > 0); ended.forEach(b => b.onEnd && b.onEnd(this, u, b)); }
    for (const c of u.cc) c.t -= TICK; if (u.cc.length) u.cc = u.cc.filter(c => c.t > 0);
    if (!u.alive) return;
    if (u.kind === 'ward' || u.kind === 'pet') { u.life -= TICK; if (u.life <= 0) return this.kill(u, null); }
    if (u.kind === 'champ') this.updateChampion(u, think);
    else if (u.kind === 'minion') { if (think) this.minionThink(u); }
    else if (u.kind === 'tower') { if (think) this.towerThink(u); }
    else if (u.kind === 'monster') { if (think) this.monsterThink(u); }
    else if (u.kind === 'pet') { if (think) { const t = this.nearestEnemy(u, u.st.range + 50); u.target = t; } }
    else if (u.structure) return;
    // canalización
    if (u.channel) {
      const ch = u.channel; ch.t -= TICK; ch.acc += TICK;
      while (ch.acc >= ch.every) { ch.acc -= ch.every; ch.fn && ch.fn(); if (!u.channel) break; }
      if (u.channel && ch.t <= 0) { u.channel = null; ch.onEnd && ch.onEnd(); }
      return;
    }
    // desplazamientos
    if (u.dash) return this.updateDash(u);
    // CC de movimiento forzado
    const taunt = u.cc.find(c => c.kind === 'taunt'), fear = u.cc.find(c => c.kind === 'fear');
    if (fear && fear.src) { const [dx, dy] = norm(u.x - fear.src.x, u.y - fear.src.y); this.moveStep(u, u.x + dx * 100, u.y + dy * 100); return; }
    if (taunt && taunt.src && taunt.src.alive) { u.target = taunt.src; u.moveTo = null; }
    if (!canMove(u) && !canAttack(u)) return;
    this.updateCombatMovement(u);
  }
  updateChampion(u, think) {
    const g = this;
    for (const k in u.cds) if (u.cds[k] > 0) u.cds[k] -= TICK;
    for (let i = 0; i < 2; i++) if (u.sumCd[i] > 0) { u.sumCd[i] -= TICK; if (u.summoners[i] === 'smite' && u.sumCd[i] <= 0 && u.smiteCharges < 2) { u.smiteCharges++; if (u.smiteCharges < 2) u.sumCd[i] = 15; } }
    if (u.wardRecharge > 0) { u.wardRecharge -= TICK; if (u.wardRecharge <= 0) { u.wardCharges = Math.min(2, u.wardCharges + 1); u.wardRecharge = u.wardCharges < 2 ? 120 : 0; } }
    // regeneración
    const fountain = this.inFountain(u);
    const regen = u.st.regen + (fountain && this.rules.fountainHeal !== false ? 0.08 * u.st.maxHp : 0) +
      (u.items.some(i => i.id === 'manto_onirico') && g.t - u.lastDamaged > 5 ? 0.02 * u.st.maxHp : 0);
    u.hp = Math.min(u.st.maxHp, u.hp + regen * TICK);
    if (u.resType === 'mana') u.res = Math.min(u.resMax, u.res + (1.5 + 0.15 * u.level + (hasBuff(u, 'golem_buff') ? 5 : 0) + (fountain ? 0.08 * u.resMax : 0)) * TICK);
    if (u.resType === 'energy') u.res = Math.min(u.resMax, u.res + 10 * TICK);
    if (u.resType === 'fury' && g.t - u.lastCombat > 3) u.res = Math.max(0, u.res - 5 * TICK);
    if (u.resType === 'fury') u.st.dmgOut += 0.1 * u.res / 100;
    // láser de la fuente enemiga
    const ef = this.base(1 - u.team); if (dist(u, ef) < 900 && Math.floor(g.t * 2) !== Math.floor((g.t - TICK) * 2)) dealDamage(this, null, u, 500, 'true');
    // reliquias
    for (const r of this.relics) if (r.up && Math.hypot(u.x - r.x, u.y - r.y) < 90) { r.up = false; r.next = g.t + 60; heal(this, null, u, 90 + 6 * u.level); u.res = Math.min(u.resMax, u.res + 50); }
    if (u.kit.tick) u.kit.tick(this, u);
    u.untargetable = hasBuff(u, 'fase');
    if (u.channel && u.channel.recall && g.t - u.lastDamaged < TICK * 1.5) u.channel = null;
    if (think && !u.isPlayer) botThink(this, u);
    // movimiento con ataque del jugador
    if (u.isPlayer && u.attackMove && u.moveTo && think) { const t = this.nearestEnemy(u, Math.max(u.st.range + 150, 500)); if (t) { u.target = t; u.moveTo = null; u.attackMove = false; } }
  }
  respawn(u) {
    const b = this.base(u.team); u.alive = true; u.x = b.x + (this.rand() - 0.5) * 200; u.y = b.y + (this.rand() - 0.5) * 200;
    recalcStats(this, u); u.hp = u.st.maxHp; u.res = u.resType === 'fury' ? 0 : u.resMax; u.cc = []; u.buffs = u.buffs.filter(b => b.t > 1e8);
    u.moveTo = null; u.target = null; u.dash = null; u.channel = null; u.p.revived = false;
    this.emit('respawn', { u });
  }
  nearestEnemy(u, r, filter) {
    let best = null, bd = r * r;
    for (const e of this.units) {
      if (!e.alive || e.team === u.team || e.untargetable || e.kind === 'ward' && !this.isVisibleTo(u.team, e)) continue;
      if (e.team === NEUTRAL && u.kind !== 'champ') continue;
      if (e.structure && !this.isStructureTargetable(e)) continue;
      if (u.team !== NEUTRAL && !this.isVisibleTo(u.team, e)) continue;
      if (filter && !filter(e)) continue;
      const d = dist2(u, e) - e.r * e.r; if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  minionThink(m) {
    if (m.ram) { const t = this.units.filter(s => s.alive && s.kind === 'tower' && s.team !== m.team && this.isStructureTargetable(s)).sort((a, b) => dist(a, m) - dist(b, m))[0];
      m.target = t || null; if (t && dist(m, t) < t.r + m.r + 30) { dealDamage(this, m, t, 2000, 'true'); this.kill(m, null); } return; }
    const t = m.target;
    const valid = t && t.alive && t.team !== m.team && t.team !== NEUTRAL && dist(m, t) < 900 && this.isVisibleTo(m.team, t) && !t.untargetable;
    // prioridad: campeón que ataca a un campeón aliado
    const aggro = this.champs.find(c => c.alive && c.team !== m.team && c.aggroChamp && this.t - c.aggroChamp.t < 2 && c.aggroChamp.victim.team === m.team && dist(c, m) < 700 && this.isVisibleTo(m.team, c));
    if (aggro) { m.target = aggro; return; }
    if (valid && t.kind !== 'champ') return;
    // prioridad: súbditos/mascotas > estructuras > campeones
    m.target = this.nearestEnemy(m, 700, e => e.kind === 'minion' || e.kind === 'pet')
      || this.nearestEnemy(m, 700, e => e.structure)
      || (valid ? t : this.nearestEnemy(m, 600, e => e.kind === 'champ')) || null;
  }
  towerThink(t) {
    if (!t.alive) return;
    const inR = e => e.alive && dist(t, e) <= t.st.range + e.r && e.team !== t.team && e.team !== NEUTRAL && !e.untargetable && e.kind !== 'ward' && this.isVisibleTo(t.team, e);
    const aggro = this.champs.find(c => inR(c) && c.aggroChamp && this.t - c.aggroChamp.t < 2 && c.aggroChamp.victim.team === t.team);
    if (aggro) { t.target = aggro; return; }
    if (t.target && inR(t.target)) return;
    const cands = this.units.filter(e => inR(e) && (e.kind === 'minion' || e.kind === 'pet'));
    t.target = cands.sort((a, b) => dist(a, t) - dist(b, t))[0] || this.champs.filter(inR).sort((a, b) => dist(a, t) - dist(b, t))[0] || null;
  }
  monsterThink(m) {
    const h = m.home;
    if (m.aggro && (!m.aggro.alive || dist(m.aggro, h) > 900 || dist(m, h) > 1100)) { m.aggro = null; m.target = null; m.leashing = true; }
    if (m.leashing) { m.moveTo = { x: h.x, y: h.y }; if (dist(m, h) < 60) { m.leashing = false; m.hp = m.st.maxHp; m.moveTo = null; } return; }
    if (m.aggro) { m.target = m.aggro; return; }
    if (m.camp) { for (const o of m.camp.units) if (o.aggro && o !== m && o.alive) { m.aggro = o.aggro; m.target = o.aggro; } }
  }
  updateCombatMovement(u) {
    const t = u.target;
    if (t && (!t.alive || t.untargetable || (t.structure && !this.isStructureTargetable(t)) || (u.team !== NEUTRAL && !this.isVisibleTo(u.team, t) && t.kind !== 'monster'))) { u.target = null; u.windup = null; }
    if (u.attackCd > 0) u.attackCd -= TICK;
    if (u.target) {
      const t = u.target, reach = u.st.range + u.r + t.r;
      if (dist(u, t) <= reach) {
        if (u.windup) { u.windup.t -= TICK; if (u.windup.t <= 0) { const tt = u.windup.target; u.windup = null; if (tt.alive && canAttack(u)) this.performAttack(u, tt); } }
        else if (u.attackCd <= 0 && canAttack(u)) { const iv = 1 / Math.max(0.2, u.st.as); u.attackCd = iv; u.windup = { t: iv * 0.25, target: t }; }
        return;
      }
      u.windup = null;
      if (canMove(u) && u.st.ms > 0) this.moveStep(u, t.x, t.y);
      return;
    }
    if (u.kind === 'minion' && canMove(u)) {
      const wp = u.path[Math.min(u.wp, u.path.length - 1)];
      if (Math.hypot(u.x - wp[0], u.y - wp[1]) < 120 && u.wp < u.path.length - 1) u.wp++;
      this.moveStep(u, wp[0], wp[1]); return;
    }
    if (u.moveTo && canMove(u)) {
      this.moveStep(u, u.moveTo.x, u.moveTo.y);
      if (Math.hypot(u.x - u.moveTo.x, u.y - u.moveTo.y) < 8) u.moveTo = null;
    }
  }
  moveStep(u, tx, ty) {
    let step = u.st.ms * TICK; const d = Math.hypot(tx - u.x, ty - u.y); if (d < 1) return;
    if (step > d) step = d;
    let [dx, dy] = norm(tx - u.x, ty - u.y);
    let nx = u.x + dx * step, ny = u.y + dy * step;
    const flying = u.buffs.some(b => b.flying);
    if (!flying) for (const o of this.obstacles) {
      const od = Math.hypot(nx - o.x, ny - o.y), min = o.r + u.r * 0.6;
      if (od < min) { // deslizar por la tangente
        const [ox, oy] = norm(nx - o.x, ny - o.y); nx = o.x + ox * min; ny = o.y + oy * min;
        const tx2 = -oy, ty2 = ox, s = Math.sign(tx2 * dx + ty2 * dy) || 1; nx += tx2 * s * step * 0.5; ny += ty2 * s * step * 0.5;
      }
    }
    // criptas (R de Ossuar): nadie entra ni sale
    for (const z of this.zones) if (z.kind === 'crypt') {
      const was = Math.hypot(u.x - z.x, u.y - z.y) < z.r, will = Math.hypot(nx - z.x, ny - z.y) < z.r;
      if (was !== will) return;
    }
    // separación ligera entre unidades móviles
    if (u.kind === 'minion' || u.kind === 'champ') for (const o of this.units) {
      if (o === u || !o.alive || (o.kind !== 'minion' && o.kind !== 'monster') || o.team !== u.team) continue;
      const od = Math.hypot(nx - o.x, ny - o.y), min = (o.r + u.r) * 0.7;
      if (od < min && od > 0.01) { nx += (nx - o.x) / od * (min - od) * 0.3; ny += (ny - o.y) / od * (min - od) * 0.3; }
    }
    [u.x, u.y] = this.clampToMap(nx, ny);
  }
  updateDash(u) {
    const d = u.dash; const step = d.speed * TICK, dd = Math.hypot(d.tx - u.x, d.ty - u.y);
    const ox = u.x, oy = u.y;
    if (dd <= step) { u.x = d.tx; u.y = d.ty; } else { const [dx, dy] = norm(d.tx - u.x, d.ty - u.y); u.x += dx * step; u.y += dy * step; }
    for (const z of this.zones) if (z.kind === 'crypt' && !d.forced) {
      const was = Math.hypot(ox - z.x, oy - z.y) < z.r, will = Math.hypot(u.x - z.x, u.y - z.y) < z.r;
      if (was !== will) { u.x = ox; u.y = oy; u.dash = null; d.onEnd && d.onEnd(this); return; }
    }
    if (d.onPass) for (const e of this.units) if (e.alive && e.team !== u.team && !e.structure && !e.untargetable && e.kind !== 'ward' && !d.hit.has(e.id) && segDist(e.x, e.y, ox, oy, u.x, u.y) < d.w / 2 + e.r) { d.hit.add(e.id); d.onPass(this, e); if (!u.dash) return; }
    if (dd <= step) { u.dash = null; this.unstick(u); d.onEnd && d.onEnd(this); }
  }
  performAttack(u, t) {
    u.lastRevealed = this.t; u.lastAtk = this.t;
    if (hasCC(u, 'blind')) { this.emit('text', { x: t.x, y: t.y, txt: 'Fallo', col: '#bbb' }); return; }
    const hit = { mult: 1, extra: [], after: [], crit: this.rand() < (u.st.crit || 0) };
    if (u.kit && u.kit.onAttack) u.kit.onAttack(this, u, t, hit);
    let dmg = u.st.ad * hit.mult * (hit.crit ? 1 + u.st.critDmg : 1);
    if (u.kind === 'pet') dmg = u.petDmg;
    if (u.kind === 'tower') {
      if (t.kind === 'champ') { if (u.rampTarget === t) u.ramp = Math.min(3, u.ramp + 1); else { u.rampTarget = t; u.ramp = 0; } dmg = (152 + 9 * this.minutes()) * (1 + 0.4 * u.ramp); }
      else if (t.kind === 'minion') dmg = t.st.maxHp * (t.mtype === 'siege' ? 0.14 : t.mtype === 'caster' ? 0.7 : t.mtype === 'super' ? 0.08 : 0.45);
      else dmg = 152 + 9 * this.minutes();
    }
    if (t.structure && u.kind === 'champ' && !this.units.some(m => m.alive && m.kind === 'minion' && m.team === u.team && dist(m, t) < 1000)) dmg *= 0.34;
    if (u.kind === 'minion' && t.kind === 'champ') dmg *= 0.5;
    if (hasBuff(u, 'hacha')) { hit.extra.push([u.st.baseAd, 'phys']); removeBuff(u, 'hacha'); }
    const corteza = getBuff(u, 'corteza'); if (corteza && corteza.rootNext && t.kind !== 'tower') { corteza.rootNext = false; hit.after.push(() => applyCC(this, t, 'root', 1)); }
    if (hasBuff(u, 'bestia_buff') && !t.structure) hit.after.push(() => { applyCC(this, t, 'slow', 1.5, { val: 0.1 }); addBuff(t, 'quemadura_roja', 3, { onTick: (g, x) => dealDamage(g, u, x, (10 + 2 * u.level) / 3 * TICK, 'true', { dot: true, noProc: true }) }); });
    if (u.items && u.items.some(i => i.id === 'arco_de_tormenta')) { u.p.arc = (u.p.arc || 0) + 1; if (u.p.arc % 3 === 0) hit.after.push(() => {
      for (const e of unitsInRadius(this, u.team, t.x, t.y, 500).slice(0, 3)) dealDamage(this, u, e, 60, 'magic', { noProc: true }); }); }
    if (t.kind === 'ward') { hit.ward = true; }
    const apply = () => {
      if (!t.alive) return;
      if (hit.ward) { t.hp -= 1; if (t.hp <= 0) this.kill(t, u); return; }
      dealDamage(this, u, t, dmg, 'phys', { attack: true, crit: hit.crit });
      for (const [a, ty] of hit.extra) dealDamage(this, u, t, a, ty, { noProc: true });
      hit.after.forEach(f => f());
    };
    if (u.st.range >= 300) spawnProjectile(this, { x: u.x, y: u.y, speed: u.kind === 'tower' ? 1400 : 2000, range: 3000, homing: true, target: t, team: u.team, src: u, w: 30,
      color: u.kind === 'tower' ? (u.team ? '#ef5350' : '#42a5f5') : '#fff', attack: true, onHit: apply });
    else apply();
  }
}
