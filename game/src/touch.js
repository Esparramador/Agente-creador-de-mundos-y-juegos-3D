// Controles táctiles estilo Wild Rift (ui-hud-controls.md § Controles táctiles). Solo se inicializa en móvil (main.js).
// Joystick flotante en la mitad izquierda, botones DOM en #touchUI (habilidades con lanzamiento inteligente o puntería por
// arrastre, ataque con sub-botones torre/súbdito, B, guardián, tienda, marcador, candado, pausa), cámara semibloqueada
// (arrastre temporal y pellizco) y minimapa arriba-izquierda (toque = cámara, toque largo = señal).
import { joystickVector, aimFromDrag, isCancelZone, layoutButtons } from './touchmath.js';
import { SUMMONERS } from './kits.js';

const JOY_R = 56;          // radio del joystick (px CSS)
const AIM_R = 60;          // radio de la zona de puntería de un botón (cancelación < 40 %)
const AIM_K = 8;           // unidades de mundo por px de arrastre
const MOVE_U = 600;        // destino del joystick: p + dir × 600 u
const MOVE_MS = 100;       // reemisión del movimiento
const HOLD_MS = 500;       // pulsación larga = subir rango / señal en el minimapa
const DRAG_PX = 12;        // a partir de aquí un toque es arrastre
const LABELS = { attack: '⚔', attackTower: '🗼', attackMinion: '⚒', recall: 'B', ward: '👁', shop: '🛒', score: '☰', lock: '🔒', pause: '⏸' };
const TITLES = { attack: 'Atacar', attackTower: 'Atacar torre', attackMinion: 'Atacar súbdito', recall: 'Volver a base', ward: 'Guardián', shop: 'Tienda', score: 'Marcador', lock: 'Cámara', pause: 'Pausa' };

/**
 * @param {object} o  { canvas, root (#touchUI), getG, getR, S, cast(key, aim), summoner(i, aim), say(txt), toggleShop(on), toggleScore(on), togglePause(), ping(x,y), zoomLimits() → [min,max] }
 * @returns {object}  estado para pruebas (window.__cdc.touch)
 */
export function initTouch(o) {
  const { canvas, root, S } = o;
  const G = () => o.getG(), R = () => o.getR();
  const T = { joy: null, aim: null, cam: null, pinch: null, buttons: {}, rects: [], lastDir: { dx: 1, dy: 0 }, active: false, layout };
  root.innerHTML = ''; root.style.display = 'block';

  // ---------------- botones DOM ----------------
  function layout() {
    const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight, k = (S.uiScale || 1);
    T.rects = layoutButtons(W, H, k);
    for (const r of T.rects) {
      let b = T.buttons[r.id];
      if (!b) { b = T.buttons[r.id] = document.createElement('div'); b.className = 'tb tb-' + r.id + (r.key ? ' tb-ab' : r.i != null ? ' tb-sum' : ''); b.dataset.id = r.id; b.title = TITLES[r.id] || r.id;
        b.innerHTML = `<span class="tb-name"></span><span class="tb-cd"></span><span class="tb-key"></span><span class="tb-rank"></span><span class="tb-plus">+</span>`; root.appendChild(b); bindButton(b, r); }
      Object.assign(b.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      b._rect = r;
    }
  }
  function bindButton(b, r) {
    // la pulsación larga se decide con las marcas de tiempo de los eventos (no con un temporizador): un fotograma lento no convierte un arrastre en subida de rango
    const st = { id: null, x0: 0, y0: 0, t0: 0, drag: false, timer: 0 };
    b.addEventListener('pointerdown', e => {
      if (st.id != null || !G() || !G().player) return; e.preventDefault(); e.stopPropagation(); T.active = true;
      st.id = e.pointerId; st.x0 = e.clientX; st.y0 = e.clientY; st.t0 = e.timeStamp; st.drag = false; b.setPointerCapture(e.pointerId); b.classList.add('down');
      if (r.key) st.timer = setTimeout(() => { if (!st.drag && st.id != null) b.classList.add('hold'); }, HOLD_MS); // solo aviso visual; la acción va en pointerup
    });
    b.addEventListener('pointermove', e => {
      if (e.pointerId !== st.id) return; e.preventDefault();
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.drag && Math.hypot(dx, dy) >= DRAG_PX && (r.key || r.i != null)) { st.drag = true; clearTimeout(st.timer); b.classList.remove('hold'); }
      if (st.drag) updateAim(r, dx, dy);
    });
    const up = e => {
      if (e.pointerId !== st.id) return; e.preventDefault(); clearTimeout(st.timer); b.classList.remove('down'); b.classList.remove('hold'); const id = st.id; st.id = null;
      try { b.releasePointerCapture(id); } catch (_) { /* ya liberado */ }
      if (st.drag) { const dx = e.clientX - st.x0, dy = e.clientY - st.y0; const cancelled = e.type === 'pointercancel' || isCancelZone(dx, dy, AIM_R); const aim = T.aim; T.aim = null; R().rangeHint = 0;
        if (!cancelled && aim) fire(r, aim); return; }
      if (e.type === 'pointercancel') return;
      if (r.key && e.timeStamp - st.t0 >= HOLD_MS) { const g = G(), p = g.player; if (g.cmdLevel(p, r.key)) o.say(`${p.ab[r.key].name}: rango ${p.ranks[r.key]}`); else o.say('No puedes subir ' + r.key + ' ahora'); return; } // pulsación larga = subir rango
      tap(r);
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  function rangeOf(r) { const p = G().player; if (r.key) { const kab = p.kit[r.key]; return Math.min(kab.range || p.ab[r.key].range || 600, 2000); } const sp = SUMMONERS[p.summoners[r.i]]; return sp.range || 450; }
  function kindOf(r) { const p = G().player; return r.key ? p.kit[r.key] : SUMMONERS[p.summoners[r.i]]; }
  function updateAim(r, dx, dy) {
    const g = G(), p = g.player; if (!p || !p.alive) return;
    const range = rangeOf(r), a = aimFromDrag(p, dx, dy, range, AIM_K), kind = kindOf(r);
    const aim = { x: a.x, y: a.y, cancel: isCancelZone(dx, dy, AIM_R) };
    if (kind.t === 'unit') aim.unit = nearestTo(a.x, a.y, 300, u => u.team !== p.team && !u.structure && u.kind !== 'ward' && (!kind.champs || u.kind === 'champ'));
    if (kind.t === 'ally') aim.unit = nearestTo(a.x, a.y, 250, u => u.team === p.team && u.kind === 'champ') || p;
    T.aim = aim; R().rangeHint = range;
  }
  function nearestTo(wx, wy, rad, f) { const g = G(), team = g.player.team; let best = null, bd = rad; for (const u of g.units) { if (!u.alive || !g.isVisibleTo(team, u) || !f(u)) continue; const d = Math.hypot(u.x - wx, u.y - wy) - u.r; if (d < bd) { bd = d; best = u; } } return best; }
  /** Lanzamiento inteligente: campeón enemigo más cercano en alcance; si no, enemigo más cercano; si no, en la dirección del último movimiento. */
  function smartAim(r) {
    const g = G(), p = g.player, kind = kindOf(r), range = rangeOf(r);
    const notStruct = u => !u.structure && u.kind !== 'ward';
    let t = kind.t === 'ally' ? null : (g.nearestEnemy(p, range, u => u.kind === 'champ') || (kind.champs ? null : g.nearestEnemy(p, range, notStruct)) || (kind.t === 'unit' ? null : g.nearestEnemy(p, range + 400, notStruct)));
    const aim = t ? { x: t.x, y: t.y } : { x: p.x + T.lastDir.dx * range, y: p.y + T.lastDir.dy * range };
    if (kind.t === 'unit') aim.unit = t;
    if (kind.t === 'ally') { let best = p, bf = p.hp / p.st.maxHp; for (const c of g.champs) if (c.alive && c.team === p.team && c !== p && Math.hypot(c.x - p.x, c.y - p.y) <= range) { const f = c.hp / c.st.maxHp; if (f < bf) { bf = f; best = c; } } aim.unit = best; aim.x = best.x; aim.y = best.y; }
    return aim;
  }
  function fire(r, aim) { if (r.key) o.cast(r.key, aim); else o.summoner(r.i, aim); }
  function tap(r) {
    const g = G(), p = g.player; if (!p) return;
    if (r.key || r.i != null) { if (!p.alive) return; return fire(r, smartAim(r)); }
    switch (r.id) {
      case 'attack': { const t = g.nearestEnemy(p, Math.max(p.st.range + 300, 700), u => u.kind === 'champ') || g.nearestEnemy(p, Math.max(p.st.range + 300, 700), u => u.kind === 'minion' || u.kind === 'pet') || g.nearestEnemy(p, Math.max(p.st.range + 300, 700), u => u.kind === 'monster') || g.nearestEnemy(p, Math.max(p.st.range + 300, 700));
        if (t) { g.cmdAttack(p, t); R().clickFx.push({ x: t.x, y: t.y, col: '#ff5252', age: 0 }); } else o.say('Sin enemigo cerca'); return; }
      case 'attackTower': { const t = g.nearestEnemy(p, 1600, u => u.structure); if (t) g.cmdAttack(p, t); else o.say('Sin estructura atacable cerca'); return; }
      case 'attackMinion': { let best = null; for (const u of g.units) { if (!u.alive || u.team === p.team || u.kind !== 'minion' || !g.isVisibleTo(p.team, u)) continue; if (Math.hypot(u.x - p.x, u.y - p.y) - u.r > p.st.range + 200) continue; if (!best || u.hp < best.hp) best = u; }
        if (best) g.cmdAttack(p, best); else o.say('Sin súbditos en alcance'); return; }
      case 'recall': if (p.alive && !g.cmdRecall(p)) o.say('No puedes volver ahora'); return;
      case 'ward': { const d = T.lastDir, x = p.x + d.dx * 350, y = p.y + d.dy * 350; if (!g.cmdWard(p, x, y)) o.say(p.wardCharges ? 'No se puede colocar aquí' : 'Sin cargas de guardián'); return; }
      case 'shop': o.toggleShop(!document.getElementById('shop').classList.contains('on')); return;
      case 'score': o.toggleScore(!document.getElementById('score').classList.contains('on')); return;
      case 'lock': { const c = R().cam; c.locked = !c.locked; o.say(c.locked ? 'Cámara bloqueada' : 'Cámara libre'); return; }
      case 'pause': o.togglePause(); return;
    }
  }

  // ---------------- lienzo: joystick, cámara, pellizco, minimapa ----------------
  function onMini(x, y) { const m = R() && R().mini; return m && x >= m.x0 && y >= m.y0 && x <= m.x0 + m.w && y <= m.y0 + m.h; }
  function miniToWorld(x, y) { const m = R().mini; return [(x - m.x0) / m.sx, (y - m.y0) / m.sx]; }
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && !S.touchForce) return; // el ratón sigue por los manejadores de escritorio
    if (!G() || !R()) return; e.preventDefault(); T.active = true;
    const x = e.clientX, y = e.clientY, W = canvas.clientWidth || innerWidth;
    if (onMini(x, y)) { const [wx, wy] = miniToWorld(x, y); const r = R(); r.cam.locked = false; r.cam.x = wx; r.cam.y = wy;
      T.mini = { id: e.pointerId, timer: setTimeout(() => { o.ping(wx, wy); T.mini = null; }, HOLD_MS) }; return; }
    if (x < W / 2 && !T.joy) { T.joy = { id: e.pointerId, cx: x, cy: y, x, y, dx: 0, dy: 0, mag: 0, t: 0 }; moveTick(true); return; }
    if (!T.cam) { const r = R(); T.cam = { id: e.pointerId, x, y, wasLocked: r.cam.locked }; r.cam.locked = false; return; }
    if (!T.pinch) { const r = R(), d = Math.hypot(x - T.cam.x, y - T.cam.y); T.pinch = { id: e.pointerId, x, y, d0: Math.max(20, d), z0: r.cam.zoom }; }
  });
  canvas.addEventListener('pointermove', e => {
    if (T.joy && e.pointerId === T.joy.id) { const j = T.joy; j.x = e.clientX; j.y = e.clientY; Object.assign(j, joystickVector(j.cx, j.cy, j.x, j.y, JOY_R)); if (j.mag > 0) T.lastDir = { dx: j.dx, dy: j.dy }; e.preventDefault(); return; }
    if (T.cam && e.pointerId === T.cam.id) { const r = R(); if (T.pinch) { T.cam.x = e.clientX; T.cam.y = e.clientY; pinch(); return; }
      const [ax, ay] = r.s2w(T.cam.x, T.cam.y), [bx, by] = r.s2w(e.clientX, e.clientY); const g = G();
      r.cam.x = Math.max(0, Math.min(g.map.W, r.cam.x - (bx - ax))); r.cam.y = Math.max(0, Math.min(g.map.H, r.cam.y - (by - ay))); T.cam.x = e.clientX; T.cam.y = e.clientY; e.preventDefault(); return; }
    if (T.pinch && e.pointerId === T.pinch.id) { T.pinch.x = e.clientX; T.pinch.y = e.clientY; pinch(); }
  });
  function pinch() { const r = R(), d = Math.hypot(T.pinch.x - T.cam.x, T.pinch.y - T.cam.y), [lo, hi] = o.zoomLimits(); r.cam.zoom = Math.max(lo, Math.min(hi, T.pinch.z0 * d / T.pinch.d0)); }
  const endPointer = e => {
    if (T.mini && e.pointerId === T.mini.id) { clearTimeout(T.mini.timer); T.mini = null; }
    if (T.joy && e.pointerId === T.joy.id) { T.joy = null; const p = G() && G().player; if (p && p.alive) G().cmdStop(p); }
    if (T.pinch && e.pointerId === T.pinch.id) T.pinch = null;
    if (T.cam && e.pointerId === T.cam.id) { const r = R(); if (T.pinch) { T.cam.id = T.pinch.id; T.cam.x = T.pinch.x; T.cam.y = T.pinch.y; T.pinch = null; } else { if (T.cam.wasLocked) r.cam.locked = true; T.cam = null; } }
  };
  canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
  function moveTick(force) {
    const j = T.joy; if (!j) return; const g = G(), p = g.player;
    if (p && p.alive && j.mag > 0 && (force || performance.now() - j.t >= MOVE_MS)) { j.t = performance.now(); g.cmdMove(p, p.x + j.dx * MOVE_U, p.y + j.dy * MOVE_U); }
  }

  // ---------------- dibujo por fotograma (gancho R.extraDraw) y estado de los botones ----------------
  let lastSig = '';
  function draw(ctx, k) {
    moveTick(false);
    const j = T.joy;
    if (j) { ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(j.cx, j.cy, JOY_R, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffffff22'; ctx.fill();
      const kx = j.cx + j.dx * j.mag * JOY_R, ky = j.cy + j.dy * j.mag * JOY_R; ctx.globalAlpha = 0.85; ctx.fillStyle = '#c9a227'; ctx.beginPath(); ctx.arc(kx, ky, 22, 0, 7); ctx.fill(); ctx.restore(); }
    const r = R(), a = T.aim; if (a && r) { const [sx, sy] = r.w2s(a.x, a.y); ctx.save(); ctx.strokeStyle = a.cancel ? '#ff5252' : '#80d8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 18, 0, 7); ctx.stroke();
      if (a.unit) { const [ux, uy] = r.w2s(a.unit.x, a.unit.y); ctx.strokeStyle = '#ff1744'; ctx.beginPath(); ctx.arc(ux, uy, 26, 0, 7); ctx.stroke(); } ctx.restore(); }
    updateButtons();
  }
  function updateButtons() {
    const g = G(), p = g && g.player; if (!p) return;
    const sig = [p.alive ? 1 : 0, g.inFountain(p) ? 1 : 0, R().cam.locked ? 1 : 0, ...['Q', 'W', 'E', 'R'].map(k => `${p.ranks[k]}|${(p.cds[k] || 0).toFixed(1)}|${g.abilityReady(p, k) ? 1 : 0}|${g.canRank(p, k) ? 1 : 0}`), ...p.summoners.map((s, i) => `${Math.ceil(p.sumCd[i] || 0)}|${s === 'smite' ? p.smiteCharges : ''}`), p.wardCharges].join(',');
    if (sig === lastSig) return; lastSig = sig;
    for (const r of T.rects) {
      const b = T.buttons[r.id], $ = c => b.querySelector(c);
      if (r.key) { const ab = p.ab[r.key], cd = p.cds[r.key] || 0; $('.tb-name').textContent = ab.name.split(' ')[0]; $('.tb-key').textContent = r.key; $('.tb-cd').textContent = cd > 0 ? cd.toFixed(cd < 1 ? 1 : 0) : '';
        $('.tb-rank').textContent = p.ranks[r.key] ? '●'.repeat(p.ranks[r.key]) : ''; b.classList.toggle('off', !g.abilityReady(p, r.key)); b.classList.toggle('learn', !p.ranks[r.key]); b.classList.toggle('canrank', g.canRank(p, r.key)); b.classList.toggle('recast', p.recast[r.key] > g.t); }
      else if (r.i != null) { const sid = p.summoners[r.i], sp = SUMMONERS[sid], cd = p.sumCd[r.i] || 0; $('.tb-name').textContent = sp.name.split(' ')[0]; $('.tb-key').textContent = ['D', 'F'][r.i]; $('.tb-cd').textContent = cd > 0 && !(sid === 'smite' && p.smiteCharges > 0) ? Math.ceil(cd) : ''; $('.tb-rank').textContent = sid === 'smite' ? '×' + p.smiteCharges : ''; b.classList.toggle('off', cd > 0 && !(sid === 'smite' && p.smiteCharges > 0)); }
      else { $('.tb-name').textContent = LABELS[r.id]; if (r.id === 'ward') $('.tb-rank').textContent = '×' + p.wardCharges; if (r.id === 'lock') $('.tb-name').textContent = R().cam.locked ? '🔒' : '🔓';
        if (r.id === 'shop') b.style.display = (!p.alive || g.inFountain(p)) ? '' : 'none'; }
    }
  }

  layout(); addEventListener('resize', layout); updateButtons();
  R().extraDraw = draw;
  T.refresh = () => { lastSig = ''; R().extraDraw = draw; updateButtons(); };
  T.destroy = () => { removeEventListener('resize', layout); root.innerHTML = ''; root.style.display = ''; };
  return T;
}
