// Render en canvas 2D: mapa, unidades, efectos, niebla de guerra, minimapa y HUD (ui-hud-controls.md).
import { hasCC, getBuff, hasBuff } from './core.js';
import { SUMMONERS } from './kits.js';

const CLASS_COL = { Tanque: '#8d6e63', Luchador: '#e57373', Mago: '#9575cd', Tirador: '#81c784', Asesino: '#546e7a', Soporte: '#4dd0e1' };
export const TEAM_COL = { normal: ['#42a5f5', '#ef5350'], colorblind: ['#42a5f5', '#ff9800'] };
const CC_ICON = { stun: '✦', root: '⛓', airborne: '↑', slow: '↓', silence: '∅', blind: '◌', taunt: '!', fear: '!', sleep: 'z', nearsight: '◐' };

export class Renderer {
  constructor(canvas, game, settings) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.g = game; this.s = settings;
    this.cam = { x: game.player ? game.player.x : game.map.W / 2, y: game.player ? game.player.y : game.map.H / 2, zoom: 1, locked: true };
    this.fog = document.createElement('canvas'); this.texts = []; this.lastEvent = 0; this.pings = []; this.clickFx = [];
    this.hudRects = []; this.mini = null; this.announce = []; this.feedSeen = 0;
    this.extraDraw = null; // extraDraw(ctx, k): gancho de touch.js (joystick y puntería) al final del HUD
    this.setDpr(1);
  }
  /** Relación de píxeles del lienzo HUD: el canvas mide W×dpr píxeles; el HUD dibuja en px CSS (this.W × this.H). main.js lo llama en cada resize. */
  setDpr(dpr) { this.dpr = dpr || 1; this.W = this.c.clientWidth || innerWidth; this.H = this.c.clientHeight || innerHeight; }
  setWorld3D(r3d) { this.r3d = r3d; }
  get scale() { return 0.42 * this.cam.zoom * (this.H / 900); }
  w2s(x, y) { if (this.r3d) return this.r3d.project(x, y); const s = this.scale; return [(x - this.cam.x) * s + this.W / 2, (y - this.cam.y) * s + this.H / 2]; }
  s2w(x, y) { if (this.r3d) return this.r3d.unproject(x, y); const s = this.scale; return [(x - this.W / 2) / s + this.cam.x, (y - this.H / 2) / s + this.cam.y]; }
  teamCol(team) { return team === 2 ? '#bcaaa4' : TEAM_COL[this.s.colorblind ? 'colorblind' : 'normal'][team]; }
  relCol(u) { const p = this.g.player; if (p && u === p) return '#66ff66'; return this.teamCol(u.team); }

  consumeEvents() {
    const g = this.g, p = g.player;
    for (const e of g.events) {
      if (e.t <= this.lastEvent) continue;
      if (e.type === 'dmg' && !e.dot && p && (e.src === p || e.tgt === p || (e.src && e.src.owner === p)) && e.amt >= 1)
        this.texts.push({ x: e.tgt.x + (Math.random() - 0.5) * 40, y: e.tgt.y - 60, txt: Math.round(e.amt) + (e.crit ? '!' : ''), col: e.tgt === p ? '#ff5252' : e.crit ? '#ffab00' : { phys: '#ffcc80', magic: '#b388ff', true: '#ffffff' }[e.dtype] || '#fff', age: 0, big: e.crit });
      if (e.type === 'heal' && p && e.tgt.team === p.team && e.amount > 20) this.texts.push({ x: e.tgt.x, y: e.tgt.y - 80, txt: '+' + Math.round(e.amount), col: '#69f0ae', age: 0 });
      if (e.type === 'text') this.texts.push({ x: e.x, y: e.y - 90, txt: e.txt, col: e.col, age: 0 });
      if (e.type === 'gold' && e.u === p) this.texts.push({ x: p.x + 40, y: p.y - 100, txt: '+' + Math.round(e.amt) + ' oro', col: '#ffd54f', age: 0 });
      if (e.type === 'announce') this.announce.push({ txt: e.txt, team: e.team, age: 0 });
      if (e.type === 'kill') this.announce.push({ txt: `${e.killer ? e.killer.name : 'Ejecución'} ⚔ ${e.victim.name}`, team: e.team, age: 0, small: true });
      if (e.type === 'levelup' && e.u === p) this.texts.push({ x: p.x, y: p.y - 120, txt: `¡Nivel ${p.level}!`, col: '#fff59d', age: 0, big: true });
    }
    this.lastEvent = g.t;
  }

  draw(dt, hover) {
    const { ctx, g } = this; const p = g.player;
    if (p && (this.cam.locked || this.centerHeld) && (p.alive || this.centerHeld)) { this.cam.x = p.x; this.cam.y = p.y; }
    this.consumeEvents();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.r3d) { const team = p ? p.team : 0; this.r3d.render(dt, this.cam, team, hover); ctx.clearRect(0, 0, this.W, this.H); this.drawOverlay3D(dt, team, hover); this.drawHUD(hover); return; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
    const s = this.scale; ctx.save(); ctx.translate(this.W / 2, this.H / 2); ctx.scale(s, s); ctx.translate(-this.cam.x, -this.cam.y);
    this.drawMap(ctx);
    this.drawZones(ctx);
    const team = p ? p.team : 0;
    const visible = u => g.isVisibleTo(team, u) || u.team === team;
    // estructuras y unidades
    const us = g.units.filter(u => u.alive || (u.structure && !u.alive)).sort((a, b) => a.y - b.y);
    for (const u of us) { if (!u.structure && !visible(u)) continue; this.drawUnit(ctx, u, hover); }
    for (const pr of g.projectiles) { if (pr.src && pr.src.team !== team && !g.isVisibleTo(team, pr) && !this.nearVision(pr, team)) continue;
      ctx.fillStyle = pr.color; ctx.beginPath(); ctx.arc(pr.x, pr.y, Math.max(14, pr.w / 2), 0, 7); ctx.fill(); }
    this.drawFx(ctx);
    // marcadores de clic y señales
    for (const m of this.clickFx) { m.age += dt; ctx.strokeStyle = m.col; ctx.lineWidth = 6; ctx.globalAlpha = 1 - m.age / 0.5; ctx.beginPath(); ctx.arc(m.x, m.y, 30 + m.age * 80, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    this.clickFx = this.clickFx.filter(m => m.age < 0.5);
    for (const pg of this.pings) { pg.age += dt; ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 10; ctx.globalAlpha = Math.max(0, 1 - pg.age / 3); ctx.beginPath(); ctx.arc(pg.x, pg.y, 60 + (pg.age % 1) * 120, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
    this.pings = this.pings.filter(x => x.age < 3);
    // indicador de alcance
    if (this.rangeHint && p && p.alive) { ctx.strokeStyle = 'rgba(120,200,255,.6)'; ctx.lineWidth = 6; ctx.setLineDash([30, 20]); ctx.beginPath(); ctx.arc(p.x, p.y, this.rangeHint, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    // textos flotantes
    for (const t of this.texts) { t.age += dt; ctx.globalAlpha = Math.max(0, 1 - t.age / 1.1); ctx.fillStyle = t.col; ctx.font = `bold ${t.big ? 64 : 44}px sans-serif`; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.strokeText(t.txt, t.x, t.y - t.age * 120); ctx.fillText(t.txt, t.x, t.y - t.age * 120); ctx.globalAlpha = 1; }
    this.texts = this.texts.filter(t => t.age < 1.1).slice(-60);
    ctx.restore();
    this.drawFog(team);
    this.drawHUD(hover);
  }
  // capa 2D sobre la escena 3D: barras de vida, nombres, iconos de CC, textos y señales
  drawOverlay3D(dt, team, hover) {
    const { ctx, g } = this, r3 = this.r3d, p = g.player;
    for (const u of g.units) {
      if (!u.alive || u.kind === 'ward') continue;
      if (!(u.structure || u.team === team || g.isVisibleTo(team, u))) continue;
      const [x, y, ok] = r3.project(u.x, u.y, r3.headHeight(u)); if (!ok || x < -50 || y < -50 || x > this.W + 50 || y > this.H + 50) continue;
      const w = u.kind === 'champ' ? 90 : u.structure ? 110 : u.epicType ? 130 : u.kind === 'monster' && u.big ? 60 : 40, h = u.kind === 'champ' ? 9 : u.structure || u.epicType ? 8 : 4;
      this.hpBar2(u, x, y, w, h);
      ctx.textAlign = 'center';
      if (u.kind === 'champ') { ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#000'; ctx.fillText(`${u.level} · ${u.name}`, x + 1, y - 5); ctx.fillStyle = u === p ? '#b9f6ca' : '#fff'; ctx.fillText(`${u.level} · ${u.name}`, x, y - 6);
        const cc = u.cc.filter(c => c.kind !== 'slow')[0] || u.cc[0]; if (cc) { ctx.font = 'bold 18px sans-serif'; ctx.fillStyle = '#ffeb3b'; ctx.fillText(CC_ICON[cc.kind] || '!', x + w / 2 + 12, y + 8); }
        if (u.channel) { ctx.fillStyle = '#000a'; ctx.fillRect(x - 40, y + 26, 80, 5); ctx.fillStyle = u.channel.recall ? '#29b6f6' : '#fff'; ctx.fillRect(x - 40, y + 26, 80 * (1 - u.channel.t / (u.channel.recall ? 8 : 2)), 5); } }
      else if (u.epicType || (u.kind === 'monster' && u.big)) { ctx.font = `bold ${u.epicType ? 13 : 10}px sans-serif`; ctx.fillStyle = '#fff'; ctx.fillText(u.name, x, y - 4); }
      else if (u.structure && !g.isStructureTargetable(u)) { ctx.font = '14px sans-serif'; ctx.fillText('🛡', x, y - 6); }
      if (u.kind === 'tower' && p && p.alive && u.team !== team && Math.hypot(p.x - u.x, p.y - u.y) < 1300) this.groundRing(u.x, u.y, u.st.range, u.target === p ? '#ff1744' : '#ff8a80aa');
    }
    for (const t of this.texts) { t.age += dt; const [x, y] = this.r3d.project(t.x, t.y + 60, 2.2); ctx.globalAlpha = Math.max(0, 1 - t.age / 1.1); ctx.font = `bold ${t.big ? 22 : 15}px sans-serif`; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(t.txt, x, y - t.age * 40); ctx.fillStyle = t.col; ctx.fillText(t.txt, x, y - t.age * 40); ctx.globalAlpha = 1; }
    this.texts = this.texts.filter(t => t.age < 1.1).slice(-60);
    for (const m of this.clickFx) { m.age += dt; ctx.globalAlpha = 1 - m.age / 0.5; this.groundRing(m.x, m.y, 30 + m.age * 80, m.col); ctx.globalAlpha = 1; } this.clickFx = this.clickFx.filter(m => m.age < 0.5);
    for (const pg of this.pings) { pg.age += dt; ctx.globalAlpha = Math.max(0, 1 - pg.age / 3); this.groundRing(pg.x, pg.y, 60 + (pg.age % 1) * 120, '#ffeb3b'); ctx.globalAlpha = 1; } this.pings = this.pings.filter(x => x.age < 3);
    if (this.rangeHint && p && p.alive) this.groundRing(p.x, p.y, this.rangeHint, 'rgba(120,200,255,.8)');
  }
  groundRing(x, y, r, col) { const ctx = this.ctx; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283; const [sx, sy] = this.r3d.project(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.05); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); } ctx.stroke(); }
  hpBar2(u, x, y, w, h) {
    const ctx = this.ctx; ctx.fillStyle = '#000c'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2 + (u.kind === 'champ' && u.resMax ? 4 : 0));
    const f = Math.max(0, u.hp / u.st.maxHp); ctx.fillStyle = this.relCol(u); ctx.fillRect(x - w / 2, y, w * f, h);
    const sh = u.buffs.reduce((s, b) => s + (b.shield > 0 ? b.shield : 0), 0); if (sh > 0) { ctx.fillStyle = '#eee'; ctx.fillRect(x - w / 2 + w * f, y, Math.min(w * (1 - f), w * sh / u.st.maxHp), h); }
    if (u.kind === 'champ') { ctx.fillStyle = '#000a'; for (let i = 1; i <= Math.floor(u.st.maxHp / 100); i++) ctx.fillRect(x - w / 2 + w * i * 100 / u.st.maxHp, y, 1, h * (i % 10 ? 0.5 : 1));
      if (u.resMax) { ctx.fillStyle = { mana: '#2979ff', energy: '#ffee58', fury: '#ff7043' }[u.resType] || '#888'; ctx.fillRect(x - w / 2, y + h + 1, w * u.res / u.resMax, 3); } }
  }
  nearVision(pr, team) { return this.g.units.some(u => u.alive && u.team === team && (u.x - pr.x) ** 2 + (u.y - pr.y) ** 2 < 1350 ** 2); }

  drawMap(ctx) {
    const m = this.g.map, g = this.g;
    ctx.fillStyle = m.bg; ctx.fillRect(0, 0, m.W, m.H);
    // textura sutil
    ctx.fillStyle = 'rgba(255,255,255,0.025)'; for (let x = 0; x < m.W; x += 1000) for (let y = (x / 1000 % 2) * 500; y < m.H; y += 1000) ctx.fillRect(x, y, 500, 500);
    if (m.river) { ctx.strokeStyle = m.riverCol; ctx.lineWidth = m.riverW; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...m.river[0]); ctx.lineTo(...m.river[1]); ctx.stroke(); }
    ctx.strokeStyle = m.laneCol; ctx.lineWidth = 650; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const lane of Object.values(m.lanes[0])) { ctx.beginPath(); ctx.moveTo(...lane[0]); for (const pt of lane.slice(1)) ctx.lineTo(...pt); ctx.stroke(); }
    if (m.bounds) { ctx.fillStyle = '#0d1418'; ctx.fillRect(0, 0, m.W, m.bounds.y0 - 50); ctx.fillRect(0, m.bounds.y1 + 50, m.W, m.H); ctx.fillStyle = '#90a4ae'; ctx.fillRect(0, m.bounds.y0 - 60, m.W, 20); ctx.fillRect(0, m.bounds.y1 + 40, m.W, 20); }
    // bases
    m.fountain.forEach(([x, y], t) => { ctx.strokeStyle = this.teamCol(t) + '55'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(x, y, 900, 0, 7); ctx.stroke(); ctx.fillStyle = this.teamCol(t) + '88'; ctx.beginPath(); ctx.arc(x, y, 250, 0, 7); ctx.fill(); });
    for (const b of g.brushes) { ctx.fillStyle = '#2e7d32aa'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.fillStyle = '#43a04788'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(b.x + Math.cos(i) * b.r * 0.5, b.y + Math.sin(i * 1.7) * b.r * 0.5, b.r * 0.35, 0, 7); ctx.fill(); } }
    for (const o of g.obstacles) { ctx.fillStyle = o.col || '#5d5a55'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 7); ctx.fill(); ctx.strokeStyle = '#00000088'; ctx.lineWidth = 12; ctx.stroke(); }
    for (const a of g.altars) { ctx.strokeStyle = a.owner == null ? '#ccc' : this.teamCol(a.owner); ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(a.x, a.y, 300, 0, 7); ctx.stroke();
      if (a.prog > 0 && a.by != null) { ctx.strokeStyle = this.teamCol(a.by); ctx.lineWidth = 50; ctx.beginPath(); ctx.arc(a.x, a.y, 260, -1.57, -1.57 + 6.283 * a.prog / 6); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 70px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Altar ' + a.name, a.x, a.y - 330); }
    for (const r of g.relics) if (r.up) { ctx.fillStyle = '#69f0ae'; ctx.beginPath(); ctx.arc(r.x, r.y, 50, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 60px sans-serif'; ctx.fillText('+', r.x, r.y + 20); }
    for (const cp of g.camps) if (!cp.units.some(u => u.alive)) { ctx.fillStyle = '#ffffff22'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 80, 0, 7); ctx.fill();
      const left = Math.max(0, cp.next - g.t); if (left < 1e8) { ctx.fillStyle = '#ffffff88'; ctx.font = '50px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(left) + 's', cp.x, cp.y + 18); } }
  }
  drawZones(ctx) {
    const p = this.g.player, myTeam = p ? p.team : 0;
    for (const z of this.g.zones) {
      const col = z.col || (z.team === myTeam ? '#42a5f5' : '#ef5350');
      ctx.globalAlpha = z.kind === 'tide' ? 0.25 : 0.28;
      if (z.kind === 'wall') { ctx.strokeStyle = col; ctx.globalAlpha = 0.9; ctx.lineWidth = 70; ctx.beginPath(); ctx.moveTo(z.seg[0], z.seg[1]); ctx.lineTo(z.seg[2], z.seg[3]); ctx.stroke(); }
      else if (z.kind === 'crypt') { ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke(); }
      else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill();
        if (z.warn || z.delay) { ctx.globalAlpha = 0.9; ctx.strokeStyle = z.team === myTeam ? '#90caf9' : '#ff1744'; ctx.lineWidth = 10; ctx.setLineDash([25, 15]); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          if (z.delay) { const f = Math.min(1, z.age / z.delay); ctx.globalAlpha = 0.35; ctx.fillStyle = z.team === myTeam ? '#90caf9' : '#ff1744'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * f, 0, 7); ctx.fill(); } } }
      ctx.globalAlpha = 1;
    }
  }
  drawFx(ctx) {
    const myTeam = this.g.player ? this.g.player.team : 0;
    for (const f of this.g.fx) {
      const a = 1 - f.age / f.t; ctx.globalAlpha = a * 0.7; const col = f.col || (f.team === myTeam ? '#64b5f6' : '#ff5252');
      ctx.fillStyle = col; ctx.strokeStyle = col;
      if (f.kind === 'line') { ctx.lineWidth = f.w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.lineCap = 'round'; }
      if (f.kind === 'circle') { ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.7 + 0.3 * (1 - a)), 0, 7); ctx.fill(); }
      if (f.kind === 'cone') { const ang = Math.atan2(f.dy, f.dx); ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r, ang - f.a, ang + f.a); ctx.closePath(); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  drawUnit(ctx, u, hover) {
    const g = this.g, col = this.relCol(u);
    if (u.structure) {
      const dead = !u.alive; ctx.globalAlpha = dead ? 0.35 : 1;
      if (u.kind === 'tower') {
        ctx.fillStyle = '#37474f'; ctx.fillRect(u.x - 80, u.y - 80, 160, 160); ctx.fillStyle = dead ? '#555' : col; ctx.fillRect(u.x - 55, u.y - 160, 110, 170);
        ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.arc(u.x, u.y - 170, 40, 0, 7); ctx.fill();
        const p = g.player; if (!dead && p && p.alive && u.team !== p.team && Math.hypot(p.x - u.x, p.y - u.y) < 1300) {
          ctx.strokeStyle = u.target === p ? '#ff1744' : '#ff8a80aa'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(u.x, u.y, u.st.range, 0, 7); ctx.stroke(); }
        if (!dead && u.target && u.target.alive) { ctx.strokeStyle = this.teamCol(u.team) + '99'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(u.x, u.y - 170); ctx.lineTo(u.target.x, u.target.y); ctx.stroke(); }
      } else if (u.kind === 'inhib') { ctx.fillStyle = dead ? '#555' : col; ctx.beginPath(); ctx.moveTo(u.x, u.y - 120); ctx.lineTo(u.x + 110, u.y); ctx.lineTo(u.x, u.y + 120); ctx.lineTo(u.x - 110, u.y); ctx.closePath(); ctx.fill();
        if (dead && u.respawnAt) { ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = '60px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(u.respawnAt - g.t) + 's', u.x, u.y + 20); } }
      else { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047; ctx.lineTo(u.x + Math.cos(a) * 170, u.y + Math.sin(a) * 170); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffffaa'; ctx.beginPath(); ctx.arc(u.x, u.y, 70, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (u.alive) { this.hpBar(ctx, u, u.x, u.y - (u.kind === 'tower' ? 230 : 200), 240, 22, false); if (!g.isStructureTargetable(u)) { ctx.fillStyle = '#ffffffcc'; ctx.font = '50px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🛡', u.x, u.y - 250); } }
      return;
    }
    const stealth = u.buffs.some(b => b.stealth);
    ctx.globalAlpha = stealth ? 0.45 : 1;
    if (u === hover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 18, 0, 7); ctx.stroke(); }
    if (u.kind === 'champ') {
      if (hasBuff(u, 'dragon')) { ctx.fillStyle = '#ffd54f55'; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 50, 0, 7); ctx.fill(); }
      ctx.fillStyle = CLASS_COL[u.data.class]; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 10, 0, 7); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.stroke();
      if (u.buffs.some(b => b.shield > 0)) { ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 24, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#fff'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(u.name[0], u.x, u.y + 15);
      this.hpBar(ctx, u, u.x, u.y - u.r - 70, 170, 20, true);
      ctx.font = 'bold 30px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(`${u.level} · ${u.name}`, u.x, u.y - u.r - 82);
      const cc = u.cc.filter(c => c.kind !== 'slow')[0] || u.cc[0]; if (cc) { ctx.font = 'bold 50px sans-serif'; ctx.fillStyle = '#ffeb3b'; ctx.fillText(CC_ICON[cc.kind] || '!', u.x + u.r + 30, u.y - u.r); }
      if (u.channel) { ctx.fillStyle = '#ffffffaa'; ctx.fillRect(u.x - 80, u.y + u.r + 20, 160 * (1 - u.channel.t / (u.channel.recall ? 8 : 2)), 14); if (u.channel.recall) { ctx.strokeStyle = '#29b6f6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(u.x, u.y, u.r + 40, 0, 7); ctx.stroke(); } }
    } else if (u.kind === 'minion') {
      ctx.fillStyle = col; if (u.mtype === 'siege' || u.mtype === 'ram') ctx.fillRect(u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); else { ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, 7); ctx.fill(); }
      if (u.mtype === 'caster') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(u.x, u.y, 10, 0, 7); ctx.fill(); }
      if (u.mtype === 'super') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.stroke(); }
      this.hpBar(ctx, u, u.x, u.y - u.r - 22, 80, 10, false);
    } else if (u.kind === 'monster') {
      ctx.fillStyle = u.epicType ? '#ab47bc' : '#a1887f'; ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, 7); ctx.fill(); ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 8; ctx.stroke();
      this.hpBar(ctx, u, u.x, u.y - u.r - 30, u.epicType ? 260 : 120, u.epicType ? 22 : 12, false);
      if (u.big || u.epicType) { ctx.fillStyle = '#fff'; ctx.font = `bold ${u.epicType ? 42 : 30}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(u.name, u.x, u.y - u.r - 44); }
    } else if (u.kind === 'ward') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(u.x, u.y - 50); ctx.lineTo(u.x + 25, u.y + 20); ctx.lineTo(u.x - 25, u.y + 20); ctx.closePath(); ctx.fill(); }
    else if (u.kind === 'pet') { ctx.fillStyle = col; ctx.fillRect(u.x - 30, u.y - 30, 60, 60); ctx.fillStyle = '#ffcc80'; ctx.fillRect(u.x - 8, u.y - 50, 16, 40); this.hpBar(ctx, u, u.x, u.y - 60, 80, 10, false); }
    ctx.globalAlpha = 1;
  }
  hpBar(ctx, u, x, y, w, h, segs) {
    ctx.fillStyle = '#000000cc'; ctx.fillRect(x - w / 2 - 3, y - 3, w + 6, h + 6);
    const f = Math.max(0, u.hp / u.st.maxHp); ctx.fillStyle = this.relCol(u); ctx.fillRect(x - w / 2, y, w * f, h);
    const sh = u.buffs.reduce((s, b) => s + (b.shield > 0 ? b.shield : 0), 0);
    if (sh > 0) { ctx.fillStyle = '#eeeeee'; ctx.fillRect(x - w / 2 + w * f, y, Math.min(w * (1 - f), w * sh / u.st.maxHp), h); }
    if (segs) { ctx.fillStyle = '#000000aa'; const n = Math.floor(u.st.maxHp / 100); for (let i = 1; i <= n; i++) ctx.fillRect(x - w / 2 + w * i * 100 / u.st.maxHp, y, 2, h * (i % 10 ? 0.5 : 1)); }
    if (u.kind === 'champ' && u.resMax) { ctx.fillStyle = { mana: '#2979ff', energy: '#ffee58', fury: '#ff7043' }[u.resType] || '#888'; ctx.fillRect(x - w / 2, y + h + 2, w * u.res / u.resMax, 8); }
  }
  drawFog(team) {
    const g = this.g, f = this.fog, p = g.player;
    if (f.width !== this.W || f.height !== this.H) { f.width = this.W; f.height = this.H; } // niebla en px CSS: drawImage ya va escalado por dpr
    const fc = f.getContext('2d'); fc.globalCompositeOperation = 'source-over'; fc.clearRect(0, 0, f.width, f.height);
    fc.fillStyle = 'rgba(0,0,10,0.55)'; fc.fillRect(0, 0, f.width, f.height); fc.globalCompositeOperation = 'destination-out';
    const s = this.scale; const near = p && hasCC(p, 'nearsight');
    for (const u of g.units) {
      if (!u.alive || u.team !== team) continue;
      let r = u.kind === 'champ' ? 1350 : u.kind === 'minion' ? 1100 : u.kind === 'ward' ? 900 : u.kind === 'pet' ? 600 : u.structure ? 1350 : 0;
      if (near) r = u === p ? 300 : 0; if (!r) continue;
      const [x, y] = this.w2s(u.x, u.y); const grd = fc.createRadialGradient(x, y, r * s * 0.8, x, y, r * s);
      grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); fc.fillStyle = grd; fc.beginPath(); fc.arc(x, y, r * s, 0, 7); fc.fill();
    }
    const ctx = this.ctx; ctx.drawImage(f, 0, 0);
  }

  // ---------------- HUD ----------------
  drawHUD(hover) {
    const { ctx, g } = this, p = g.player; this.hudRects = [];
    const k = (this.s.uiScale || 1) * (this.s.mobile ? 1.15 : 1), mob = !!this.s.mobile; ctx.save(); ctx.font = '14px sans-serif';
    // marcador superior
    ctx.fillStyle = '#000000b0'; ctx.fillRect(this.W / 2 - 200 * k, 0, 400 * k, 46 * k);
    ctx.textAlign = 'center'; ctx.font = `bold ${22 * k}px sans-serif`;
    ctx.fillStyle = this.teamCol(0); ctx.fillText(`${g.kills[0]}`, this.W / 2 - 120 * k, 31 * k);
    ctx.fillStyle = this.teamCol(1); ctx.fillText(`${g.kills[1]}`, this.W / 2 + 120 * k, 31 * k);
    ctx.fillStyle = '#fff'; const mm = Math.floor(g.t / 60), ss = Math.floor(g.t % 60); ctx.fillText(`${mm}:${String(ss).padStart(2, '0')}`, this.W / 2, 31 * k);
    ctx.font = `${13 * k}px sans-serif`; ctx.fillStyle = '#ccc';
    ctx.fillText(`🗼${g.towersDown[0]}  🐉${g.dragons[0].length}`, this.W / 2 - 60 * k, 38 * k); ctx.fillText(`🗼${g.towersDown[1]}  🐉${g.dragons[1].length}`, this.W / 2 + 60 * k, 38 * k);
    if (g.altars.length) {
      const w = 300 * k, x0 = this.W / 2 - w / 2, y0 = 52 * k, max = g.rules.winPoints;
      ctx.fillStyle = '#000a'; ctx.fillRect(x0 - 4, y0 - 4, w + 8, 30 * k);
      ctx.fillStyle = this.teamCol(0); ctx.fillRect(x0, y0, w / 2 * g.points[0] / max, 10 * k); ctx.fillStyle = this.teamCol(1); ctx.fillRect(x0 + w / 2, y0, w / 2 * g.points[1] / max, 10 * k);
      ctx.fillStyle = '#fff'; ctx.font = `${12 * k}px sans-serif`; ctx.fillText(`${Math.floor(g.points[0])} — ${Math.floor(g.points[1])}  (meta ${max})`, this.W / 2, y0 + 23 * k);
    }
    // arriba derecha: KDA, CS, objetivos
    if (p) {
      // en móvil va abajo a la izquierda (zona del joystick, que se dibuja encima): arriba a la derecha están los botones y la barra compacta
      const ky = mob ? this.H - 70 * k : 0, kx = mob ? 0 : this.W - 270 * k, tx = kx + 270 * k - 10;
      ctx.textAlign = 'right'; ctx.fillStyle = '#000a'; ctx.fillRect(kx, ky, 270 * k, 70 * k); ctx.fillStyle = '#fff'; ctx.font = `${15 * k}px sans-serif`;
      ctx.fillText(`KDA ${p.stats.k}/${p.stats.d}/${p.stats.a}   CS ${p.stats.cs}   Visión ${p.stats.wards}`, tx, ky + 22 * k);
      const obj = []; const en = g.epicNext || {};
      for (const [key, name] of [['dragon', 'Dragón'], ['herald', 'Heraldo'], ['lord', 'Señor'], ['avatar', 'Avatar']]) {
        if (!g.map.epic[key]) continue;
        if (g.epic[key] && g.epic[key].alive) obj.push(`${name}: ¡vivo!`); else if (en[key] != null && en[key] < 1e8 && (key !== 'herald' || g.t < (g.heraldUntil ?? 1185))) obj.push(`${name}: ${fmt(Math.max(0, en[key] - g.t))}`);
        else if (en[key] == null) obj.push(`${name}: ${fmt((g.epicFirst?.[key] ?? { dragon: 300, herald: 480, lord: 1200, avatar: 600 }[key]) - g.t)}`);
      }
      ctx.font = `${13 * k}px sans-serif`; ctx.fillStyle = '#ffcc80'; ctx.fillText(obj.join('   '), tx, ky + 44 * k, 262 * k);
      if (g.teamBonus[p.team].lord) { ctx.fillStyle = '#ce93d8'; ctx.fillText('Mejora del Señor activa', tx, ky + 62 * k); }
      else if (g.teamBonus[p.team].soul) { ctx.fillStyle = '#ffd54f'; ctx.fillText(`Alma de ${g.teamBonus[p.team].soul}`, tx, ky + 62 * k); }
    }
    // anuncios
    let ay = 110 * k;
    for (const a of this.announce) { a.age += 1 / 60; }
    this.announce = this.announce.filter(a => a.age < (a.small ? 5 : 4)).slice(-6);
    ctx.textAlign = 'center';
    for (const a of this.announce.filter(a => !a.small).slice(-2)) { ctx.font = `bold ${24 * k}px sans-serif`; ctx.fillStyle = '#000a'; const w = ctx.measureText(a.txt).width + 30; ctx.fillRect(this.W / 2 - w / 2, ay - 26 * k, w, 36 * k); ctx.fillStyle = a.team === 2 ? '#e1bee7' : this.teamCol(a.team); ctx.fillText(a.txt, this.W / 2, ay); ay += 42 * k; }
    ctx.textAlign = 'right'; let fy = 100 * k;
    for (const a of this.announce.filter(a => a.small)) { ctx.font = `${14 * k}px sans-serif`; ctx.fillStyle = '#000a'; const w = ctx.measureText(a.txt).width + 16; ctx.fillRect(this.W - w - 6, fy - 16 * k, w, 22 * k); ctx.fillStyle = this.teamCol(a.team); ctx.fillText(a.txt, this.W - 12, fy); fy += 26 * k; }
    this.drawMinimap(k);
    if (p) { if (mob) this.drawBarMobile(p, k); else this.drawBar(p, k); }
    if (p && !p.alive) { ctx.fillStyle = '#0008'; ctx.fillRect(0, 0, this.W, this.H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = `bold ${34 * k}px sans-serif`;
      ctx.fillText(`Reapareces en ${Math.ceil(p.respawnAt - g.t)} s`, this.W / 2, this.H / 2 - 40); ctx.font = `${16 * k}px sans-serif`; ctx.fillText(mob ? 'Puedes comprar en la tienda mientras estás muerto' : 'Puedes comprar en la tienda (P) mientras estás muerto', this.W / 2, this.H / 2 - 10); }
    if (this.extraDraw) this.extraDraw(ctx, k);
    ctx.restore();
  }
  drawBar(p, k) {
    const { ctx, g } = this;
    const W = 640 * k, H = 112 * k, x0 = this.W / 2 - W / 2, y0 = this.H - H - 6;
    ctx.fillStyle = '#101418e6'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2; ctx.fillRect(x0, y0, W, H); ctx.strokeRect(x0, y0, W, H);
    // retrato
    ctx.fillStyle = CLASS_COL[p.data.class]; ctx.beginPath(); ctx.arc(x0 + 50 * k, y0 + 50 * k, 38 * k, 0, 7); ctx.fill(); ctx.strokeStyle = '#66ff66'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${30 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.name[0], x0 + 50 * k, y0 + 61 * k);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x0 + 80 * k, y0 + 82 * k, 14 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `bold ${14 * k}px sans-serif`; ctx.fillText(p.level, x0 + 80 * k, y0 + 87 * k);
    // xp
    if (p.level < 18) { ctx.fillStyle = '#7e57c2'; ctx.fillRect(x0 + 12 * k, y0 + 96 * k, 76 * k * p.xp / (280 + 100 * (p.level - 1)), 6 * k); }
    // habilidades
    const keys = ['Q', 'W', 'E', 'R'], kb = this.s.keys || {};
    keys.forEach((key, i) => {
      const bx = x0 + 110 * k + i * 62 * k, by = y0 + 10 * k, s = 54 * k, ab = p.ab[key];
      ctx.fillStyle = p.ranks[key] ? '#263238' : '#151a1e'; ctx.fillRect(bx, by, s, s); ctx.strokeStyle = g.abilityReady(p, key) ? '#c9a227' : '#555'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, s, s);
      ctx.fillStyle = '#eee'; ctx.font = `bold ${11 * k}px sans-serif`; ctx.textAlign = 'center';
      wrap(ctx, ab.name, bx + s / 2, by + 20 * k, s - 4, 12 * k);
      const cd = p.cds[key] || 0; if (cd > 0) { ctx.fillStyle = '#000b'; const cdMax = ab.cooldown[Math.max(0, p.ranks[key] - 1)] * 100 / (100 + p.st.ah); ctx.fillRect(bx, by + s * (1 - cd / cdMax), s, s * cd / cdMax); ctx.fillStyle = '#fff'; ctx.font = `bold ${18 * k}px sans-serif`; ctx.fillText(cd.toFixed(cd < 1 ? 1 : 0), bx + s / 2, by + s / 2 + 6); }
      if (p.recast[key] > g.t) { ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.strokeRect(bx + 2, by + 2, s - 4, s - 4); }
      ctx.fillStyle = '#c9a227'; ctx.font = `bold ${11 * k}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText(keyLabel(kb['cast' + key] || key), bx + 3, by + s - 4);
      for (let r = 0; r < (key === 'R' ? 3 : 5); r++) { ctx.fillStyle = r < p.ranks[key] ? '#ffd54f' : '#444'; ctx.fillRect(bx + 4 + r * (key === 'R' ? 16 : 10) * k, by + s + 4 * k, (key === 'R' ? 13 : 8) * k, 5 * k); }
      if (g.canRank(p, key)) { ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(bx + s / 2, by - 6 * k, 9 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.font = `bold ${14 * k}px sans-serif`; ctx.fillText('+', bx + s / 2, by - 1 * k);
        this.hudRects.push({ x: bx + s / 2 - 12 * k, y: by - 18 * k, w: 24 * k, h: 24 * k, act: 'level', key }); }
      this.hudRects.push({ x: bx, y: by, w: s, h: s, act: 'ability', key });
      if (p.resType === 'mana' || p.resType === 'energy') { ctx.fillStyle = '#90caf9'; ctx.font = `${10 * k}px sans-serif`; ctx.textAlign = 'right'; ctx.fillText(ab.cost || '', bx + s - 3, by + 11 * k); }
    });
    // invocador
    p.summoners.forEach((sid, i) => {
      const bx = x0 + 365 * k + i * 44 * k, by = y0 + 10 * k, s = 38 * k; const sp = SUMMONERS[sid];
      ctx.fillStyle = '#1c2a33'; ctx.fillRect(bx, by, s, s); ctx.strokeStyle = '#777'; ctx.strokeRect(bx, by, s, s);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${9 * k}px sans-serif`; ctx.textAlign = 'center'; wrap(ctx, sp.name, bx + s / 2, by + 15 * k, s - 2, 10 * k);
      const cd = p.sumCd[i]; if (cd > 0 && !(sid === 'smite' && p.smiteCharges > 0)) { ctx.fillStyle = '#000b'; ctx.fillRect(bx, by, s, s); ctx.fillStyle = '#fff'; ctx.font = `bold ${13 * k}px sans-serif`; ctx.fillText(Math.ceil(cd), bx + s / 2, by + s / 2 + 5); }
      if (sid === 'smite') { ctx.fillStyle = '#ffd54f'; ctx.fillText('×' + p.smiteCharges, bx + s - 6, by + s + 10 * k); }
      ctx.fillStyle = '#c9a227'; ctx.textAlign = 'left'; ctx.font = `bold ${10 * k}px sans-serif`; ctx.fillText(keyLabel((this.s.keys || {})['sum' + i] || ['D', 'F'][i]), bx + 2, by + s - 2);
      this.hudRects.push({ x: bx, y: by, w: s, h: s, act: 'summoner', i });
    });
    // objetos
    for (let i = 0; i < 6; i++) {
      const bx = x0 + 465 * k + (i % 3) * 42 * k, by = y0 + 10 * k + Math.floor(i / 3) * 42 * k, s = 38 * k, it = p.items[i];
      ctx.fillStyle = '#1c2228'; ctx.fillRect(bx, by, s, s); ctx.strokeStyle = '#555'; ctx.strokeRect(bx, by, s, s);
      if (it) { ctx.fillStyle = itemCol(it); ctx.fillRect(bx + 3, by + 3, s - 6, s - 6); ctx.fillStyle = '#fff'; ctx.font = `bold ${9 * k}px sans-serif`; ctx.textAlign = 'center'; wrap(ctx, it.name, bx + s / 2, by + 14 * k, s - 4, 10 * k); this.hudRects.push({ x: bx, y: by, w: s, h: s, act: 'item', i }); }
    }
    // guardianes y oro
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd54f'; ctx.font = `bold ${16 * k}px sans-serif`; ctx.fillText(`${Math.floor(p.gold)} oro`, x0 + 365 * k, y0 + 76 * k);
    ctx.fillStyle = '#aed581'; ctx.font = `${12 * k}px sans-serif`; ctx.fillText(`Guardián (4): ${p.wardCharges}`, x0 + 365 * k, y0 + 94 * k);
    this.hudRects.push({ x: x0 + 365 * k, y: y0 + 60 * k, w: 90 * k, h: 22 * k, act: 'shop' });
    // vida y recurso
    const bw = 340 * k, bx = x0 + 110 * k, by = y0 + 80 * k;
    ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, 14 * k); ctx.fillStyle = '#43a047'; ctx.fillRect(bx, by, bw * p.hp / p.st.maxHp, 14 * k);
    const sh = p.buffs.reduce((s, b) => s + (b.shield > 0 ? b.shield : 0), 0); if (sh) { ctx.fillStyle = '#eee'; ctx.fillRect(bx + bw * p.hp / p.st.maxHp, by, Math.min(bw * (1 - p.hp / p.st.maxHp), bw * sh / p.st.maxHp), 14 * k); }
    ctx.fillStyle = '#fff'; ctx.font = `bold ${11 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(`${Math.ceil(p.hp)} / ${Math.ceil(p.st.maxHp)}`, bx + bw / 2, by + 11 * k);
    if (p.resMax) { ctx.fillStyle = '#000'; ctx.fillRect(bx, by + 16 * k, bw, 10 * k); ctx.fillStyle = { mana: '#2979ff', energy: '#fdd835', fury: '#ff7043' }[p.resType]; ctx.fillRect(bx, by + 16 * k, bw * p.res / p.resMax, 10 * k);
      ctx.fillStyle = '#fff'; ctx.font = `${9 * k}px sans-serif`; ctx.fillText(`${Math.floor(p.res)} / ${p.resMax}`, bx + bw / 2, by + 24 * k); }
    else { ctx.fillStyle = '#aaa'; ctx.font = `${10 * k}px sans-serif`; ctx.fillText(p.resType === 'hp' ? 'Las habilidades cuestan vida' : 'Sin recurso', bx + bw / 2, by + 25 * k); }
    // panel de estadísticas
    const st = p.st; ctx.fillStyle = '#101418e6'; ctx.fillRect(x0 - 150 * k, y0 + 22 * k, 146 * k, 90 * k); ctx.fillStyle = '#ddd'; ctx.font = `${11 * k}px sans-serif`; ctx.textAlign = 'left';
    [[`AD ${st.ad | 0}`, `PH ${st.ap | 0}`], [`Arm ${st.armor | 0}`, `RM ${st.mr | 0}`], [`VA ${st.as.toFixed(2)}`, `AH ${st.ah | 0}`], [`Vel ${st.ms | 0}`, `Crit ${Math.round(st.crit * 100)}%`], [`Alc ${st.range | 0}`, ``]]
      .forEach(([a, b], r) => { ctx.fillText(a, x0 - 144 * k, y0 + (38 + r * 16) * k); ctx.fillText(b, x0 - 74 * k, y0 + (38 + r * 16) * k); });
    // buffs
    let bxx = x0 + 110 * k; ctx.font = `${10 * k}px sans-serif`;
    for (const b of p.buffs.filter(b => b.t < 1e8 && BUFF_NAMES[b.key]).slice(0, 8)) { const t = `${BUFF_NAMES[b.key]} ${Math.ceil(b.t)}s`; const w = ctx.measureText(t).width + 8; ctx.fillStyle = '#000c'; ctx.fillRect(bxx, y0 - 20 * k, w, 16 * k); ctx.fillStyle = '#b2ff59'; ctx.fillText(t, bxx + 4, y0 - 8 * k); bxx += w + 4; }
    for (const cc of p.cc) { const t = `${CC_NAMES[cc.kind] || cc.kind} ${cc.t.toFixed(1)}s`; const w = ctx.measureText(t).width + 8; ctx.fillStyle = '#400c'; ctx.fillRect(bxx, y0 - 20 * k, w, 16 * k); ctx.fillStyle = '#ff8a80'; ctx.fillText(t, bxx + 4, y0 - 8 * k); bxx += w + 4; }
    // tooltip
    if (this.mouse) { const r = this.hudRects.find(r => this.mouse.x >= r.x && this.mouse.x <= r.x + r.w && this.mouse.y >= r.y && this.mouse.y <= r.y + r.h);
      if (r) this.tooltip(r, p, k); }
  }
  tooltip(r, p, k) {
    const ctx = this.ctx; let lines = [];
    if (r.act === 'ability' || r.act === 'level') { const ab = p.ab[r.key]; const rk = Math.max(1, p.ranks[r.key]);
      lines = [`${ab.name} (${r.key}) — ${ab.type}`, ab.desc, `Valor: ${ab.base.join('/')}  ·  Escalado: ${Object.entries(ab.ratio).map(([a, b]) => `${Math.round(b * 100)}% ${a.toUpperCase()}`).join(', ') || '—'}`,
        `Enfriamiento: ${ab.cooldown.join('/')} s  ·  Coste: ${ab.cost || '—'}  ·  Alcance: ${ab.range > 20000 ? 'global' : ab.range}`, p.ranks[r.key] ? `Rango ${p.ranks[r.key]}` : 'Sin aprender — Ctrl+' + r.key + ' para subir'];
      if (r.key === 'Q') lines.unshift(`Pasiva — ${p.data.passive.name}: ${p.data.passive.desc}`); }
    if (r.act === 'summoner') { const sp = SUMMONERS[p.summoners[r.i]]; lines = [sp.name, `Enfriamiento ${sp.cd} s`]; }
    if (r.act === 'item') { const it = p.items[r.i]; lines = [it.name, Object.entries(it.stats).map(([a, b]) => `+${b < 1 ? Math.round(b * 100) + '%' : b} ${a}`).join(', '), it.unique || '', 'Clic derecho en la tienda para vender (70%)']; }
    if (r.act === 'shop') lines = ['Abrir tienda (P)'];
    if (!lines.length) return;
    ctx.font = `${12 * k}px sans-serif`; const w = Math.min(520 * k, Math.max(...lines.map(l => ctx.measureText(l).width)) + 20); const h = lines.length * 18 * k + 12;
    const x = Math.min(this.W - w - 4, this.mouse.x + 12), y = this.mouse.y - h - 12;
    ctx.fillStyle = '#0b0f13f0'; ctx.strokeStyle = '#c9a227'; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.fillStyle = '#eee'; ctx.textAlign = 'left';
    lines.forEach((l, i) => { ctx.fillStyle = i === 0 ? '#ffd54f' : '#ddd'; ctx.fillText(l, x + 10, y + 20 * k + i * 18 * k, w - 16); });
  }
  /** HUD móvil (Wild Rift): panel compacto arriba-centro con retrato, nivel, vida/recurso, objetos y oro; las habilidades son botones DOM (touch.js). */
  drawBarMobile(p, k) {
    const { ctx, g } = this;
    const W = 320 * k, H = 60 * k, x0 = this.W / 2 - W / 2, y0 = 50 * k + (g.altars.length ? 32 * k : 0);
    ctx.fillStyle = '#101418d9'; ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5; ctx.fillRect(x0, y0, W, H); ctx.strokeRect(x0, y0, W, H);
    // retrato y nivel
    ctx.fillStyle = CLASS_COL[p.data.class]; ctx.beginPath(); ctx.arc(x0 + 26 * k, y0 + 30 * k, 20 * k, 0, 7); ctx.fill(); ctx.strokeStyle = '#66ff66'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${18 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.name[0], x0 + 26 * k, y0 + 36 * k);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x0 + 42 * k, y0 + 46 * k, 9 * k, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd54f'; ctx.font = `bold ${10 * k}px sans-serif`; ctx.fillText(p.level, x0 + 42 * k, y0 + 49.5 * k);
    // vida y recurso
    const bw = 150 * k, bx = x0 + 56 * k, by = y0 + 10 * k;
    ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, 12 * k); ctx.fillStyle = '#43a047'; ctx.fillRect(bx, by, bw * p.hp / p.st.maxHp, 12 * k);
    const sh = p.buffs.reduce((s, b) => s + (b.shield > 0 ? b.shield : 0), 0); if (sh) { ctx.fillStyle = '#eee'; ctx.fillRect(bx + bw * p.hp / p.st.maxHp, by, Math.min(bw * (1 - p.hp / p.st.maxHp), bw * sh / p.st.maxHp), 12 * k); }
    ctx.fillStyle = '#fff'; ctx.font = `bold ${9 * k}px sans-serif`; ctx.fillText(`${Math.ceil(p.hp)} / ${Math.ceil(p.st.maxHp)}`, bx + bw / 2, by + 9.5 * k);
    if (p.resMax) { ctx.fillStyle = '#000'; ctx.fillRect(bx, by + 14 * k, bw, 7 * k); ctx.fillStyle = { mana: '#2979ff', energy: '#fdd835', fury: '#ff7043' }[p.resType]; ctx.fillRect(bx, by + 14 * k, bw * p.res / p.resMax, 7 * k); }
    if (p.level < 18) { ctx.fillStyle = '#7e57c2'; ctx.fillRect(bx, by + 23 * k, bw * p.xp / (280 + 100 * (p.level - 1)), 3 * k); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffd54f'; ctx.font = `bold ${12 * k}px sans-serif`; ctx.fillText(`${Math.floor(p.gold)} oro`, bx, y0 + 50 * k);
    ctx.fillStyle = '#aed581'; ctx.font = `${10 * k}px sans-serif`; ctx.fillText(`Guardián ${p.wardCharges}`, bx + 70 * k, y0 + 50 * k);
    // objetos 3×2
    for (let i = 0; i < 6; i++) {
      const ix = x0 + 216 * k + (i % 3) * 32 * k, iy = y0 + 6 * k + Math.floor(i / 3) * 26 * k, s = 24 * k, it = p.items[i];
      ctx.fillStyle = '#1c2228'; ctx.fillRect(ix, iy, s, 22 * k); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(ix, iy, s, 22 * k);
      if (it) { ctx.fillStyle = itemCol(it); ctx.fillRect(ix + 2, iy + 2, s - 4, 22 * k - 4); ctx.fillStyle = '#fff'; ctx.font = `bold ${8 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(it.name.slice(0, 4), ix + s / 2, iy + 14 * k); this.hudRects.push({ x: ix, y: iy, w: s, h: 22 * k, act: 'item', i }); }
    }
    // buffs y CC debajo del panel
    let bxx = x0; ctx.font = `${9 * k}px sans-serif`; ctx.textAlign = 'left';
    for (const b of p.buffs.filter(b => b.t < 1e8 && BUFF_NAMES[b.key]).slice(0, 6)) { const t = `${BUFF_NAMES[b.key]} ${Math.ceil(b.t)}s`; const w = ctx.measureText(t).width + 8; ctx.fillStyle = '#000c'; ctx.fillRect(bxx, y0 + H + 3, w, 14 * k); ctx.fillStyle = '#b2ff59'; ctx.fillText(t, bxx + 4, y0 + H + 3 + 10 * k); bxx += w + 4; }
    for (const cc of p.cc) { const t = `${CC_NAMES[cc.kind] || cc.kind} ${cc.t.toFixed(1)}s`; const w = ctx.measureText(t).width + 8; ctx.fillStyle = '#400c'; ctx.fillRect(bxx, y0 + H + 3, w, 14 * k); ctx.fillStyle = '#ff8a80'; ctx.fillText(t, bxx + 4, y0 + H + 3 + 10 * k); bxx += w + 4; }
  }
  drawMinimap(k) {
    const { ctx, g } = this, m = g.map; const p = g.player; const team = p ? p.team : 0;
    const mob = !!this.s.mobile, size = (mob ? 150 : 220) * k * (this.s.minimapScale || 1), sx = size / Math.max(m.W, m.H);
    const x0 = mob ? 8 : this.W - size - 8, y0 = mob ? 8 : this.H - size * (m.H / Math.max(m.W, m.H)) - 8;
    const hh = m.H * sx; this.mini = { x0, y0, sx, w: m.W * sx, h: hh };
    ctx.fillStyle = '#000'; ctx.fillRect(x0 - 3, y0 - 3, m.W * sx + 6, hh + 6); ctx.fillStyle = m.bg; ctx.fillRect(x0, y0, m.W * sx, hh);
    ctx.strokeStyle = m.laneCol; ctx.lineWidth = 6 * k; for (const lane of Object.values(m.lanes[0])) { ctx.beginPath(); lane.forEach(([x, y], i) => i ? ctx.lineTo(x0 + x * sx, y0 + y * sx) : ctx.moveTo(x0 + x * sx, y0 + y * sx)); ctx.stroke(); }
    for (const u of g.units) {
      if (!u.alive) continue; const vis = u.team === team || u.structure || g.isVisibleTo(team, u); if (!vis) continue;
      const x = x0 + u.x * sx, y = y0 + u.y * sx;
      if (u.structure) { ctx.fillStyle = this.teamCol(u.team); ctx.fillRect(x - 3 * k, y - 3 * k, 6 * k, 6 * k); }
      else if (u.kind === 'champ') { ctx.fillStyle = this.relCol(u); ctx.beginPath(); ctx.arc(x, y, (u === p ? 6 : 5) * k, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = `bold ${7 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(u.name[0], x, y + 3 * k); }
      else if (u.kind === 'minion') { ctx.fillStyle = this.teamCol(u.team); ctx.fillRect(x - 1, y - 1, 2.5, 2.5); }
      else if (u.kind === 'monster' && (u.epicType || u.big)) { ctx.fillStyle = u.epicType ? '#ce93d8' : '#bcaaa4'; ctx.beginPath(); ctx.arc(x, y, (u.epicType ? 5 : 3) * k, 0, 7); ctx.fill(); }
      else if (u.kind === 'ward') { ctx.fillStyle = '#ffeb3b'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
    }
    for (const pg of this.pings) { ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0 + pg.x * sx, y0 + pg.y * sx, 8 + (pg.age % 1) * 8, 0, 7); ctx.stroke(); }
    // rectángulo de cámara
    const cs = [[0, 0], [this.W, 0], [this.W, this.H], [0, this.H]].map(([px, py]) => this.s2w(px, py));
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); cs.forEach(([a, b], i) => i ? ctx.lineTo(x0 + a * sx, y0 + b * sx) : ctx.moveTo(x0 + a * sx, y0 + b * sx)); ctx.closePath(); ctx.stroke();
  }
}
const BUFF_NAMES = { golem_buff: 'Gólem', bestia_buff: 'Bestia', templar: 'Templar', piel: 'Piel', sangre: 'Sangre', spellshield: 'Égida', juicio: 'Juicio', frenesi: 'Frenesí', ira: 'Ira',
  burbuja: 'Burbuja', corriente: 'Corriente', fae: 'Invisible', velo: 'Velo', caceria: 'Cacería', corteza: 'Corteza', dragon: 'Forma Dragón', fase: 'Fase', halcon: 'Halcón', voltereta: 'Voltereta',
  hacha: 'Hacha', incensario: 'Incensario', huesos: 'Huesos', devorar: 'Devorar', estampida: 'Estampida', jabali: 'Jabalí', renacer: 'Renacer', escamas: 'Escamas', instinto: 'Instinto', prender: 'Prender', burn: 'Quemadura', grievous: 'Heridas' };
const CC_NAMES = { stun: 'Aturdido', root: 'Inmovilizado', airborne: 'Por los aires', slow: 'Ralentizado', silence: 'Silenciado', blind: 'Cegado', taunt: 'Provocado', fear: 'Asustado', sleep: 'Dormido', nearsight: 'Pesadilla' };
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function keyLabel(k) { return (k || '').replace('Key', '').replace('Digit', ''); }
function itemCol(it) { const s = it.stats; return s.ap ? '#5e35b1' : s.armor || s.mr || s.hp > 300 ? '#6d4c41' : s.as || s.crit ? '#2e7d32' : s.ms ? '#455a64' : '#b71c1c'; }
function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '', yy = y, n = 0;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = w; if (++n >= 2) break; } else line = t; }
  if (n < 3) ctx.fillText(line, x, yy);
}
