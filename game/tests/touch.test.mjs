// Pruebas de la geometría táctil (touchmath.js): node --test game/tests/touch.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joystickVector, aimFromDrag, isCancelZone, layoutButtons, overlaps } from '../src/touchmath.js';

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

for (const [w, h, scale] of [[844, 390, 1], [1180, 820, 1.15], [844, 390, 1.15]]) {
  test(`layoutButtons ${w}×${h} ×${scale}: sin solapes, dentro del lienzo, tamaños mínimos`, () => {
    const rects = layoutButtons(w, h, scale);
    const ids = rects.map(r => r.id);
    for (const id of ['attack', 'attackTower', 'attackMinion', 'abQ', 'abW', 'abE', 'abR', 'sum0', 'sum1', 'recall', 'ward', 'shop', 'lock', 'score', 'pause']) assert.ok(ids.includes(id), 'falta ' + id);
    for (const r of rects) {
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h, `${r.id} fuera del lienzo: ${JSON.stringify(r)}`);
      assert.ok(r.w >= (r.id.startsWith('ab') ? 54 : 34), `${r.id} demasiado pequeño (${r.w})`);
      if (r.id !== 'attackTower' && r.id !== 'attackMinion') assert.ok(r.w >= 40, `${r.id} < 40 px`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]), `${rects[i].id} solapa ${rects[j].id}`);
    // todos los botones de acción en la mitad derecha (la izquierda es del joystick)
    for (const r of rects) assert.ok(r.x >= w / 2, `${r.id} invade la mitad izquierda (x=${r.x})`);
    const atk = rects.find(r => r.id === 'attack'), tw = rects.find(r => r.id === 'attackTower'), mn = rects.find(r => r.id === 'attackMinion');
    assert.ok(tw.cy < atk.cy && mn.cy > atk.cy, 'torre arriba y súbdito abajo del ataque');
  });
}
