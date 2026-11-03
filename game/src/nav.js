// Navegación: rejilla de 200 u sobre el mapa (70×70 en la Grieta), A* octil sin cortar esquinas y
// simplificación de la ruta por «string pulling». Solo entra en juego cuando el segmento recto hasta el
// destino choca con un obstáculo (muro o roca); los súbditos siguen sus carriles y nunca la usan.
// La rejilla se reconstruye cuando cambia game.obstaclesVersion (rocas temporales, Forja).
import { segDist } from './core.js';

export const CELL = 200;      // tamaño de celda (u)
export const MARGIN = 45;     // margen añadido al radio de cada obstáculo al bloquear celdas (≈ radio de un campeón)

function buildGrid(g) {
  const W = g.map.W, H = g.map.H, nx = Math.ceil(W / CELL), ny = Math.ceil(H / CELL);
  const blocked = new Uint8Array(nx * ny);
  for (const o of g.obstacles) {
    const rr = o.r + MARGIN, r2 = rr * rr;
    const i0 = Math.max(0, Math.floor((o.x - rr) / CELL)), i1 = Math.min(nx - 1, Math.floor((o.x + rr) / CELL));
    const j0 = Math.max(0, Math.floor((o.y - rr) / CELL)), j1 = Math.min(ny - 1, Math.floor((o.y + rr) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const cx = (i + 0.5) * CELL - o.x, cy = (j + 0.5) * CELL - o.y;
      if (cx * cx + cy * cy < r2) blocked[j * nx + i] = 1;
    }
  }
  if (g.map.bounds) { const { y0, y1 } = g.map.bounds; for (let j = 0; j < ny; j++) { const y = (j + 0.5) * CELL; if (y < y0 || y > y1) for (let i = 0; i < nx; i++) blocked[j * nx + i] = 1; } }
  return { nx, ny, blocked, version: g.obstaclesVersion || 0 };
}

export function navGrid(g) {
  if (!g.nav || g.nav.version !== (g.obstaclesVersion || 0)) g.nav = buildGrid(g);
  return g.nav;
}

const cellOf = (v) => Math.max(0, Math.floor(v / CELL));
function nearestFree(nav, i, j) {
  const { nx, ny, blocked } = nav; i = Math.min(nx - 1, i); j = Math.min(ny - 1, j);
  if (!blocked[j * nx + i]) return [i, j];
  for (let r = 1; r < 6; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
    if (!blocked[b * nx + a]) return [a, b];
  }
  return null;
}

// ¿El segmento recto choca con algún obstáculo (radio + margen)?
export function segmentBlocked(g, ax, ay, bx, by, margin = MARGIN) {
  const minx = Math.min(ax, bx), maxx = Math.max(ax, bx), miny = Math.min(ay, by), maxy = Math.max(ay, by);
  for (const o of g.obstacles) {
    const rr = o.r + margin;
    if (o.x + rr < minx || o.x - rr > maxx || o.y + rr < miny || o.y - rr > maxy) continue;
    if (segDist(o.x, o.y, ax, ay, bx, by) < rr) return o;
  }
  return null;
}

// A* octil (8 vecinos; diagonal solo si las dos ortogonales están libres). Devuelve la lista de celdas o null.
function astar(nav, s, t) {
  const { nx, ny, blocked } = nav, N = nx * ny;
  const si = s[0] + s[1] * nx, ti = t[0] + t[1] * nx;
  const gS = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open = [si]; gS[si] = 0;
  const h = (i) => { const dx = Math.abs(i % nx - t[0]), dy = Math.abs(Math.floor(i / nx) - t[1]); return Math.max(dx, dy) + 0.41421356 * Math.min(dx, dy); };
  const f = new Float64Array(N); f[si] = h(si);
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (cur === ti) { const out = []; for (let c = cur; c !== -1; c = came[c]) out.push([c % nx, Math.floor(c / nx)]); return out.reverse(); }
    if (closed[cur]) continue; closed[cur] = 1;
    const cx = cur % nx, cy = Math.floor(cur / nx);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const a = cx + di, b = cy + dj; if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const n = a + b * nx; if (blocked[n] || closed[n]) continue;
      if (di && dj && (blocked[cx + di + cy * nx] || blocked[cx + (cy + dj) * nx])) continue; // no cortar esquinas
      const ng = gS[cur] + (di && dj ? 1.41421356 : 1);
      if (ng < gS[n]) { gS[n] = ng; came[n] = cur; f[n] = ng + h(n); open.push(n); }
    }
  }
  return null;
}

// Ruta simplificada de `from` a `to` como lista de puntos [x, y] (sin el origen, con el destino).
// null = no hace falta ruta (segmento libre) o no hay camino. Si el destino cae dentro de un obstáculo,
// el último punto es la celda libre más cercana.
export function findPath(g, from, to) {
  const nav = navGrid(g);
  const s = nearestFree(nav, cellOf(from.x), cellOf(from.y)); const t = nearestFree(nav, cellOf(to.x), cellOf(to.y));
  if (!s || !t) return null;
  const cells = astar(nav, s, t); if (!cells) return null;
  const pts = cells.map(([i, j]) => [(i + 0.5) * CELL, (j + 0.5) * CELL]);
  const goalFree = !nav.blocked[cellOf(to.x) + cellOf(to.y) * nav.nx] || (t[0] === cellOf(to.x) && t[1] === cellOf(to.y));
  if (goalFree) pts.push([to.x, to.y]);
  // string pulling: desde el punto actual, saltar al punto más lejano alcanzable en línea recta
  const out = []; let cx = from.x, cy = from.y, i = 0;
  while (i < pts.length) {
    let far = i;
    for (let k = pts.length - 1; k > i; k--) if (!segmentBlocked(g, cx, cy, pts[k][0], pts[k][1], MARGIN * 0.6)) { far = k; break; }
    out.push(pts[far]); [cx, cy] = pts[far]; i = far + 1;
  }
  return out;
}
