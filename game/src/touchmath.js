// Geometría pura de los controles táctiles (sin DOM): joystick, puntería por arrastre y disposición de botones.
// Todo en px CSS. Lo usa touch.js y lo prueban tests/touch.test.mjs.

/** Vector del joystick flotante: centro (cx,cy), dedo en (x,y), radio r. Devuelve dirección normalizada y magnitud 0..1. */
export function joystickVector(cx, cy, x, y, r) {
  const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
  if (d < 1e-6) return { dx: 0, dy: 0, mag: 0 };
  return { dx: dx / d, dy: dy / d, mag: Math.min(1, d / r) };
}

/** Punto de puntería al arrastrar desde un botón: p + dir × min(range, |drag| × k). Sin arrastre apunta a +x. */
export function aimFromDrag(p, dx, dy, range, k = 8) {
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return { x: p.x + range, y: p.y, dist: range };
  const len = Math.min(range, d * k);
  return { x: p.x + dx / d * len, y: p.y + dy / d * len, dist: len };
}

/** Zona de cancelación: el dedo vuelve a menos del 40 % del radio del botón. */
export function isCancelZone(dx, dy, r) { return Math.hypot(dx, dy) < 0.4 * r; }

/** Disposición Wild Rift (design/ux/wild-rift-disposicion.md, tabla 1): centro en % del ancho (x) y del alto (y), radio en % del ancho.
 *  Las 4 cifras por fila son [x %, y %, radio %, radio mínimo en px]; el radio real es max(pct × w × scale, mínimo). */
export const WR_LAYOUT = {
  attack:       [85, 78, 4.5, 38],   // ataque básico (el mayor)
  attackMinion: [79, 90, 1.9, 22],   // ⚒ enfocar súbdito (abajo-izquierda del ataque)
  attackTower:  [89, 62, 1.9, 22],   // 🗼 enfocar torre (arriba-derecha del ataque)
  abQ:          [73, 86, 2.8, 24],   // habilidad 1
  abW:          [74, 70, 2.8, 24],   // habilidad 2
  abE:          [78, 57, 2.8, 24],   // habilidad 3
  abR:          [85, 51, 3.0, 25],   // definitiva, encima del ataque
  sum0:         [58, 86, 2.5, 22],   // hechizo D
  sum1:         [64, 86, 2.5, 22],   // hechizo F
  recall:       [37, 86, 2.5, 22],   // volver a base (azul)
  ward:         [31, 86, 2.5, 22],   // guardián (sin equivalente en WR: a la izquierda del B)
  target:       [91, 12, 2.0, 22],   // ✕ bloquear / soltar objetivo   (tabla: y 13)
  ping:         [91, 24, 2.0, 22],   // ❗ señal
  recall2:      [91, 36, 2.0, 22],   // ↓ volver a base               (tabla: y 35)
  lock:         [91, 48, 2.0, 22],   // ⊙ centrar cámara (candado)     (tabla: y 46)
  score:        [96, 4,  2.0, 20],   // ☰ marcador (el chat de WR está en 91 %; a 390 px de alto un botón de 44 px ahí pisaría al ✕, así que va a la esquina)
  pause:        [25, 15, 1.9, 20],   // ⚙ opciones / pausa (columna junto al minimapa; tabla: y 17/23/30, abiertos a 15/26/37 por los 40 px mínimos)
  sound:        [25, 26, 1.9, 20],   // 🔇 sonido
  help:         [25, 37, 1.9, 20],   // ❔ ayuda
};
/** Joystick: centro de reposo (21 %, 70 %) y radio 6 % del ancho (mínimo 48 px). */
export function joystickRest(w, h) { return { cx: w * 0.21, cy: h * 0.70, r: Math.max(48, w * 0.06) }; }

/** Rectángulos de los botones táctiles para un lienzo w×h según WR_LAYOUT, más la caja de oro (abre la tienda; rect 7–11 %, 35–43 %)
 *  y los 4 objetos de compra rápida (buy0..3) entre el B y el hechizo D, a la altura del 90 %. Cada botón queda dentro del lienzo
 *  (se recorta a 4 px del borde). Cada rect: { id, x, y, w, h, cx, cy, r, key?, i? }. */
export function layoutButtons(w, h, scale = 1) {
  const out = [], pad = 4;
  const add = (id, cx, cy, bw, bh, extra = {}) => { cx = Math.max(pad + bw / 2, Math.min(w - pad - bw / 2, cx)); cy = Math.max(pad + bh / 2, Math.min(h - pad - bh / 2, cy));
    out.push({ id, cx, cy, r: Math.max(bw, bh) / 2, x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, ...extra }); return out[out.length - 1]; };
  for (const [id, [px, py, pr, min]] of Object.entries(WR_LAYOUT)) {
    const r = Math.max(min, pr / 100 * w * scale), extra = id.startsWith('ab') ? { key: id[2] } : id.startsWith('sum') ? { i: +id[3] } : {};
    add(id, px / 100 * w, py / 100 * h, 2 * r, 2 * r, extra);
  }
  // caja de oro bajo el minimapa = botón de la tienda
  const gw = Math.max(58, 0.06 * w * scale), gh = Math.max(40, 0.08 * h);
  add('shop', 0.07 * w + gw / 2, Math.max(0.39 * h, 0.02 * h + 0.15 * w + 3 + gh / 2), gw, gh);   // nunca pisa el minimapa (2 % + 15 % del ancho)
  // compra rápida: 4 cuadrados entre el B y el D
  const rc = out.find(r => r.id === 'recall'), d = out.find(r => r.id === 'sum0'), gap = 4;
  const left = rc.x + rc.w + 6, right = d.x - 6, size = Math.max(24, Math.min(Math.max(30, 0.034 * w * scale), (right - left - 3 * gap) / 4));
  const x0 = (left + right) / 2 - (4 * size + 3 * gap) / 2;
  for (let i = 0; i < 4; i++) add('buy' + i, x0 + size / 2 + i * (size + gap), 0.90 * h, size, size, { buy: i });
  return out;
}

/** true si dos rects se solapan (bordes compartidos no cuentan). */
export function overlaps(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
/** true si dos botones se tocan: círculo contra círculo cuando los dos son redondos (w === h), si no por rectángulos. */
export function hits(a, b) {
  if (a.w === a.h && b.w === b.h) return Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r;
  return overlaps(a, b);
}
