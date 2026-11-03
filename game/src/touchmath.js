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

/** Rectángulos de los botones táctiles para un lienzo w×h. Abajo-derecha: ataque grande con TORRE arriba y SÚBDITO abajo,
 *  Q/W/E/R en arco alrededor, D/F más pequeños en un arco exterior, y la fila B / guardián a la izquierda del grupo.
 *  Arriba a la derecha (fila): tienda (solo en fuente o muerto), candado de cámara, marcador y pausa. Cada rect: { id, x, y, w, h, cx, cy, r }. */
export function layoutButtons(w, h, scale = 1) {
  const s = scale, m = 12 * s, out = [];
  const add = (id, cx, cy, size, extra = {}) => { const r = size / 2; out.push({ id, cx, cy, r, x: cx - r, y: cy - r, w: size, h: size, ...extra }); };
  const cx = w - m - 64 * s, cy = h - m - 68 * s;           // centro del botón de ataque
  add('attack', cx, cy, 80 * s);
  add('attackTower', cx, cy - 60 * s, 34 * s);
  add('attackMinion', cx, cy + 60 * s, 34 * s);
  const R1 = 135 * s, R2 = 195 * s, A = 56 * s, D = 44 * s;
  [['Q', 180], ['W', 215], ['E', 250], ['R', 285]].forEach(([id, deg]) => { const a = deg * Math.PI / 180; add('ab' + id, cx + Math.cos(a) * R1, cy + Math.sin(a) * R1, A, { key: id }); });
  [['sum0', 200], ['sum1', 235]].forEach(([id, deg], i) => { const a = deg * Math.PI / 180; add(id, cx + Math.cos(a) * R2, cy + Math.sin(a) * R2, D, { i }); });
  const row = h - m - 22 * s;
  add('recall', cx - 200 * s, row, D); add('ward', cx - 250 * s, row, D);
  const top = m + 20 * s, col = w - m - 20 * s;                 // fila superior derecha: candado · marcador · pausa
  add('pause', col, top, 40 * s); add('score', col - 48 * s, top, 40 * s); add('lock', col - 96 * s, top, 40 * s); add('shop', col - 144 * s, top, 40 * s);
  return out;
}

/** true si dos rects se solapan (bordes compartidos no cuentan). */
export function overlaps(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
