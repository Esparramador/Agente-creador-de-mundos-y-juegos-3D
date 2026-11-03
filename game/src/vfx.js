// Efectos «wow» con GSAP sobre objetos three.js (agente G). No cambia la simulación: solo dibuja.
//   initVfx(R3, G, settings) -> engancha los ganchos opcionales de World3D (onUnitSpawn / onUnitDeath / onCast /
//     getObj) y, si no existen todavía, detecta por sí mismo apariciones, muertes y lanzamientos leyendo G.units
//     y G.events. Nunca falla si falta un gancho: todo va con `?.`.
//   crearEfectos(scene, settings) -> el mismo motor sobre cualquier escena (lo usa la ficha, fichas.js).
// Efectos: APARICIÓN (columna de luz del equipo + escala desde 0 back.out), REAPARICIÓN (anillo expansivo),
// MUERTE (caída + desvanecido + fragmentos), LANZAMIENTO por tipo (melee: estela; distancia: proyectil con cola;
// mágico: glifo bajo los pies; color por campeón), ÉPICOS (rugido + sacudida de cámara), TORRE (derrumbe),
// DRAGÓN (tinte por elemento). settings.vfx: 'alto' (defecto) | 'bajo' | 'off'; settings.mobile reduce la sacudida.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { PRESENTATION } from './data.js';

const PRES = Object.fromEntries((PRESENTATION || []).map(p => [p.id, p]));
const TEAM = [0x42a5f5, 0xef5350, 0xbcaaa4];
const DRAGON = { Ceniza: 0xff7043, Marea: 0x4fc3f7, Raíz: 0x66bb6a, Forja: 0xffb300 };
const MAX_PARTICULAS = 200;

function nivel(settings) { const v = settings?.vfx ?? 'alto'; return v === 'off' ? 0 : v === 'bajo' ? 1 : 2; }
function colorDe(u) { return PRES[u?.cid]?.color ?? '#ffffff'; }
function tipoAtaque(u) { return PRES[u?.cid]?.tipoAtaque ?? (u?.st?.range > 200 ? 'ranged' : 'melee'); }
function kindDe(u, k) { return PRES[u?.cid]?.vfx?.cast?.[k]?.kind ?? ({ melee: 'estela', ranged: 'proyectil', magic: 'glifo' })[tipoAtaque(u)]; }

// ---------- partículas ligeras: un único THREE.Points con pool de 200 ----------
class Particulas {
  constructor(scene, max = MAX_PARTICULAS) {
    this.max = max; this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.ttl = new Float32Array(max); this.grav = new Float32Array(max);
    this.pos.fill(-9999);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    this.points.frustumCulled = false; this.points.renderOrder = 5; this.next = 0; this.vivas = 0; scene.add(this.points);
  }
  emitir(n, x, y, z, { color = 0xffffff, vel = 2, arriba = 1, vida = 0.8, grav = 0, radio = 0.2 } = {}) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const i = this.next; this.next = (this.next + 1) % this.max;   // el pool recicla las más antiguas: nunca más de 200
      const a = Math.random() * Math.PI * 2, r = Math.random() * radio, s = vel * (0.4 + Math.random() * 0.6);
      this.pos.set([x + Math.cos(a) * r, y, z + Math.sin(a) * r], i * 3);
      this.vel.set([Math.cos(a) * s, arriba * s * (0.5 + Math.random()), Math.sin(a) * s], i * 3);
      this.col.set([c.r, c.g, c.b], i * 3); this.life[i] = this.ttl[i] = vida * (0.6 + Math.random() * 0.4); this.grav[i] = grav;
    }
  }
  update(dt) {
    let vivas = 0; const p = this.pos, v = this.vel;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue; this.life[i] -= dt;
      if (this.life[i] <= 0) { p[i * 3 + 1] = -9999; continue; }
      vivas++; v[i * 3 + 1] -= this.grav[i] * dt;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      const f = this.life[i] / this.ttl[i]; this.col[i * 3] *= 0.5 + f * 0.5; this.col[i * 3 + 1] *= 0.5 + f * 0.5; this.col[i * 3 + 2] *= 0.5 + f * 0.5;
    }
    this.vivas = vivas; this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
  }
  dispose() { this.points.parent?.remove(this.points); this.points.geometry.dispose(); this.points.material.dispose(); }
}

// ---------- texturas procedurales (glifo) ----------
let glifoTex = null;
function texturaGlifo() {
  if (glifoTex) return glifoTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 118, 0, 7); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 96, 0, 7); x.stroke();
  x.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; x.lineTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); } x.closePath(); x.stroke();
  x.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; x.lineTo(128 + Math.cos(a) * 55, 128 + Math.sin(a) * 55); } x.closePath(); x.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.fillStyle = '#fff'; x.beginPath(); x.arc(128 + Math.cos(a) * 107, 128 + Math.sin(a) * 107, 4, 0, 7); x.fill(); }
  glifoTex = new THREE.CanvasTexture(c); return glifoTex;
}

// ---------- motor de efectos sobre una escena ----------
export function crearEfectos(scene, settings = {}) {
  const lvl = nivel(settings), movil = !!settings?.mobile;
  const part = lvl > 0 ? new Particulas(scene) : null;
  const vivos = new Set();          // mallas temporales en escena (se eliminan al acabar su timeline)
  const geo = {
    columna: new THREE.CylinderGeometry(0.45, 0.7, 4, 16, 1, true), anillo: new THREE.RingGeometry(0.8, 1, 48), disco: new THREE.PlaneGeometry(2.4, 2.4),
    estela: new THREE.TorusGeometry(1, 0.08, 6, 24, Math.PI * 0.9), bola: new THREE.SphereGeometry(0.16, 10, 10), chispa: new THREE.TetrahedronGeometry(0.12),
    onda: new THREE.RingGeometry(0.9, 1, 64),
  };
  const mat = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...extra });
  function temporal(mesh, tl) { scene.add(mesh); vivos.add(mesh); tl.eventCallback('onComplete', () => { scene.remove(mesh); vivos.delete(mesh); mesh.material.dispose(); }); return tl; }
  function posDe(obj) { const v = new THREE.Vector3(); obj.getWorldPosition(v); return v; }
  function modeloDe(obj) { return obj?.userData?.model ?? obj; }
  const shake = { amp: 0 }; let camara = null; let ultimaAparicion = -1e9, apariciones = 0;

  const fx = {
    particulas: part, shake, nivel: lvl, vivos,
    setCamara(c) { camara = c; },
    update(dt) { part?.update(dt); },
    // offset de sacudida (se aplica justo antes de dibujar y se deshace después)
    aplicarShake(cam) { if (!cam || shake.amp <= 0) return null; const o = new THREE.Vector3((Math.random() - 0.5) * shake.amp, (Math.random() - 0.5) * shake.amp * 0.6, (Math.random() - 0.5) * shake.amp); cam.position.add(o); return o; },
    sacudir(amp = 0.35, dur = 0.6) { if (lvl === 0) return; shake.amp = amp * (movil ? 0.35 : 1); gsap.to(shake, { amp: 0, duration: dur, ease: 'power2.out', overwrite: true }); },

    // APARICIÓN: columna de luz del color del equipo + escala desde 0 (back.out)
    spawn(obj, color = 0xffffff) {
      if (lvl === 0 || !obj) return null;
      const m = modeloDe(obj); const p = posDe(obj);
      m.scale.set(0.001, 0.001, 0.001);
      // varias apariciones a la vez (inicio de partida) se escalonan para no sumar columnas aditivas en blanco
      const ahora = performance.now(); const retardo = (ahora - ultimaAparicion < 400) ? (apariciones++ % 5) * 0.14 : (apariciones = 1, 0); ultimaAparicion = ahora;
      const tl = gsap.timeline({ delay: retardo });
      tl.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'back.out(1.7)' }, 0.1);
      const col = new THREE.Mesh(geo.columna, mat(color, { opacity: 0 })); col.position.set(p.x, 2, p.z); col.scale.set(0.7, 0.01, 0.7);
      temporal(col, tl).to(col.scale, { y: 1, duration: 0.35, ease: 'power3.out' }, 0).to(col.material, { opacity: 0.32, duration: 0.2 }, 0)
        .to(col.material, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.4).to(col.scale, { x: 1.3, z: 1.3, duration: 0.6 }, 0.4);
      if (lvl > 1) part?.emitir(movil ? 14 : 28, p.x, p.y + 0.1, p.z, { color, vel: 1.2, arriba: 2.2, vida: 0.9, radio: 0.5 });
      return tl;
    },
    // REAPARICIÓN: anillo expansivo + columna
    respawn(obj, color = 0xffffff) {
      if (lvl === 0 || !obj) return null;
      const p = posDe(obj); const tl = this.spawn(obj, color) || gsap.timeline();
      const r = new THREE.Mesh(geo.anillo, mat(color, { opacity: 0.6 })); r.rotation.x = -Math.PI / 2; r.position.set(p.x, 0.06, p.z); r.scale.setScalar(0.3);
      temporal(r, tl).to(r.scale, { x: 4.5, y: 4.5, z: 4.5, duration: 0.9, ease: 'power2.out' }, 0).to(r.material, { opacity: 0, duration: 0.9, ease: 'power1.in' }, 0);
      return tl;
    },
    // MUERTE: caída + desvanecido + fragmentos
    death(obj, color = 0xffffff, { hundir = true } = {}) {
      if (lvl === 0 || !obj) return null;
      const m = modeloDe(obj); const p = posDe(obj); const tl = gsap.timeline();
      obj.userData.vfxAlpha = 1;
      if (hundir) tl.to(m.position, { y: m.position.y - 1.2, duration: 1.6, ease: 'power2.in' }, 1.0).to(m.rotation, { x: m.rotation.x - 0.35, duration: 0.5, ease: 'power2.out' }, 0);
      tl.to(obj.userData, { vfxAlpha: 0, duration: 1.4, ease: 'power1.in' }, 0.9);
      if (lvl > 1) {
        part?.emitir(movil ? 18 : 40, p.x, p.y + 1, p.z, { color, vel: 2.4, arriba: 1.6, vida: 1.1, grav: 6, radio: 0.3 });
        for (let i = 0; i < (movil ? 4 : 8); i++) {
          const f = new THREE.Mesh(geo.chispa, mat(color, { blending: THREE.NormalBlending, opacity: 1 })); f.position.set(p.x, p.y + 0.9, p.z);
          const a = Math.random() * 6.28, d = 0.8 + Math.random() * 1.4;
          temporal(f, tl).to(f.position, { x: p.x + Math.cos(a) * d, z: p.z + Math.sin(a) * d, duration: 0.9, ease: 'power1.out' }, 0)
            .to(f.position, { y: 0.05, duration: 0.9, ease: 'bounce.out' }, 0).to(f.rotation, { x: 4, z: 3, duration: 0.9 }, 0).to(f.material, { opacity: 0, duration: 0.6 }, 1.2);
        }
      }
      return tl;
    },
    // LANZAMIENTO por tipo: estela (melee) / proyectil con cola (distancia) / glifo (mágico) / aura / cono / muro / humo / cura / rayo
    cast(obj, kind = 'estela', color = 0xffffff) {
      if (lvl === 0 || !obj) return null;
      const p = posDe(obj), yaw = obj.rotation.y, dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); const tl = gsap.timeline();
      const chispas = (n, o = {}) => { if (lvl > 1) part?.emitir(movil ? Math.ceil(n / 2) : n, p.x, p.y + 0.9, p.z, { color, vel: 1.5, arriba: 0.6, vida: 0.5, radio: 0.3, ...o }); };
      if (kind === 'estela' || kind === 'cono') {
        const e = new THREE.Mesh(geo.estela, mat(color)); e.position.set(p.x + dir.x * 0.9, p.y + 1.0, p.z + dir.z * 0.9); e.rotation.set(Math.PI / 2, 0, -yaw + Math.PI * 0.55); e.scale.setScalar(kind === 'cono' ? 1.6 : 0.9);
        temporal(e, tl).fromTo(e.scale, { x: 0.3, y: 0.3, z: 0.3 }, { x: 1.4, y: 1.4, z: 1.4, duration: 0.28, ease: 'power3.out' }, 0).to(e.rotation, { z: e.rotation.z + 1.2, duration: 0.32, ease: 'power2.out' }, 0).to(e.material, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 0.18);
        chispas(10, { vel: 2.2 });
      } else if (kind === 'proyectil' || kind === 'rayo') {
        const b = new THREE.Mesh(geo.bola, mat(color, { opacity: 1 })); b.position.set(p.x + dir.x * 0.6, p.y + 1.1, p.z + dir.z * 0.6);
        const L = kind === 'rayo' ? 5 : 7, dur = kind === 'rayo' ? 0.25 : 0.45;
        temporal(b, tl).to(b.position, { x: b.position.x + dir.x * L, z: b.position.z + dir.z * L, duration: dur, ease: 'power1.in', onUpdate: () => { if (lvl > 1 && Math.random() < 0.7) part?.emitir(1, b.position.x, b.position.y, b.position.z, { color, vel: 0.25, arriba: 0.5, vida: 0.4, radio: 0.05 }); } }, 0)
          .to(b.material, { opacity: 0, duration: 0.12 }, dur - 0.08);
        chispas(6);
      } else if (kind === 'glifo' || kind === 'cura') {
        const g = new THREE.Mesh(geo.disco, mat(color, { map: texturaGlifo(), opacity: 0 })); g.rotation.x = -Math.PI / 2; g.position.set(p.x, 0.05, p.z); g.scale.setScalar(0.2);
        temporal(g, tl).to(g.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' }, 0).to(g.material, { opacity: 0.95, duration: 0.15 }, 0)
          .to(g.rotation, { z: kind === 'cura' ? -2 : 2.4, duration: 0.9, ease: 'power1.out' }, 0).to(g.material, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.5);
        const col = new THREE.Mesh(geo.columna, mat(color, { opacity: 0 })); col.position.set(p.x, 2, p.z); col.scale.set(0.7, 1, 0.7);
        temporal(col, tl).to(col.material, { opacity: 0.35, duration: 0.15 }, 0.1).to(col.material, { opacity: 0, duration: 0.5 }, 0.4);
        chispas(16, { arriba: 2.5, vel: 0.9, vida: 0.9 });
      } else if (kind === 'muro') {
        for (let i = -2; i <= 2; i++) { const w = new THREE.Mesh(geo.columna, mat(color, { opacity: 0 })); w.position.set(p.x + dir.x * 2 - dir.z * i * 0.9, 1.2, p.z + dir.z * 2 + dir.x * i * 0.9); w.scale.set(0.5, 0.6, 0.5);
          temporal(w, tl).to(w.material, { opacity: 0.55, duration: 0.2 }, Math.abs(i) * 0.05).to(w.material, { opacity: 0, duration: 0.5 }, 0.6 + Math.abs(i) * 0.05); }
        chispas(12, { arriba: 1.5 });
      } else if (kind === 'humo') {
        chispas(24, { color: 0x90a4ae, vel: 0.8, arriba: 0.8, vida: 1.2, radio: 0.6 });
        const r = new THREE.Mesh(geo.anillo, mat(0x90a4ae)); r.rotation.x = -Math.PI / 2; r.position.set(p.x, 0.06, p.z); r.scale.setScalar(0.5);
        temporal(r, tl).to(r.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 0.6 }, 0).to(r.material, { opacity: 0, duration: 0.6 }, 0);
      } else { // aura (autobuff, escudo, transformación)
        const r = new THREE.Mesh(geo.anillo, mat(color)); r.rotation.x = -Math.PI / 2; r.position.set(p.x, 0.06, p.z); r.scale.setScalar(2.2);
        temporal(r, tl).to(r.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.5, ease: 'power3.in' }, 0).to(r.material, { opacity: 0, duration: 0.25 }, 0.4);
        const col = new THREE.Mesh(geo.columna, mat(color, { opacity: 0 })); col.position.set(p.x, 2, p.z); col.scale.set(0.8, 1, 0.8);
        temporal(col, tl).to(col.material, { opacity: 0.45, duration: 0.25 }, 0.3).to(col.material, { opacity: 0, duration: 0.5 }, 0.6);
        chispas(14, { arriba: 2, vel: 0.6, vida: 0.9 });
      }
      return tl;
    },
    // ÉPICO: rugido (onda expansiva) + sacudida de cámara
    rugido(obj, color = 0xff8a65, amp = 0.35) {
      if (lvl === 0 || !obj) return null;
      const p = posDe(obj); const tl = gsap.timeline(); const m = modeloDe(obj);
      tl.fromTo(m.scale, { x: 0.85, y: 0.85, z: 0.85 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' }, 0);
      for (let i = 0; i < 3; i++) { const o = new THREE.Mesh(geo.onda, mat(color)); o.rotation.x = -Math.PI / 2; o.position.set(p.x, 0.07, p.z); o.scale.setScalar(0.5);
        temporal(o, tl).to(o.scale, { x: 7 + i * 2, y: 7 + i * 2, z: 7 + i * 2, duration: 1.0, ease: 'power2.out' }, i * 0.18).to(o.material, { opacity: 0, duration: 1.0, ease: 'power1.in' }, i * 0.18); }
      if (lvl > 1) part?.emitir(movil ? 20 : 40, p.x, p.y + 1.5, p.z, { color, vel: 2.5, arriba: 1.2, vida: 1.0, radio: 0.8 });
      this.sacudir(amp, 0.7); return tl;
    },
    // TORRE DESTRUIDA: derrumbe (inclinación + hundimiento) + polvo + sacudida
    derrumbe(obj, color = 0xbcaaa4) {
      if (lvl === 0 || !obj) return null;
      const m = modeloDe(obj); const inner = m.userData?.inner ?? m; const p = posDe(obj); const tl = gsap.timeline();
      const a = Math.random() * 6.28;
      tl.to(inner.rotation, { x: Math.cos(a) * 0.35, z: Math.sin(a) * 0.35, duration: 0.9, ease: 'power2.in' }, 0).to(inner.position, { y: inner.position.y - 1.2, duration: 1.2, ease: 'power3.in' }, 0.2)
        .to(inner.rotation, { x: 0, z: 0, duration: 0.01 }, 1.5).to(inner.position, { y: inner.position.y, duration: 0.01 }, 1.5);  // el render fija la escala del tocón: se devuelve la pose
      if (lvl > 1) { part?.emitir(movil ? 30 : 60, p.x, p.y + 0.3, p.z, { color, vel: 2.2, arriba: 0.9, vida: 1.4, grav: 3, radio: 1.2 }); }
      this.sacudir(0.45, 0.9); return tl;
    },
    // DRAGÓN: tinte por elemento (luz + anillo + partículas del color del elemento)
    dragon(obj, tipo = 'Ceniza') {
      const color = DRAGON[tipo] ?? 0xffffff; const tl = this.rugido(obj, color, 0.25); if (!tl) return null;
      const p = posDe(obj); const luz = new THREE.PointLight(color, 0, 14); luz.position.set(p.x, 2.5, p.z); scene.add(luz); vivos.add(luz);
      tl.to(luz, { intensity: 40, duration: 0.3 }, 0).to(luz, { intensity: 0, duration: 1.4, ease: 'power2.in', onComplete: () => { scene.remove(luz); vivos.delete(luz); } }, 0.4);
      return tl;
    },
    dispose() { gsap.killTweensOf(shake); for (const m of [...vivos]) { scene.remove(m); m.material?.dispose?.(); } vivos.clear(); part?.dispose(); for (const g of Object.values(geo)) g.dispose(); },
  };
  return fx;
}

// ---------- enganche al mundo 3D del juego ----------
export function initVfx(R3, G, settings = {}) {
  const lvl = nivel(settings);
  const api = { fx: null, nivel: lvl, activo: false, probe, dispose() {} };
  if (typeof window !== 'undefined') window.__vfx = api;
  if (!R3 || !R3.scene || lvl === 0) return api;         // sin render 3D o vfx 'off': no hay nada que enganchar
  const fx = api.fx = crearEfectos(R3.scene, settings); api.activo = true;
  const teamCol = t => (R3.teamCol ? R3.teamCol(t) : TEAM[t] ?? 0xffffff);
  const objDe = u => R3.getObj?.(u) ?? R3.objs?.get?.(u.id) ?? null;
  const marcado = (obj, k, v) => { if (!obj) return false; if (obj.userData[k] === v) return true; obj.userData[k] = v; return false; };

  // 1) ganchos opcionales de D (se encadenan con los que ya hubiera)
  const prev = { spawn: R3.onUnitSpawn, death: R3.onUnitDeath, cast: R3.onCast };
  R3.onUnitSpawn = (obj, u) => { prev.spawn?.(obj, u); if (u?.kind === 'champ' && !marcado(obj, 'vfxSpawn', u.id)) fx.spawn(obj, teamCol(u.team)); };
  R3.onUnitDeath = (obj, u) => { prev.death?.(obj, u); if (!marcado(obj, 'vfxDeath', G?.t ?? 1)) muerte(obj, u); };
  R3.onCast = (obj, u, k) => { prev.cast?.(obj, u, k); lanzar(obj, u, k); };
  function muerte(obj, u) {
    if (u.structure) { if (u.kind === 'tower' || u.kind === 'inhib') fx.derrumbe(obj); return; }
    if (u.kind === 'champ' || u.epicType) fx.death(obj, colorDe(u), { hundir: true });
  }
  function lanzar(obj, u, k) { if (!obj || !/^[QWER]$/.test(k)) return; fx.cast(obj, kindDe(u, k), colorDe(u)); }

  // 2) detección propia (vale aunque D no llame a los ganchos): estados de unidades y G.events
  const vistos = new Map(); let evSeen = 0; const alpha = R3.setOpacity?.bind(R3);
  if (alpha) R3.setOpacity = (obj, a) => alpha(obj, a * (obj.userData.vfxAlpha ?? 1));
  function sondear() {
    if (!G) return;
    for (const u of G.units || []) {
      const obj = objDe(u); if (!obj) continue;
      const st = vistos.get(u.id);
      if (!st) { vistos.set(u.id, { alive: u.alive, epic: !!u.epicType }); if (u.kind === 'champ' && u.alive && !marcado(obj, 'vfxSpawn', u.id)) fx.spawn(obj, teamCol(u.team));
        if (u.epicType && u.alive) { if (u.epicType === 'dragon') fx.dragon(obj, u.dragonType); else fx.rugido(obj, u.epicType === 'lord' ? 0xff7043 : u.epicType === 'avatar' ? 0x9575cd : 0xff8a65); } continue; }
      if (st.alive && !u.alive && !marcado(obj, 'vfxDeath', G.t)) muerte(obj, u);
      if (!st.alive && u.alive && u.kind === 'champ') { obj.userData.vfxAlpha = 1; fx.respawn(obj, teamCol(u.team)); obj.userData.vfxSpawn = u.id; }
      st.alive = u.alive;
    }
    for (const id of vistos.keys()) if (!G.units.some(u => u.id === id)) vistos.delete(id);
    const ev = G.events || []; if (ev.length < evSeen) evSeen = Math.max(0, evSeen - 200);
    for (; evSeen < ev.length; evSeen++) { const e = ev[evSeen];
      if (e.type === 'cast' && e.u) { const obj = objDe(e.u); if (obj && obj.userData.vfxCastT !== e.t + e.k) { obj.userData.vfxCastT = e.t + e.k; lanzar(obj, e.u, e.k); } } }
  }
  // 3) por fotograma: partículas, sondeo y sacudida de cámara
  const render = R3.render?.bind(R3), draw = R3.r?.render?.bind(R3.r);
  if (render) R3.render = (dt, ...a) => { sondear(); fx.update(dt || 0); return render(dt, ...a); };
  if (draw && R3.r) R3.r.render = (s, c) => { const o = fx.aplicarShake(c); draw(s, c); if (o) c.position.sub(o); };
  api.dispose = () => { if (render) R3.render = render; if (draw) R3.r.render = draw; if (alpha) R3.setOpacity = alpha; fx.dispose(); api.activo = false; };
  return api;

  // modo de prueba: Object3D falso, devuelve la escala antes y después de la aparición (sin depender de D)
  function probe(kind = 'spawn') {
    const esc = api.fx ? R3.scene : new THREE.Scene(); const f = api.fx ?? crearEfectos(esc, { ...settings, vfx: 'alto' });
    const obj = new THREE.Group(); const model = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()); obj.add(model); obj.userData.model = model; esc.add(obj);
    const tl = kind === 'death' ? f.death(obj, 0xffffff) : kind === 'cast' ? f.cast(obj, 'glifo', 0xff00ff) : f.spawn(obj, 0x42a5f5);
    const antes = model.scale.x; tl?.progress(1); const despues = model.scale.x;
    esc.remove(obj); return { kind, antes, despues, gsap: gsap.version, particulas: f.particulas ? f.particulas.max : 0, vivos: f.vivos.size };
  }
}
