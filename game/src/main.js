// Punto de entrada del navegador: menús, entrada, bucle de juego, audio, tienda, marcador, opciones y tutorial.
import { Game, CHAMP_BY_ID } from './world.js';
import { CHAMPIONS, ITEMS, MAPS } from './data.js';
import { Renderer } from './render.js';
import { SUMMONERS } from './kits.js';
import { BUILDS } from './ai.js';
import { TICK, dist } from './core.js';
import { World3D } from './render3d.js';
import { initTouch } from './touch.js';
import { montarFichas } from './fichas.js';
import { initVfx } from './vfx.js';

// ---------------- ajustes (localStorage) ----------------
const DEFAULT_KEYS = { castQ: 'KeyQ', castW: 'KeyW', castE: 'KeyE', castR: 'KeyR', sum0: 'KeyD', sum1: 'KeyF', ward: 'Digit4', recall: 'KeyB', shop: 'KeyP',
  score: 'Tab', lock: 'KeyY', center: 'Space', attackMove: 'KeyA', stop: 'KeyS', ping: 'KeyG' };
const ACTION_NAMES = { castQ: 'Habilidad Q', castW: 'Habilidad W', castE: 'Habilidad E', castR: 'Definitiva R', sum0: 'Invocador 1', sum1: 'Invocador 2', ward: 'Guardián',
  recall: 'Volver a base', shop: 'Tienda', score: 'Marcador', lock: 'Bloquear cámara', center: 'Centrar cámara', attackMove: 'Movimiento con ataque', stop: 'Detenerse', ping: 'Señal (+clic)' };
const S = Object.assign({ quickCast: true, colorblind: false, uiScale: 1, volume: 0.4, minimapScale: 1, touch: 'auto', vfx: 'alto', keys: { ...DEFAULT_KEYS } }, JSON.parse(localStorage.getItem('cdc_settings') || '{}'));
// touch: 'auto' | 'on' | 'off' (controles táctiles); vfx: 'alto' | 'bajo' | 'off' (efectos, lo lee vfx.js); ?touch=1 fuerza el modo móvil (pruebas)
const TOUCH_FORCED = new URLSearchParams(location.search).get('touch') === '1';
function esMovil() { return TOUCH_FORCED || S.touch === 'on' || (S.touch === 'auto' && typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches); }
S.keys = { ...DEFAULT_KEYS, ...S.keys };
const save = () => localStorage.setItem('cdc_settings', JSON.stringify(S));

// ---------------- audio sintetizado ----------------
let AC = null;
function tone(freq, dur = 0.08, type = 'sine', vol = 1, slide = 0) {
  if (!S.volume) return; try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.value = freq; if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), AC.currentTime + dur);
    gn.gain.value = 0.08 * S.volume * vol; gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur); o.connect(gn); gn.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
  } catch (e) { /* sin audio */ }
}
const FACTION_SOUND = { 'Horda de Colmillo Rojo': ['square', 110], 'Bosque Onírico': ['sine', 660], 'Concilio de la Torre Gris': ['triangle', 440], 'La Grieta': ['sawtooth', 90],
  'Orden del Sol Partido': ['square', 520], 'Abismo de Coral': ['sine', 300], 'Clanes de Hondaforja': ['triangle', 160], 'Reino Velado': ['sawtooth', 140], 'Consorcio de Engranajes': ['square', 380],
  'Hermandad del Velo': ['triangle', 250], 'Tribus de las Dunas': ['sawtooth', 200] };

// ---------------- estado de menú ----------------
const $ = id => document.getElementById(id);
const MODES = [
  { id: 'grieta_ceniza', name: 'La Grieta de Ceniza', desc: '5v5 clásico · 3 carriles, jungla, dragones, Heraldo y Señor · 25-35 min' },
  { id: 'puente_niebla', name: 'Puente de la Niebla', desc: '5v5 ARAM · un carril, campeón aleatorio, Bola de Nieve · 15-22 min' },
  { id: 'ruinas_eclipse', name: 'Ruinas del Eclipse', desc: '3v3 dominio · captura altares, 500 puntos · 12-18 min' },
  { id: 'tutorial', name: 'Tutorial', desc: 'Aprende lo básico en 5 pasos en la Grieta contra bots fáciles' },
];
const CLASS_COL = { Tanque: '#8d6e63', Luchador: '#e57373', Mago: '#9575cd', Tirador: '#81c784', Asesino: '#546e7a', Soporte: '#4dd0e1' };
const state = { mode: 'grieta_ceniza', diff: 'normal', champ: null, rerolls: 2 };
// Ficha de campeón (G): botón flotante y doble clic en la tarjeta; guarda el aspecto elegido por campeón
const fichas = montarFichas({ onElegir: (id, skin) => { state.champ = id; state.skin = skin; renderMenu(); } });

function renderMenu() {
  $('maps').innerHTML = MODES.map(m => `<div class="card map-card ${state.mode === m.id ? 'sel' : ''}" data-map="${m.id}"><b>${m.name}</b><div class="muted">${m.desc}</div></div>`).join('');
  $('diffs').innerHTML = [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']].map(([id, n]) => `<div class="card ${state.diff === id ? 'sel' : ''}" data-diff="${id}">${n}</div>`).join('');
  const aram = state.mode === 'puente_niebla';
  $('aramNote').textContent = aram ? `(ARAM: campeón aleatorio — te quedan ${state.rerolls} cambios)` : '';
  $('champs').innerHTML = CHAMPIONS.map(c => `<div class="card champ ${state.champ === c.id ? 'sel' : ''}" data-champ="${c.id}" style="${aram && state.champ !== c.id ? 'opacity:.35' : ''}">
    <div class="ico" style="background:${CLASS_COL[c.class]}">${c.name[0]}</div><b>${c.name}</b><small>${c.class} · ${c.race}</small><small>${c.role}</small><small>${'★'.repeat(c.difficulty)}</small></div>`).join('');
  document.querySelectorAll('[data-map]').forEach(e => e.onclick = () => { state.mode = e.dataset.map; if (state.mode === 'puente_niebla') { state.rerolls = 2; state.champ = rndChamp(); } renderMenu(); });
  document.querySelectorAll('[data-diff]').forEach(e => e.onclick = () => { state.diff = e.dataset.diff; renderMenu(); });
  document.querySelectorAll('[data-champ]').forEach(e => e.onclick = () => { if (aram) return; state.champ = e.dataset.champ; renderMenu(); });
  const sums = Object.entries(SUMMONERS).filter(([id]) => id !== 'snowball');
  for (const i of [0, 1]) { const sel = $('sum' + i); if (!sel.options.length) { sel.innerHTML = sums.map(([id, s]) => `<option value="${id}">${s.name}</option>`).join(''); sel.value = i ? 'ignite' : 'flash'; } sel.disabled = aram; }
  if (state.mode === 'tutorial') { $('sum0').value = 'flash'; $('sum1').value = 'smite'; }
  renderDetail(); $('play').disabled = !state.champ;
}
function rndChamp() { return CHAMPIONS[Math.floor(Math.random() * CHAMPIONS.length)].id; }
function renderDetail() {
  const c = CHAMP_BY_ID[state.champ]; if (!c) { $('detail').innerHTML = '<i>Selecciona un campeón para ver sus habilidades.</i>'; return; }
  const b = c.base_stats;
  $('detail').innerHTML = `<h2 style="margin-top:0">${c.name}, <span style="color:#ccc">${c.title}</span></h2>
   <div><span class="pill">${c.class}</span><span class="pill">${c.race}</span><span class="pill">${c.faction}</span><span class="pill">${c.role}</span><span class="pill">Daño ${c.damage}</span><span class="pill">${c.resource}</span></div>
   <p class="muted"><i>${c.lore}</i></p>
   <div class="muted">Vida ${b.hp} (+${b.hp_g}) · AD ${b.ad} · Armadura ${b.armor} · RM ${b.mr} · Vel. ataque ${b.attack_speed} · Vel. ${b.ms} · Alcance ${b.range}</div>
   <div class="ab"><b>Pasiva — ${c.passive.name}:</b> ${c.passive.desc}</div>
   ${c.abilities.map(a => `<div class="ab"><b>${a.key} — ${a.name}</b> <span class="muted">(${a.type}, CD ${a.cooldown.join('/')} s${a.cost ? ', coste ' + a.cost : ''})</span><br>${a.desc}<br><span class="muted">Valor ${a.base.join('/')} ${Object.entries(a.ratio).map(([k, v]) => `+ ${Math.round(v * 100)}% ${k.toUpperCase()}`).join(' ')}</span></div>`).join('')}
   ${state.mode === 'puente_niebla' ? `<button id="reroll" ${state.rerolls ? '' : 'disabled'}>🎲 Cambiar campeón (${state.rerolls})</button>` : ''}`;
  const rr = $('reroll'); if (rr) rr.onclick = () => { if (state.rerolls > 0) { state.rerolls--; state.champ = rndChamp(); renderMenu(); } };
}

// ---------------- partida ----------------
let G = null, R = null, paused = false, tutorial = null, touch = null;
const canvas = $('game');
let dpr = 1;
// el lienzo HUD mide innerWidth×dpr píxeles (nítido en móvil, tope 2); el renderer dibuja en px CSS vía setDpr
function resize() { dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr); if (R) R.setDpr(dpr); }
addEventListener('resize', resize); resize();

function startGame() {
  const tut = state.mode === 'tutorial';
  const mapId = tut ? 'grieta_ceniza' : state.mode;
  const sums = mapId === 'puente_niebla' ? ['flash', 'snowball'] : [$('sum0').value, $('sum1').value];
  G = new Game({ mapId, difficulty: tut ? 'facil' : state.diff, picks: { 0: [state.champ] }, playerSummoners: sums, seed: (Date.now() % 1e9) | 0 });
  window.G = G;
  if (fichas.skins[state.champ]) G.player.skin = fichas.skins[state.champ];   // Rakhar: 'felino' | 'lagarto'
  S.mobile = esMovil(); document.body.classList.toggle('mobile', S.mobile); // ANTES de World3D y Renderer: ambos leen settings.mobile
  R = new Renderer(canvas, G, S); R.setDpr(dpr);
  if (S.mobile) {
    if (touch) touch.destroy();
    touch = initTouch({ canvas, root: $('touchUI'), S, getG: () => G, getR: () => R, cast, summoner, say, toggleShop: on => UI.toggleShop(on), toggleScore: on => { $('score').classList.toggle('on', on); if (on) renderScore(); }, togglePause, ping: (x, y) => { R.pings.push({ x, y, age: 0 }); tone(990, 0.15); }, zoomLimits: () => [R.r3d ? 0.6 : 0.8, R.r3d ? 1.6 : 1.15] });
    S.touchForce = TOUCH_FORCED;
    try { const lk = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (lk && lk.catch) lk.catch(() => {}); } catch (e) { /* sin bloqueo de orientación */ }
  }
  tutorial = tut ? { steps: [
    ['Haz clic derecho en el suelo para moverte y sobre un enemigo para atacarlo', false],
    ['Lanza una habilidad con Q, W, E o R (sube rangos con Ctrl+tecla o con el botón +)', false],
    ['Da el último golpe a un súbdito enemigo para ganar oro (CS)', false],
    ['Coloca un guardián con la tecla 4 en un matorral', false],
    ['Usa Castigo (F) sobre un monstruo de la jungla', false]], done: false } : null;
  if (tutorial) wrapTutorial();
  $('menu').classList.remove('on');
  $('loading').classList.add('on');
  const syn = [0, 1].map(t => (G.synergy[t] || []).map(s => `${s.faction} ×${s.count}`).join(', ') || 'ninguna');
  $('loadInfo').innerHTML = [0, 1].map(t => `<h2 class="t${t}">${t ? 'Crepúsculo' : 'Aurora'} <span class="muted">· sinergias de facción: ${syn[t]}</span></h2><div class="row">` +
    G.champs.filter(c => c.team === t).map(c => `<div class="card champ" style="width:170px"><div class="ico" style="background:${CLASS_COL[c.data.class]}">${c.name[0]}</div><b>${c.name}${c.isPlayer ? ' (tú)' : ''}</b><small>${c.data.class} · ${c.data.race}</small><small>${c.data.faction}</small><small>Rol: ${c.role}</small></div>`).join('') + '</div>').join('');
  if (S.colorblind) document.body.classList.add('cb');
  const go = () => { $('loading').classList.remove('on'); last = performance.now(); requestAnimationFrame(loop); tone(220, 0.4, 'triangle', 1, 220); };
  const t0 = performance.now();
  let r3d = null;
  if (S.render3d !== false) {
    try { r3d = new World3D($('world'), G, S); } catch (e) { console.warn('WebGL no disponible, uso 2D', e); r3d = null; }
  }
  if (S.mobile && touch) touch.refresh();
  if (r3d) {
    $('loadInfo').insertAdjacentHTML('afterbegin', '<p id="loadBar" class="muted">Cargando modelos 3D…</p>');
    r3d.load((n, tot, name) => { const b = $('loadBar'); if (b) b.textContent = `Cargando modelos 3D… ${n}/${tot} (${name})`; })
      .then(() => { R.setWorld3D(r3d); window.__cdc.r3d = r3d; window.__cdc.vfx = initVfx(r3d, G, S); setTimeout(go, Math.max(0, 1200 - (performance.now() - t0))); })
      .catch(e => { console.warn('Fallo al cargar modelos 3D, uso 2D', e); $('world').style.display = 'none'; setTimeout(go, 300); });
  } else { $('world').style.display = 'none'; setTimeout(go, 1500); }
}

let last = 0, acc = 0, hover = null;
const mouse = { x: 0, y: 0, wx: 0, wy: 0 }, held = {};
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!paused && !G.over) { acc += dt; let n = 0; while (acc >= TICK && n++ < 6) { G.step(); acc -= TICK; } if (n >= 6) acc = 0; }
  edgeScroll(dt);
  if (held.right && G.player && performance.now() - held.rightT > 120) { held.rightT = performance.now(); rightClick(true); }
  [mouse.wx, mouse.wy] = R.s2w(mouse.x, mouse.y); hover = pickUnit(mouse.wx, mouse.wy);
  R.mouse = mouse; R.draw(dt, hover); sounds(); if (tutorial) renderTutorial();
  if ($('shop').classList.contains('on')) renderShop(false);
  if ($('score').classList.contains('on')) renderScore();
  if (G.over) return showEnd();
  requestAnimationFrame(loop);
}
let soundT = 0;
function sounds() {
  const p = G.player; if (!p) return;
  for (const e of G.events) { if (e.t <= soundT) continue;
    if (e.type === 'cast' && e.u === p) { const [w, f] = FACTION_SOUND[p.data.faction] || ['sine', 400]; tone(f * (e.k === 'R' ? 0.75 : 1), e.k === 'R' ? 0.35 : 0.12, w, 1, e.k === 'R' ? -f / 2 : 60); }
    if (e.type === 'cast' && e.u !== p && e.k === 'R' && dist(e.u, p) < 2000) { const [w, f] = FACTION_SOUND[e.u.data.faction] || ['sine', 400]; tone(f * 0.6, 0.3, w, 0.7, -f / 3); }
    if (e.type === 'dmg' && e.tgt === p && e.amt > 40) tone(90, 0.06, 'square', 0.6);
    if (e.type === 'kill' && (e.killer === p || e.victim === p)) tone(e.killer === p ? 880 : 140, 0.35, 'triangle', 1.3, e.killer === p ? 440 : -60);
    if (e.type === 'announce') tone(330, 0.25, 'sawtooth', 0.5, 110);
    if (e.type === 'levelup' && e.u === p) { tone(523, 0.1); setTimeout(() => tone(659, 0.1), 90); setTimeout(() => tone(784, 0.15), 180); }
    if (e.type === 'buy' && e.u === p) tone(1200, 0.08, 'sine', 0.8, 400);
  }
  soundT = G.t;
}

// ---------------- selección de objetivos ----------------
function pickUnit(wx, wy, filter) {
  const team = G.player ? G.player.team : 0; let best = null, bd = 1e9;
  for (const u of G.units) {
    if (!u.alive || (u.team !== team && !G.isVisibleTo(team, u)) || u === G.player) continue;
    if (filter && !filter(u)) continue;
    const d = Math.hypot(u.x - wx, u.y - wy) - u.r; if (d < 60 / (R.cam.zoom) && d < bd) { bd = d; best = u; }
  }
  return best;
}
function nearestTo(wx, wy, r, f) {
  const team = G.player.team; let best = null, bd = r;
  for (const u of G.units) { if (!u.alive || !G.isVisibleTo(team, u) || !f(u)) continue; const d = Math.hypot(u.x - wx, u.y - wy) - u.r; if (d < bd) { bd = d; best = u; } }
  return best;
}
function onMinimap(x, y) { const m = R.mini; return m && x >= m.x0 && y >= m.y0 && x <= m.x0 + m.w && y <= m.y0 + m.h; }
function miniToWorld(x, y) { const m = R.mini; return [(x - m.x0) / m.sx, (y - m.y0) / m.sx]; }

function rightClick(repeat) {
  const p = G.player; if (!p || !p.alive) return;
  if (onMinimap(mouse.x, mouse.y)) { const [x, y] = miniToWorld(mouse.x, mouse.y); G.cmdMove(p, x, y); return; }
  const t = hover && hover.team !== p.team && !(hover.structure && !G.isStructureTargetable(hover)) ? hover : null;
  if (t) { if (p.target !== t) G.cmdAttack(p, t); if (!repeat) R.clickFx.push({ x: t.x, y: t.y, col: '#ff5252', age: 0 }); if (tutorial) tutorial.steps[0][1] = true; }
  else { G.cmdMove(p, mouse.wx, mouse.wy); if (!repeat) R.clickFx.push({ x: mouse.wx, y: mouse.wy, col: '#69f0ae', age: 0 }); }
}
function aimFor(kind) {
  const p = G.player, aim = { x: mouse.wx, y: mouse.wy };
  if (kind.t === 'unit') aim.unit = (hover && hover.team !== p.team && !hover.structure && (!kind.champs || hover.kind === 'champ')) ? hover :
    nearestTo(mouse.wx, mouse.wy, 350, u => u.team !== p.team && !u.structure && u.kind !== 'ward' && (!kind.champs || u.kind === 'champ'));
  if (kind.t === 'ally') aim.unit = hover && hover.team === p.team && hover.kind === 'champ' ? hover : nearestTo(mouse.wx, mouse.wy, 250, u => u.team === p.team && u.kind === 'champ') || p;
  return aim;
}
let pending = null; // lanzamiento normal (no rápido)
/** Lanza una habilidad. `aim` opcional (táctil): con él no hay lanzamiento normal/pendiente, sale directo. */
function cast(key, aim) {
  const p = G.player; if (!p || !p.alive) return;
  const kab = p.kit[key];
  if (!p.ranks[key]) return say(S.mobile ? 'Habilidad sin aprender (mantén pulsado el botón)' : 'Habilidad sin aprender (Ctrl+' + key + ')');
  if (aim) return doCast(key, aim);
  if (!S.quickCast && kab.t !== 'self' && !(p.recast[key] > G.t)) { pending = { kind: 'ab', key }; R.rangeHint = kab.range || p.ab[key].range; return; }
  doCast(key);
}
function doCast(key, aim) {
  const p = G.player, kab = p.kit[key]; aim = aim || aimFor(kab);
  const ok = G.cmdCast(p, key, aim);
  if (!ok) { const cd = p.cds[key] || 0; say(cd > 0 ? `En enfriamiento (${cd.toFixed(1)} s)` : !G.costOk(p, key) ? 'Recurso insuficiente' : kab.t === 'unit' ? 'Sin objetivo válido en alcance' : 'No se puede lanzar ahora'); }
  else if (tutorial) tutorial.steps[1][1] = true;
}
/** Hechizo de invocador i. `aim` opcional (táctil); Castigo busca el monstruo/súbdito más cercano al punto. */
function summoner(i, aim) {
  const p = G.player; if (!p || !p.alive) return; const sid = p.summoners[i], sp = SUMMONERS[sid];
  const given = !!aim; aim = aim || aimFor(sp);
  if (sid === 'smite') aim.unit = !given && hover && hover.team !== p.team && !hover.structure && hover.kind !== 'champ' ? hover : nearestTo(aim.x, aim.y, 400, u => u.team !== p.team && (u.kind === 'monster' || u.kind === 'minion'));
  if (!G.cmdSummoner(p, i, aim)) say(p.sumCd[i] > 0 ? `${sp.name} en enfriamiento (${Math.ceil(p.sumCd[i])} s)` : `${sp.name}: sin objetivo válido`);
}
function say(txt) { if (G.player) R.texts.push({ x: G.player.x, y: G.player.y - 150, txt, col: '#ffcdd2', age: 0 }); }

// ---------------- entrada ----------------
canvas.addEventListener('contextmenu', e => e.preventDefault());
// en móvil, touch.js lleva los punteros táctiles; esta bandera neutraliza los mousedown/mousemove sintéticos que algún navegador emite tras un toque
let touchActive = false;
canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { touchActive = true; if (S.mobile) e.preventDefault(); } else if (e.pointerType === 'mouse') touchActive = false; });
// posición del ratón en el mundo y unidad bajo el cursor, al momento (no solo una vez por fotograma)
function updateMouseWorld() { if (!R) return; [mouse.wx, mouse.wy] = R.s2w(mouse.x, mouse.y); hover = pickUnit(mouse.wx, mouse.wy); }
canvas.addEventListener('mousemove', e => { if (touchActive) return; mouse.x = e.clientX; mouse.y = e.clientY; updateMouseWorld(); if (held.left && onMinimap(mouse.x, mouse.y)) { const [x, y] = miniToWorld(mouse.x, mouse.y); R.cam.locked = false; R.cam.x = x; R.cam.y = y; } });
canvas.addEventListener('mousedown', e => {
  if (!G || touchActive) return; const p = G.player; mouse.x = e.clientX; mouse.y = e.clientY; updateMouseWorld();
  if (e.button === 2) { if (pending) { pending = null; R.rangeHint = 0; return; } held.right = true; held.rightT = performance.now(); rightClick(false); return; }
  if (e.button !== 0) return;
  held.left = true;
  const hr = R.hudRects.find(r => mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h);
  if (hr) { if (hr.act === 'level') G.cmdLevel(p, hr.key); else if (hr.act === 'ability') (e.ctrlKey ? G.cmdLevel(p, hr.key) : cast(hr.key)); else if (hr.act === 'summoner') summoner(hr.i); else if (hr.act === 'shop' || hr.act === 'item') UI.toggleShop(true); return; }
  if (onMinimap(mouse.x, mouse.y)) { if (held.ping) { const [x, y] = miniToWorld(mouse.x, mouse.y); R.pings.push({ x, y, age: 0 }); tone(990, 0.15); return; } const [x, y] = miniToWorld(mouse.x, mouse.y); R.cam.locked = false; R.cam.x = x; R.cam.y = y; return; }
  if (held.ping) { R.pings.push({ x: mouse.wx, y: mouse.wy, age: 0 }); tone(990, 0.15); return; }
  if (pending) { if (pending.kind === 'ab') doCast(pending.key); pending = null; R.rangeHint = 0; return; }
  if (held.amove && p) { G.cmdMove(p, mouse.wx, mouse.wy, true); R.clickFx.push({ x: mouse.wx, y: mouse.wy, col: '#ff8a65', age: 0 }); held.amove = false; return; }
});
addEventListener('mouseup', e => { if (e.button === 2) held.right = false; if (e.button === 0) held.left = false; });
canvas.addEventListener('wheel', e => { if (!R) return; R.cam.zoom = Math.max(R.r3d ? 0.6 : 0.8, Math.min(R.r3d ? 1.6 : 1.15, R.cam.zoom * (e.deltaY > 0 ? 0.93 : 1.07))); e.preventDefault(); }, { passive: false });
let rebinding = null;
addEventListener('keydown', e => {
  if (rebinding) { S.keys[rebinding] = e.code; rebinding = null; save(); renderOptions(); e.preventDefault(); return; }
  if (!G || $('menu').classList.contains('on')) return;
  const K = S.keys, code = e.code, p = G.player; updateMouseWorld();
  if (code === 'Escape') { e.preventDefault(); if ($('shop').classList.contains('on')) return UI.toggleShop(false); if (pending) { pending = null; R.rangeHint = 0; return; } return togglePause(); }
  if (paused) return;
  if (code === K.score) { e.preventDefault(); $('score').classList.add('on'); renderScore(); return; }
  if (code === K.shop) { UI.toggleShop(!$('shop').classList.contains('on')); return; }
  if ($('shop').classList.contains('on')) return;
  for (const k of ['Q', 'W', 'E', 'R']) if (code === K['cast' + k]) { e.preventDefault(); if (e.ctrlKey || e.metaKey) G.cmdLevel(p, k); else if (!e.repeat) cast(k); return; }
  if (code === K.sum0 && !e.repeat) return summoner(0);
  if (code === K.sum1 && !e.repeat) return summoner(1);
  if (code === K.ward && p) { if (G.cmdWard(p, mouse.wx, mouse.wy)) { if (tutorial) tutorial.steps[3][1] = true; } else say(p.wardCharges ? 'Demasiado lejos (máx. 600)' : 'Sin cargas de guardián'); return; }
  if (code === K.recall && p) { if (!G.cmdRecall(p)) say('No puedes volver ahora'); return; }
  if (code === K.lock) { R.cam.locked = !R.cam.locked; say(R.cam.locked ? 'Cámara bloqueada' : 'Cámara libre'); return; }
  if (code === K.center) { e.preventDefault(); R.centerHeld = true; return; }
  if (code === K.attackMove) { held.amove = true; return; }
  if (code === K.stop && p) { G.cmdStop(p); return; }
  if (code === K.ping) { held.ping = true; return; }
  if (code.startsWith('Arrow')) held[code] = true;
});
addEventListener('keyup', e => {
  if (!G) return; const K = S.keys;
  if (e.code === K.score) $('score').classList.remove('on');
  if (e.code === K.center) R.centerHeld = false;
  if (e.code === K.ping) held.ping = false;
  if (e.code.startsWith('Arrow')) held[e.code] = false;
});
function edgeScroll(dt) {
  if (!R || R.cam.locked || R.centerHeld || S.mobile) return; // sin desplazamiento por borde en móvil const sp = 2200 * dt, m = 12;
  let dx = 0, dy = 0;
  if (mouse.x < m || held.ArrowLeft) dx = -1; if (mouse.x > canvas.width - m || held.ArrowRight) dx = 1;
  if (mouse.y < m || held.ArrowUp) dy = -1; if (mouse.y > canvas.height - m || held.ArrowDown) dy = 1;
  R.cam.x = Math.max(0, Math.min(G.map.W, R.cam.x + dx * sp)); R.cam.y = Math.max(0, Math.min(G.map.H, R.cam.y + dy * sp));
}

// ---------------- tienda ----------------
const UI = window.UI = {
  toggleShop(on) { if (!G) return; $('shop').classList.toggle('on', on); if (on) renderShop(true); },
};
let shopSig = '';
function renderShop(force) {
  const p = G.player; const can = !p.alive || G.inFountain(p);
  const sig = `${Math.floor(p.gold)}|${p.items.length}|${can}`; if (!force && sig === shopSig) return; shopSig = sig;
  $('shopGold').textContent = `— ${Math.floor(p.gold)} de oro`;
  $('shopNote').textContent = can ? 'Estás en la fuente: puedes comprar.' : 'Solo puedes comprar en tu fuente o mientras estás muerto (B para volver a base).';
  const rec = new Set(BUILDS[p.data.class]);
  $('shopItems').innerHTML = ITEMS.map(it => `<div class="card item ${rec.has(it.id) ? 'rec' : ''} ${(!can || p.gold < it.cost || p.items.length >= 6) ? 'off' : ''}" data-buy="${it.id}">
    <b>${it.name}</b> <span style="float:right;color:#ffd54f">${it.cost}</span><br>${Object.entries(it.stats).map(([a, b]) => `+${b < 1 ? Math.round(b * 100) + '%' : b} ${STAT_ES[a] || a}`).join(' · ')}
    ${it.unique ? `<br><i class="muted">${it.unique}</i>` : ''}${rec.has(it.id) ? '<br><span style="color:#81c784">Recomendado</span>' : ''}</div>`).join('');
  $('shopInv').innerHTML = p.items.map((it, i) => `<div class="card item" data-sell="${i}"><b>${it.name}</b><br>vender: ${Math.round(it.cost * 0.7)}</div>`).join('') || '<span class="muted">Vacío</span>';
  document.querySelectorAll('[data-buy]').forEach(e => e.onclick = () => { if (!G.buy(p, e.dataset.buy)) say('No puedes comprarlo ahora'); renderShop(true); });
  document.querySelectorAll('[data-sell]').forEach(e => e.onclick = () => { G.sell(p, +e.dataset.sell); renderShop(true); });
}
const STAT_ES = { ad: 'AD', ap: 'PH', hp: 'vida', armor: 'armadura', mr: 'RM', as: 'vel. ataque', ms: 'vel. mov.', crit: 'crítico', ah: 'AH', mpen: 'pen. mágica', heal_power: 'poder de curación' };

// ---------------- marcador ----------------
function scoreTable() {
  return [0, 1].map(t => `<h2 class="t${t}">${t ? 'Crepúsculo' : 'Aurora'} — ${G.kills[t]} asesinatos · ${G.towersDown[t]} torres · ${G.dragons[t].length} dragones${G.altars.length ? ' · ' + Math.floor(G.points[t]) + ' puntos' : ''}</h2>
    <table><tr><th>Campeón</th><th>Rol</th><th>Nv</th><th>K/D/A</th><th>CS</th><th>Oro</th><th>Daño a campeones</th><th>Objetos</th></tr>` +
    G.champs.filter(c => c.team === t).map(c => `<tr><td>${c.name}${c.isPlayer ? ' <b>(tú)</b>' : ''}${c.alive ? '' : ` <span class="muted">(${Math.ceil(c.respawnAt - G.t)} s)</span>`}</td><td>${c.role}</td><td>${c.level}</td><td>${c.stats.k}/${c.stats.d}/${c.stats.a}</td><td>${c.stats.cs}</td><td>${Math.round(c.stats.gold)}</td><td>${Math.round(c.stats.champDmg)}</td><td class="muted">${c.items.map(i => i.name).join(', ')}</td></tr>`).join('') + '</table>').join('');
}
function renderScore() { $('scoreBody').innerHTML = scoreTable(); }

// ---------------- pausa y opciones ----------------
function togglePause() { paused = !paused; $('pause').classList.toggle('on', paused); if (paused) renderOptions(); }
function renderOptions() {
  $('optsBody').innerHTML = `
   <label><input type="checkbox" id="oQuick" ${S.quickCast ? 'checked' : ''}> Lanzamiento rápido (la habilidad sale al pulsar la tecla)</label><br>
   <label><input type="checkbox" id="oCb" ${S.colorblind ? 'checked' : ''}> Modo daltónico (azul / naranja)</label><br>
   <label>Escala de interfaz <input type="range" id="oUi" min="0.75" max="1.25" step="0.05" value="${S.uiScale}"> ${Math.round(S.uiScale * 100)}%</label><br>
   <label>Volumen <input type="range" id="oVol" min="0" max="1" step="0.05" value="${S.volume}"></label><br>
   <label><input type="checkbox" id="o3d" ${S.render3d !== false ? 'checked' : ''}> Gráficos 3D (modelos glTF; se aplica en la próxima partida)</label><br>
   <label>Controles táctiles <select id="oTouch">${[['auto', 'Automático (pantalla táctil)'], ['on', 'Siempre'], ['off', 'Nunca']].map(([v, n]) => `<option value="${v}" ${S.touch === v ? 'selected' : ''}>${n}</option>`).join('')}</select> <span class="muted">(próxima partida)</span></label><br>
   <label>Efectos visuales <select id="oVfx">${[['alto', 'Alto'], ['bajo', 'Bajo'], ['off', 'Desactivados']].map(([v, n]) => `<option value="${v}" ${S.vfx === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
   <h2>Teclas <span class="muted">(clic y pulsa la nueva tecla)</span></h2>
   <table>${Object.keys(DEFAULT_KEYS).map(a => `<tr><td>${ACTION_NAMES[a]}</td><td><button data-bind="${a}">${rebinding === a ? '…pulsa una tecla…' : S.keys[a].replace('Key', '').replace('Digit', '')}</button></td></tr>`).join('')}</table>
   <p><button id="oReset">Restaurar teclas</button></p>`;
  $('oQuick').onchange = e => { S.quickCast = e.target.checked; save(); };
  $('oCb').onchange = e => { S.colorblind = e.target.checked; document.body.classList.toggle('cb', S.colorblind); save(); };
  $('oUi').oninput = e => { S.uiScale = +e.target.value; save(); };
  $('oVol').oninput = e => { S.volume = +e.target.value; save(); };
  $('o3d').onchange = e => { S.render3d = e.target.checked; save(); };
  $('oTouch').onchange = e => { S.touch = e.target.value; save(); };
  $('oVfx').onchange = e => { S.vfx = e.target.value; save(); };
  $('oReset').onclick = () => { S.keys = { ...DEFAULT_KEYS }; save(); renderOptions(); };
  document.querySelectorAll('[data-bind]').forEach(b => b.onclick = () => { rebinding = b.dataset.bind; renderOptions(); });
  const dups = Object.values(S.keys).filter((v, i, a) => a.indexOf(v) !== i);
  if (dups.length) $('optsBody').insertAdjacentHTML('beforeend', `<p style="color:#ff8a80">Atención: hay teclas repetidas (${dups.join(', ')}). Reasigna una de ellas.</p>`);
  if ($('surrBtn')) $('surrBtn').disabled = !G || G.t < 15 * 60;
}
$('resumeBtn').onclick = () => togglePause();
// en móvil el marcador se cierra tocando fuera de su panel (el botón ☰ queda bajo el velo)
$('score').addEventListener('click', e => { if (S.mobile && e.target === $('score')) $('score').classList.remove('on'); });
$('quitBtn').onclick = () => location.reload();
$('surrBtn').onclick = () => {
  const p = G.player, mates = G.champs.filter(c => c.team === p.team), need = Math.ceil(0.8 * mates.length);
  const behind = G.kills[p.team] < G.kills[1 - p.team] || G.towersDown[p.team] < G.towersDown[1 - p.team];
  const votes = 1 + mates.filter(c => !c.isPlayer && behind).length;
  if (votes >= need) { togglePause(); G.endGame(1 - p.team); } else alert(`Votación fallida: ${votes}/${mates.length} (se necesitan ${need}).`);
};
$('optsBtn').onclick = () => { $('pause').classList.add('on'); $('pauseTitle').textContent = 'Opciones'; renderOptions(); $('resumeBtn').onclick = () => $('pause').classList.remove('on'); };
$('helpBtn').onclick = () => $('help').classList.add('on');
$('helpBody').innerHTML = `<table>
  <tr><td><span class="kbd">Clic derecho</span></td><td>Moverse / atacar (mantener para seguir moviéndote)</td></tr>
  <tr><td><span class="kbd">Q</span> <span class="kbd">W</span> <span class="kbd">E</span> <span class="kbd">R</span></td><td>Habilidades, apuntan al cursor (lanzamiento rápido; se puede cambiar en Opciones)</td></tr>
  <tr><td><span class="kbd">Ctrl</span>+<span class="kbd">Q/W/E/R</span></td><td>Subir rango de habilidad (o clic en el +)</td></tr>
  <tr><td><span class="kbd">D</span> <span class="kbd">F</span></td><td>Hechizos de invocador</td></tr>
  <tr><td><span class="kbd">A</span>+clic</td><td>Movimiento con ataque</td></tr>
  <tr><td><span class="kbd">S</span></td><td>Detenerse</td></tr>
  <tr><td><span class="kbd">4</span></td><td>Guardián en el cursor (2 cargas)</td></tr>
  <tr><td><span class="kbd">B</span></td><td>Volver a base (8 s; se cancela al moverte o recibir daño)</td></tr>
  <tr><td><span class="kbd">P</span></td><td>Tienda (en la fuente o muerto)</td></tr>
  <tr><td><span class="kbd">Tab</span></td><td>Marcador (mantener)</td></tr>
  <tr><td><span class="kbd">Y</span> / <span class="kbd">Espacio</span></td><td>Bloquear cámara / centrar (con la cámara libre: bordes de pantalla o flechas)</td></tr>
  <tr><td><span class="kbd">G</span>+clic</td><td>Señal en el mapa o minimapa</td></tr>
  <tr><td>Rueda</td><td>Zoom</td></tr>
  <tr><td>Minimapa</td><td>Clic izquierdo: mover la cámara · clic derecho: mover al campeón</td></tr>
  <tr><td><span class="kbd">Esc</span></td><td>Pausa / opciones / rendición (desde el minuto 15)</td></tr></table>
  <p class="muted">Todas las teclas se pueden reasignar en Opciones.</p>`;

// ---------------- tutorial ----------------
function wrapTutorial() {
  const orig = G.cmdSummoner.bind(G);
  G.cmdSummoner = (u, i, aim) => { const r = orig(u, i, aim); if (r && u === G.player && u.summoners[i] === 'smite') tutorial.steps[4][1] = true; return r; };
}
function renderTutorial() {
  const p = G.player; if (p.stats.cs > 0) tutorial.steps[2][1] = true;
  const all = tutorial.steps.every(s => s[1]);
  const el = $('tutorial'); el.style.display = 'block';
  el.innerHTML = `<b style="color:#c9a227">Tutorial</b><ol>${tutorial.steps.map(([t, d]) => `<li class="${d ? 'done' : ''}">${t}</li>`).join('')}</ol>${all ? '<b style="color:#69f0ae">¡Tutorial completado! Ahora destruye el Nexo enemigo.</b>' : '<span class="muted">Los monstruos de jungla están entre los carriles.</span>'}`;
  if (all && !tutorial.done) { tutorial.done = true; tone(784, 0.4, 'triangle'); }
}

// ---------------- fin de partida ----------------
function showEnd() {
  const p = G.player, win = p && G.winner === p.team;
  $('end').classList.add('on'); $('tutorial').style.display = 'none';
  $('endTitle').textContent = win ? '¡VICTORIA!' : 'DERROTA';
  $('endBody').innerHTML = `<p class="muted">Duración ${Math.floor(G.t / 60)}:${String(Math.floor(G.t % 60)).padStart(2, '0')} · ${MAPS.find(m => m.id === G.map.id).name}</p>${scoreTable()}
    <h2>Oro del equipo por minuto</h2><canvas id="goldGraph" width="820" height="200" style="background:#0e1419;border:1px solid #2b3742"></canvas>`;
  const gc = $('goldGraph').getContext('2d'), H = G.goldHistory, max = Math.max(1, ...H[0], ...H[1]), n = Math.max(2, H[0].length);
  [0, 1].forEach(t => { gc.strokeStyle = t ? (S.colorblind ? '#ff9800' : '#ef5350') : '#42a5f5'; gc.lineWidth = 3; gc.beginPath();
    H[t].forEach((v, i) => { const x = 10 + i * 800 / (n - 1), y = 190 - v / max * 180; i ? gc.lineTo(x, y) : gc.moveTo(x, y); }); gc.stroke(); });
  tone(win ? 660 : 160, 0.8, 'triangle', 1.5, win ? 330 : -60);
}

$('play').onclick = () => { if (state.champ) startGame(); };
renderMenu();
// acceso para pruebas automatizadas
window.__cdc = { state, startGame, renderMenu, get G() { return G; }, get R() { return R; }, get touch() { return touch; }, cast, summoner, togglePause, UI, S };
