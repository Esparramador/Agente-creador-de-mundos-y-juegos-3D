// Pruebas de la geometría táctil (touchmath.js): node --test game/tests/touch.test.mjs
// La disposición objetivo es la tabla 1 de design/ux/wild-rift-disposicion.md (posiciones en % del ancho/alto medidas sobre capturas reales).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joystickVector, aimFromDrag, isCancelZone, layoutButtons, joystickRest, overlaps, hits } from '../src/touchmath.js';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('joystickVector: dirección normalizada y magnitud recortada a 1', () => {
  const v = joystickVector(100, 100, 130, 140, 50);   // (30,40) → 50 px = radio completo
  assert.ok(near(v.dx, 0.6) && near(v.dy, 0.8) && near(v.mag, 1));
  const w = joystickVector(100, 100, 400, 100, 50);   // más allá del radio: magnitud 1, no 6
  assert.ok(near(w.dx, 1) && near(w.dy, 0) && near(w.mag, 1));
  const z = joystickVector(100, 100, 100, 100, 50);   // sin desplazamiento: vector nulo
  assert.deepEqual(z, { dx: 0, dy: 0, mag: 0 });
  const h = joystickVector(100, 100, 100, 75, 50);    // medio radio hacia arriba
  assert.ok(near(h.dy, -1) && near(h.mag, 0.5));
});

test('aimFromDrag: se recorta al alcance y escala con k', () => {
  const p = { x: 1000, y: 2000 };
  const a = aimFromDrag(p, 30, 0, 600, 8);            // 30 px × 8 = 240 < 600
  assert.ok(near(a.x, 1240) && near(a.y, 2000) && near(a.dist, 240));
  const b = aimFromDrag(p, 0, 200, 600, 8);           // 1600 > 600: recortado
  assert.ok(near(b.x, 1000) && near(b.y, 2600) && near(b.dist, 600));
  const c = aimFromDrag(p, 0, 0, 500);                // sin arrastre: al alcance máximo hacia +x
  assert.ok(near(c.x, 1500) && near(c.y, 2000));
});

test('isCancelZone: menos del 40 % del radio cancela', () => {
  assert.equal(isCancelZone(0, 0, 60), true);
  assert.equal(isCancelZone(20, 0, 60), true);        // 20 < 24
  assert.equal(isCancelZone(24, 0, 60), false);
  assert.equal(isCancelZone(30, 40, 60), false);      // 50 px
});

test('hits: círculos por distancia, rectángulos por caja', () => {
  const c = (cx, cy, r) => ({ cx, cy, r, x: cx - r, y: cy - r, w: 2 * r, h: 2 * r });
  assert.equal(hits(c(0, 0, 30), c(50, 0, 25)), true);    // 50 < 55
  assert.equal(hits(c(0, 0, 30), c(40, 40, 25)), false);  // 56,6 > 55 aunque las cajas se solapen
  assert.equal(overlaps(c(0, 0, 30), c(40, 40, 25)), true);
  const q = { cx: 50, cy: 10, r: 20, x: 30, y: 0, w: 40, h: 20 };
  assert.equal(hits(q, c(0, 0, 30)), false);              // rect: 30 ≥ 30 no solapa
  assert.equal(hits(q, c(0, 0, 31)), true);
});

// Tabla 1 de wild-rift-disposicion.md (x %, y %): lo que tiene que cumplir layoutButtons a ±2 %.
const TABLE = { attack: [85, 78], attackMinion: [79, 90], attackTower: [89, 62], abQ: [73, 86], abW: [74, 70], abE: [78, 57], abR: [85, 51],
  sum0: [58, 86], sum1: [64, 86], recall: [37, 86], target: [91, 13], ping: [91, 24], recall2: [91, 35], lock: [91, 46], shop: [9, 39] };
const ALL = [...Object.keys(TABLE), 'ward', 'score', 'pause', 'sound', 'help', 'buy0', 'buy1', 'buy2', 'buy3'];

for (const [w, h, scale] of [[844, 390, 1], [932, 430, 1], [1180, 820, 1], [1180, 820, 1.15], [844, 390, 1.15]]) {
  test(`layoutButtons ${w}×${h} ×${scale}: dentro del lienzo, sin solapes, posiciones de Wild Rift a ±2 %, tamaños mínimos`, () => {
    const rects = layoutButtons(w, h, scale), by = Object.fromEntries(rects.map(r => [r.id, r]));
    for (const id of ALL) assert.ok(by[id], 'falta ' + id);
    for (const r of rects) {
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h, `${r.id} fuera del lienzo: ${JSON.stringify(r)}`);
      const min = r.id.startsWith('buy') ? 24 : r.id.startsWith('ab') ? 44 : 40;
      assert.ok(r.w >= min && r.h >= min, `${r.id} demasiado pequeño (${r.w}×${r.h} < ${min})`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!hits(rects[i], rects[j]), `${rects[i].id} toca a ${rects[j].id}`);
    for (const [id, [px, py]] of Object.entries(TABLE)) {
      const r = by[id]; assert.ok(Math.abs(100 * r.cx / w - px) <= 2 && Math.abs(100 * r.cy / h - py) <= 2, `${id} en (${(100 * r.cx / w).toFixed(1)}, ${(100 * r.cy / h).toFixed(1)}) %, tabla (${px}, ${py})`);
    }
    // compra rápida: 4 cuadrados en fila entre el B y el D, centrados en 45–55 % y a la altura del 90 %
    const buys = [0, 1, 2, 3].map(i => by['buy' + i]), gx = (buys[0].x + buys[3].x + buys[3].w) / 2;
    assert.ok(Math.abs(100 * gx / w - 50) <= 7 && buys.every(b => Math.abs(100 * b.cy / h - 90) <= 2), `compra rápida en ${(100 * gx / w).toFixed(1)} %`);
    assert.ok(buys[0].x > by.recall.x + by.recall.w && buys[3].x + buys[3].w < by.sum0.x, 'compra rápida fuera del hueco B–D');
    // radios: ataque ≈ 4,5 %, habilidades ≈ 2,8 %, definitiva ≈ 3 % del ancho (o el mínimo táctil)
    assert.ok(by.attack.r >= Math.max(38, 0.045 * w * scale) - 0.01 && by.attack.r > by.abR.r && by.abR.r > by.abQ.r - 1e-9, 'ataque > definitiva ≥ habilidades');
    assert.ok(Math.abs(by.abR.cx - by.attack.cx) < 1 && by.abR.cy < by.attack.cy - by.attack.r, 'la definitiva va encima del ataque');
    assert.ok(by.attackTower.cy < by.attack.cy && by.attackTower.cx > by.attack.cx && by.attackMinion.cy > by.attack.cy && by.attackMinion.cx < by.attack.cx, '🗼 arriba-derecha y ⚒ abajo-izquierda del ataque');
    // columna derecha ordenada ✕ ❗ ↓ ⊙ y alineada en x
    assert.ok(by.target.cy < by.ping.cy && by.ping.cy < by.recall2.cy && by.recall2.cy < by.lock.cy && Math.abs(by.target.cx - by.lock.cx) < 1, 'columna derecha');
    // nada pisa el minimapa (7–22 %, 2–34 %) ni el reposo del joystick (21 %, 70 %, r 6 %)
    const mini = { x: 0.07 * w, y: 0.02 * h, w: 0.15 * w, h: 0.15 * w }, j = joystickRest(w, h);
    for (const r of rects) { assert.ok(!overlaps(r, mini), `${r.id} pisa el minimapa`); assert.ok(Math.hypot(r.cx - j.cx, r.cy - j.cy) >= j.r + r.r, `${r.id} pisa el joystick`); }
    assert.ok(near(j.cx / w, 0.21) && near(j.cy / h, 0.70) && j.r >= 48, 'reposo del joystick en (21 %, 70 %)');
  });
}
