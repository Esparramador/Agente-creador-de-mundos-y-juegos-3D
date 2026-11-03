// Ficha de campeón en la selección (agente G). Se monta sola: crea <div id="fichas"> desde JS.
//   montarFichas({ data?, presentation?, R3?, onElegir? }) -> { abrir(id), cerrar(), skin, skins, el }
// Muestra retrato 3D girando (modelo desde window.__MODELS o fetch; sin modelo, retrato 2D con iniciales),
// clase/raza/rol, pasiva y las 4 habilidades con números reales, tipo de ataque, aspectos (fija u.skin a través
// de onElegir / fichas.skins) y «Ver ataques» (Attack + Cast en el retrato con el efecto de vfx.js).
// Responsive hasta 844×390. Sin tocar main.js: añade un botón «Ficha» flotante cuando hay campeón seleccionado.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { gsap } from 'gsap';
import { CHAMPIONS, PRESENTATION } from './data.js';
import { MODEL_MAP } from './models.js';
import { crearEfectos } from './vfx.js';

const TIPO = { melee: 'Cuerpo a cuerpo', ranged: 'A distancia', magic: 'Mágico' };
const CLASS_COL = { Tanque: '#8d6e63', Luchador: '#e57373', Mago: '#9575cd', Tirador: '#81c784', Asesino: '#546e7a', Soporte: '#4dd0e1' };
const CSS = `
#fichas{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 30% 40%,#2a1f12cc,#05070add 70%);backdrop-filter:blur(6px);font-family:'Segoe UI',Roboto,sans-serif;color:#e8e6e3}
#fichas.on{display:flex}
#fichas .fcard{display:grid;grid-template-columns:300px minmax(0,1fr);gap:0;width:min(960px,96vw);max-height:94vh;background:linear-gradient(160deg,#1a222b,#0e1419);border:1px solid #c9a227;border-radius:14px;box-shadow:0 30px 80px #000c,0 0 0 1px #c9a22733 inset;overflow:hidden;opacity:0;transform:translateY(18px) scale(.97)}
#fichas .fport{position:relative;background:radial-gradient(circle at 50% 35%,var(--fc,#c9a227) 0,#0b0f13 70%);min-height:300px}
#fichas .fport canvas{width:100%;height:100%;display:block}
#fichas .fport .ini{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:bold 120px Georgia,serif;color:#fff;text-shadow:0 0 40px var(--fc,#c9a227)}
#fichas .fport .tipo{position:absolute;left:12px;top:12px;padding:3px 10px;border-radius:12px;background:#000a;border:1px solid var(--fc,#c9a227);font-size:12px;letter-spacing:1px;text-transform:uppercase}
#fichas .fport .arma{position:absolute;left:12px;bottom:12px;right:12px;font-size:12px;color:#ddd;text-shadow:0 1px 2px #000}
#fichas .fbody{padding:18px 22px;overflow:auto;max-height:94vh}
#fichas h2{margin:0;color:#c9a227;font:600 28px Georgia,serif;letter-spacing:1px}
#fichas h2 span{color:#bbb;font-size:18px;font-weight:normal}
#fichas .pill{display:inline-block;padding:2px 9px;border-radius:10px;background:#263238;margin:3px 3px 0 0;font-size:12px}
#fichas .lore{color:#aab;font-style:italic;margin:10px 0 8px;font-size:13px}
#fichas .stats{color:#8a9;font-size:12px;margin-bottom:8px}
#fichas .ab{margin:6px 0;padding:7px 10px;background:#0e1419;border-left:3px solid var(--fc,#c9a227);font-size:13px;border-radius:0 6px 6px 0;transition:transform .15s,background .15s}
#fichas .ab:hover{background:#131b22;transform:translateX(3px)}
#fichas .ab b{color:#ffd54f}#fichas .ab .k{display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:5px;background:var(--fc,#c9a227);color:#111;font-weight:bold;margin-right:6px}
#fichas .ab .n{color:#8a9;font-size:12px}
#fichas .acciones{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
#fichas button{background:#1f2a33;color:#e8e6e3;border:1px solid #c9a227;border-radius:5px;padding:8px 14px;font-size:14px;cursor:pointer;transition:.12s}
#fichas button:hover{background:#2c3a45;transform:translateY(-1px)}
#fichas button.big{background:linear-gradient(#c9a227,#8a6d12);color:#111;font-weight:bold;border:none}
#fichas .aspectos{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
#fichas .aspectos button{padding:4px 10px;font-size:12px}
#fichas .aspectos button.sel{background:var(--fc,#c9a227);color:#111;border-color:transparent}
#fichas .cerrar{position:absolute;right:10px;top:8px;border:none;background:transparent;font-size:22px;color:#aaa;padding:4px 8px}
#fichaBtn{position:fixed;right:18px;bottom:18px;z-index:6;display:none;background:linear-gradient(#c9a227,#8a6d12);color:#111;font-weight:bold;border:none;border-radius:24px;padding:10px 18px;font-size:14px;box-shadow:0 8px 24px #000a;cursor:pointer}
#fichaBtn.on{display:block}
@media (max-width:900px),(max-height:480px){#fichas .fcard{grid-template-columns:170px minmax(0,1fr);max-height:96vh}#fichas .fport{min-height:0}#fichas .fbody{padding:10px 12px;max-height:96vh;font-size:12px}#fichas h2{font-size:18px}#fichas h2 span{font-size:13px}#fichas .ab{font-size:11px;padding:4px 8px;margin:3px 0}#fichas .lore{margin:4px 0;font-size:11px}#fichas .fport .ini{font-size:70px}#fichas .acciones{margin-top:6px}#fichas button{padding:5px 10px;font-size:12px}}
`;

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

export function montarFichas({ data = CHAMPIONS, presentation = PRESENTATION, R3 = null, onElegir = null, settings = null } = {}) {
  if (typeof document === 'undefined') return null;
  const PRES = Object.fromEntries((presentation || []).map(p => [p.id, p]));
  const byId = Object.fromEntries((data || []).map(c => [c.id, c]));
  const S = settings || (typeof window !== 'undefined' && window.__cdc?.S) || {};
  const skins = {};                      // id de campeón -> aspecto elegido (lo lee main.js para fijar u.skin)

  if (!document.getElementById('fichas-css')) { const st = document.createElement('style'); st.id = 'fichas-css'; st.textContent = CSS; document.head.appendChild(st); }
  let el = document.getElementById('fichas');
  if (!el) { el = document.createElement('div'); el.id = 'fichas'; document.body.appendChild(el); }
  let btn = document.getElementById('fichaBtn');
  if (!btn) { btn = document.createElement('button'); btn.id = 'fichaBtn'; btn.textContent = 'Ficha del campeón'; document.body.appendChild(btn); }

  // ---------- retrato 3D ----------
  let retrato = null;
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); const cache = {};
  async function cargarModelo(nombre) {
    if (!nombre) return null; if (cache[nombre]) return cache[nombre];
    try {
      let buf; const emb = window.__MODELS?.[nombre];
      if (emb) { const bin = atob(emb); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); buf = u8.buffer; }
      else { if (location.protocol === 'file:') return null;   // sin servidor solo valen los modelos incrustados
        const r = await fetch(`assets/models/${nombre}.glb`); if (!r.ok) return null; buf = await r.arrayBuffer(); }
      const gltf = await new Promise((res, rej) => loader.parse(buf, '', res, rej));
      return cache[nombre] = gltf;
    } catch (e) { return null; }
  }
  function modeloPara(c, skin) {
    const p = PRES[c.id]; const asp = p?.aspectos?.find(a => a.id === skin) || p?.aspectos?.[0];
    const fallback = MODEL_MAP[c.id];   // provisional hasta que D entregue champ_<id>.glb
    const lista = [asp?.modelo]; if (skin === 'lagarto') lista.push('lagarto'); if (fallback) lista.push(fallback.model);
    return { lista: lista.filter(Boolean), fallback };
  }
  function crearRetrato(canvas, c, skin, onReady) {
    destruirRetrato();
    const r = { canvas, t: 0, raf: 0 };
    try { r.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    r.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); r.renderer.outputColorSpace = THREE.SRGBColorSpace; r.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    r.scene = new THREE.Scene(); r.cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50); r.cam.position.set(0, 1.5, 5.2); r.cam.lookAt(0, 1.0, 0);
    const col = new THREE.Color(PRES[c.id]?.color || '#c9a227');
    r.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2e22, 1.4)); const key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(2, 4, 3); r.scene.add(key);
    const rim = new THREE.PointLight(col, 12, 10); rim.position.set(-2, 2, -2); r.scene.add(rim);
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18 })); suelo.rotation.x = -Math.PI / 2; r.scene.add(suelo);
    r.pivot = new THREE.Group(); r.scene.add(r.pivot);
    r.fx = crearEfectos(r.scene, { ...S, vfx: S.vfx === 'off' ? 'bajo' : (S.vfx ?? 'alto') });
    const { lista, fallback } = modeloPara(c, skin);
    (async () => {
      let gltf = null, usado = null; for (const n of lista) { gltf = await cargarModelo(n); if (gltf) { usado = n; break; } }
      if (r.muerto) return;
      if (!gltf) { onReady?.(false); return; }
      const inner = gltf.animations.length ? cloneSkinned(gltf.scene) : gltf.scene.clone();
      const b = new THREE.Box3().setFromObject(inner); const h = b.max.y - b.min.y || 1; const k = (fallback?.h ?? 2.1) / h;
      inner.scale.multiplyScalar(k); inner.position.y = -b.min.y * k;
      if (usado === fallback?.model && fallback?.tint != null) inner.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(fallback.tint), 0.45); } });
      const wrap = new THREE.Group(); wrap.add(inner); wrap.userData.inner = inner; r.pivot.add(wrap); r.pivot.userData.model = wrap;
      r.wrap = wrap; r.modelo = usado; r.clips = Object.fromEntries(gltf.animations.map(a => [a.name, a]));
      if (gltf.animations.length) { r.mixer = new THREE.AnimationMixer(inner); r.acciones = {}; for (const a of gltf.animations) r.acciones[a.name] = r.mixer.clipAction(a); }
      const anims = usado === fallback?.model && fallback?.anims ? { Idle: fallback.anims.idle, Run: fallback.anims.run, Attack: fallback.anims.attack, Cast: fallback.anims.cast, Death: fallback.anims.death } : (PRES[c.id]?.anims || {});
      r.anims = anims; reproducir(r, anims.Idle, false);
      r.fx.spawn(r.pivot, col.getHex());
      onReady?.(true);
    })();
    let last = performance.now();
    const loop = (now) => { if (r.muerto) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; r.t += dt;
      const w = canvas.clientWidth || 300, hgt = canvas.clientHeight || 300;
      if (canvas.width !== Math.floor(w * r.renderer.getPixelRatio()) || canvas.height !== Math.floor(hgt * r.renderer.getPixelRatio())) { r.renderer.setSize(w, hgt, false); r.cam.aspect = w / hgt; r.cam.updateProjectionMatrix(); }
      if (!r.quieto) r.pivot.rotation.y += dt * 0.6;
      r.mixer?.update(dt); r.fx.update(dt); const o = r.fx.aplicarShake(r.cam); r.renderer.render(r.scene, r.cam); if (o) r.cam.position.sub(o);
      r.raf = requestAnimationFrame(loop); };
    r.raf = requestAnimationFrame(loop);
    return retrato = r;
  }
  function reproducir(r, nombre, once) {
    if (!r?.mixer || !nombre) return false; const a = r.acciones[nombre]; if (!a) return false;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!once; a.play();
    if (r.cur && r.cur !== a) r.cur.crossFadeTo(a, 0.15, false); r.cur = a; return true;
  }
  function destruirRetrato() { if (!retrato) return; retrato.muerto = true; cancelAnimationFrame(retrato.raf); retrato.fx?.dispose(); retrato.renderer?.dispose(); retrato = null; }

  // ---------- «Ver ataques»: Attack y Cast (Q..R) con su efecto ----------
  function verAtaques(c) {
    const r = retrato; const p = PRES[c.id]; const col = new THREE.Color(p?.color || '#fff').getHex();
    const kinds = ['Q', 'W', 'E', 'R'].map(k => p?.vfx?.cast?.[k]?.kind || 'estela');
    const tl = gsap.timeline({ onStart: () => { if (r) { r.quieto = true; gsap.to(r.pivot.rotation, { y: Math.round(r.pivot.rotation.y / 6.283) * 6.283, duration: 0.3 }); } }, onComplete: () => { if (r) { r.quieto = false; reproducir(r, r.anims?.Idle, false); } } });
    const pivot = r?.pivot;
    tl.call(() => { if (r) reproducir(r, r.anims?.Attack, true); if (pivot) r.fx.cast(pivot, p?.tipoAtaque === 'ranged' ? 'proyectil' : p?.tipoAtaque === 'magic' ? 'glifo' : 'estela', col); }, null, 0);
    kinds.forEach((kind, i) => tl.call(() => { if (!r) return; reproducir(r, r.anims?.['Cast_' + 'QWER'[i]] && r.acciones?.[r.anims['Cast_' + 'QWER'[i]]] ? r.anims['Cast_' + 'QWER'[i]] : r.anims?.Cast, true); r.fx.cast(pivot, kind, col);
      const n = el.querySelector(`.ab[data-k="${'QWER'[i]}"]`); if (n) gsap.fromTo(n, { backgroundColor: '#3a2f12' }, { backgroundColor: '#0e1419', duration: 0.9 }); }, null, 0.9 + i * 0.9));
    tl.to({}, { duration: 0.6 }, 0.9 + 4 * 0.9);
    return tl;
  }

  // ---------- ficha ----------
  let actual = null;
  function abrir(id) {
    const c = byId[id]; if (!c) return false; const p = PRES[id] || {}; actual = id;
    const skin = skins[id] || p.aspectos?.[0]?.id || 'base'; skins[id] = skin;
    const b = c.base_stats || {}; const col = p.color || CLASS_COL[c.class] || '#c9a227';
    const num = a => { const r = Object.entries(a.ratio || {}).map(([k, v]) => ` +${Math.round(v * 100)}% ${k.toUpperCase().replace('_BONUS', ' extra')}`).join('');
      return a.base.some(x => x) ? a.base.join('/') + r : (r ? r.trim() : 'sin daño (efecto puro)'); };
    el.style.setProperty('--fc', col);
    el.innerHTML = `<div class="fcard" role="dialog" aria-label="Ficha de ${esc(c.name)}">
      <div class="fport"><canvas></canvas><div class="ini">${esc(c.name.slice(0, 1))}</div>
        <div class="tipo">${TIPO[p.tipoAtaque] || ''}</div><div class="arma">${esc(p.arma || '')}<br><span style="color:#999">${esc(p.cuerpo || '')}</span></div></div>
      <div class="fbody">
        <button class="cerrar" title="Cerrar">×</button>
        <h2>${esc(c.name)} <span>${esc(c.title)}</span></h2>
        <div><span class="pill">${esc(c.class)}</span><span class="pill">${esc(c.race)}</span><span class="pill">${esc(c.role)}</span><span class="pill">${esc(c.faction)}</span><span class="pill">Daño ${esc(c.damage)}</span><span class="pill">${esc(c.resource)}</span><span class="pill">${'★'.repeat(c.difficulty || 1)}</span></div>
        <p class="lore">${esc(c.lore)}</p>
        <div class="stats">Vida ${b.hp} (+${b.hp_g}) · AD ${b.ad} (+${b.ad_g}) · Armadura ${b.armor} · RM ${b.mr} · Vel. ataque ${b.attack_speed} · Vel. ${b.ms} · Alcance ${b.range} · <b>${TIPO[p.tipoAtaque] || ''}</b></div>
        <div class="ab" data-k="P"><span class="k">P</span><b>${esc(c.passive.name)}</b><br>${esc(c.passive.desc)}</div>
        ${c.abilities.map(a => `<div class="ab" data-k="${a.key}"><span class="k">${a.key}</span><b>${esc(a.name)}</b> <span class="n">(${esc(a.type)} · CD ${a.cooldown.join('/')} s${a.cost ? ' · coste ' + a.cost : ''}${a.range ? ' · alcance ' + (a.range > 20000 ? 'global' : a.range) : ''})</span><br>${esc(a.desc)}<br><span class="n">Valor ${num(a)}</span></div>`).join('')}
        ${(p.aspectos || []).length > 1 ? `<div class="aspectos">Aspecto: ${p.aspectos.map(a => `<button data-skin="${a.id}" class="${a.id === skin ? 'sel' : ''}">${esc(a.nombre)}</button>`).join('')}</div>` : ''}
        <div class="acciones"><button id="fichaVer">▶ Ver ataques</button><button class="big" id="fichaElegir">Elegir a ${esc(c.name)}</button><span class="n" id="fichaModelo" style="color:#8a9;font-size:12px"></span></div>
      </div></div>`;
    el.classList.add('on'); const card = el.querySelector('.fcard');
    gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.4)' });
    gsap.from(el.querySelectorAll('.ab'), { x: -18, opacity: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.15 });
    const canvas = el.querySelector('canvas'), ini = el.querySelector('.ini'), info = el.querySelector('#fichaModelo');
    const r = crearRetrato(canvas, c, skin, ok => { ini.style.display = ok ? 'none' : ''; if (info) info.textContent = ok ? `modelo ${retrato?.modelo}` : 'retrato 2D (sin modelo)'; });
    if (!r) ini.style.display = '';
    el.querySelector('.cerrar').onclick = cerrar;
    el.onclick = e => { if (e.target === el) cerrar(); };
    el.querySelector('#fichaVer').onclick = () => verAtaques(c);
    el.querySelector('#fichaElegir').onclick = () => { onElegir?.(id, skins[id]); cerrar(); };
    el.querySelectorAll('[data-skin]').forEach(bt => bt.onclick = () => { skins[id] = bt.dataset.skin; el.querySelectorAll('[data-skin]').forEach(x => x.classList.toggle('sel', x === bt)); crearRetrato(canvas, c, skins[id], ok => { ini.style.display = ok ? 'none' : ''; if (info) info.textContent = ok ? `modelo ${retrato?.modelo}` : 'retrato 2D (sin modelo)'; }); onElegir?.(id, skins[id], { soloAspecto: true }); });
    return true;
  }
  function cerrar() { if (!el.classList.contains('on')) return; const card = el.querySelector('.fcard'); destruirRetrato();
    gsap.to(card, { opacity: 0, y: 14, scale: 0.97, duration: 0.2, onComplete: () => { el.classList.remove('on'); el.innerHTML = ''; } }); actual = null; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.classList.contains('on')) { cerrar(); e.stopPropagation(); } }, true);

  // botón flotante: aparece cuando hay un campeón seleccionado en el menú (lee window.__cdc.state.champ)
  const estado = () => (typeof window !== 'undefined' && window.__cdc?.state) || null;
  function refrescarBtn() { const st = estado(); const menu = document.getElementById('menu'); btn.classList.toggle('on', !!(st?.champ && menu?.classList.contains('on'))); }
  btn.onclick = () => { const st = estado(); if (st?.champ) abrir(st.champ); };
  document.addEventListener('click', () => setTimeout(refrescarBtn, 0), true);
  document.addEventListener('dblclick', e => { const card = e.target.closest?.('[data-champ]'); if (card) abrir(card.dataset.champ); }, true);
  setTimeout(refrescarBtn, 0);

  const api = { abrir, cerrar, skins, el, get skin() { return actual ? skins[actual] : null; }, get actual() { return actual; }, get retrato() { return retrato; }, verAtaques: () => actual && verAtaques(byId[actual]) };
  if (typeof window !== 'undefined') window.__fichas = api;
  return api;
}
