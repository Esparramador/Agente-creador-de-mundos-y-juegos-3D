// Geometría de los 3 mapas (design/gdd/maps.md). El equipo Crepúsculo es la reflexión
// puntual del equipo Aurora: (x,y) -> (W-x, H-y), así ambos lados son idénticos.
// Todos los valores de juego (tiempos de épicos, primera oleada, reaparición) viven en `rules`,
// nunca en world.js: el Game los lee y los expone como game.epicFirst / game.heraldUntil (contrato con render.js).

const reflect = (W, H) => ([x, y, ...r]) => [W - x, H - y, ...r];

// Muro = polilínea [[x,y],...] con grosor `wr`. Para la simulación se convierte en una cadena
// de círculos (obstáculos como las rocas) cada wr×1.2, incluidos ambos extremos.
export function wallCircles(poly, wr) {
  const step = wr * 1.2, out = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[i + 1]; const L = Math.hypot(bx - ax, by - ay); const n = Math.max(1, Math.ceil(L / step));
    for (let k = i ? 1 : 0; k <= n; k++) { const t = k / n; out.push([ax + (bx - ax) * t, ay + (by - ay) * t, wr]); }
  }
  return out;
}
// Arco de círculo (foso): centro, radio, ángulo inicial y amplitud en grados; devuelve una polilínea
function arc(cx, cy, r, a0, span, n = 24) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = (a0 + span * i / n) * Math.PI / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts;
}

function grieta() {
  const W = 14000, H = 14000, R = reflect(W, H);
  const lanesBlue = {
    top: [[1700, 12300], [1500, 10500], [1500, 2500], [2500, 1500], [10500, 1500], [12300, 1700]],
    mid: [[1700, 12300], [12300, 1700]],
    bot: [[1700, 12300], [3500, 12500], [11500, 12500], [12500, 11500], [12500, 3500], [12300, 1700]],
  };
  const towersBlue = [
    // [x, y, lane, tier]  tier: 1 exterior, 2 interior, 3 torre base (reglas Wild Rift: sin inhibidor; al caer, súper-súbditos), 4 nexo
    [1500, 4500, 'top', 1], [1500, 7500, 'top', 2], [1500, 10200, 'top', 3],
    [5600, 8400, 'mid', 1], [4600, 9400, 'mid', 2], [3400, 10600, 'mid', 3],
    [9500, 12500, 'bot', 1], [6500, 12500, 'bot', 2], [3800, 12500, 'bot', 3],
    [2150, 11600, 'nexus', 4], [2400, 11850, 'nexus', 4],
  ];
  const inhibsBlue = []; // Wild Rift: no hay inhibidores
  const campsBlue = [
    ['golem', 3500, 6500], ['lobos', 2800, 8000], ['aves', 5600, 7600],
    ['bestia', 7400, 10400], ['roca', 6300, 11300], ['sapo', 9900, 11000],
  ];
  const rocksBlue = [[2700, 5600, 250], [4200, 8600, 280], [6600, 9800, 260], [8400, 11300, 260], [4800, 6400, 220], [8000, 9300, 230]];
  const brushBlue = [[2200, 6200, 260], [6000, 11950, 280], [6500, 7500, 260], [3600, 11600, 200], [9000, 10200, 240], [3000, 4000, 230]];
  // Muros (lado Aurora; Crepúsculo = reflejo). Cada hueco mide ≥ 560 u entre extremos. Ningún muro a < 300 u de
  // carriles, campamentos, estructuras ni puntos de terreno de dragón (lo comprueba game.test.mjs).
  const wr = 110;
  const wallsBlue = [
    // carril superior / jungla superior: x = 2450, huecos en y 4540-5100 (hacia T1) y 8400-8960 (desde Lobos)
    [[2450, 3300], [2450, 4540]], [[2450, 5100], [2450, 8400]], [[2450, 8960], [2450, 9300]],
    // jungla superior / carril central: paralelo al mid a 1060 u (x + y = 12500), hueco de 600 u en (4700, 7800)
    [[3300, 9200], [4488, 8012]], [[4912, 7588], [5800, 6700]],
    // jungla inferior / carril central: reflejo del anterior respecto al mid (x + y = 15500), hueco en (6200, 9300)
    [[4800, 10700], [5988, 9512]], [[6412, 9088], [7300, 8200]],
    // jungla inferior / carril inferior: y = 11650, huecos en x 5970-6530 (matorral) y 9170-9730 (hacia Sapo)
    [[4300, 11650], [5970, 11650]], [[6530, 11650], [9170, 11650]], [[9730, 11650], [10700, 11650]],
    // foso del Dragón: arco de 240° (r = 750) en torno a (9700, 9700), boca de 120° hacia el río central (200°)
    arc(9700, 9700, 750, -100, 240),
  ];
  const mirrorLane = l => l.map(p => R(p)); // empieza en el Nexo rojo
  return {
    id: 'grieta_ceniza', W, H, bg: '#2b2a26', laneCol: '#4a4235', riverCol: '#5d4037',
    fountain: [[700, 13300], [13300, 700]], nexus: [[1700, 12300], [12300, 1700]],
    lanes: [lanesBlue, { top: mirrorLane(lanesBlue.bot), mid: mirrorLane(lanesBlue.mid), bot: mirrorLane(lanesBlue.top) }],
    towers: [towersBlue, towersBlue.map(t => { const r = R(t); r[2] = t[2] === 'top' ? 'bot' : t[2] === 'bot' ? 'top' : t[2]; return r; })],
    inhibs: [inhibsBlue, inhibsBlue.map(t => { const r = R(t); r[2] = t[2] === 'top' ? 'bot' : t[2] === 'bot' ? 'top' : t[2]; return r; })],
    camps: [...campsBlue.map(c => [c[0], c[1], c[2], 0]), ...campsBlue.map(c => [c[0], W - c[1], H - c[2], 1])],
    rocks: [...rocksBlue, ...rocksBlue.map(R)],
    brushes: [...brushBlue, ...brushBlue.map(R)],
    walls: [...wallsBlue, ...wallsBlue.map(p => p.map(q => R(q)))], wr,
    river: [[0, 0], [W, H]], riverW: 900,
    // foso del Dragón en el río inferior, foso del Señor (y del Heraldo hasta que el Señor lo sustituye) en el superior
    epic: { dragon: [9700, 9700], herald: [4300, 4300], lord: [4300, 4300] },
    pits: { dragon: [9700, 9700, 750], lord: [4300, 4300, 750] },
    roles: ['top', 'jungle', 'mid', 'bot', 'support'],
    teamSize: 5,
    // Reglas Wild Rift (segundos): primer dragón 6:00 y 4:30 tras morir; Heraldo 6:00 dentro del foso del Señor
    // hasta 11:00, cuando sale el Señor (y cada 6 min tras morir). Primera oleada: 1:05 (ver match-flow.md).
    rules: { epicFirst: { dragon: 360, herald: 360, lord: 660, avatar: 600 }, dragonRespawn: 270, heraldUntil: 660, lordRespawn: 360, firstWave: 65 },
  };
}

function puente() {
  const W = 12000, H = 3200, R = reflect(W, H);
  const lane = [[1300, 1600], [10700, 1600]];
  const towersBlue = [[5200, 1600, 'mid', 1], [4300, 1600, 'mid', 2], [3300, 1600, 'mid', 3], [1900, 1600, 'nexus', 4]];
  const brushBlue = [[4000, 1000, 200], [4000, 2200, 200], [5600, 2250, 180]];
  return {
    id: 'puente_niebla', W, H, bg: '#263238', laneCol: '#546e7a', bounds: { y0: 800, y1: 2400 },
    fountain: [[500, 1600], [11500, 1600]], nexus: [[1300, 1600], [10700, 1600]],
    lanes: [{ mid: lane }, { mid: lane.map(p => p.slice()).reverse() }],
    towers: [towersBlue, towersBlue.map(R)],
    inhibs: [[[2600, 1600, 'mid']], [[9400, 1600, 'mid']]],
    camps: [], rocks: [], brushes: [...brushBlue, ...brushBlue.map(R)], walls: [], wr: 0,
    relics: [[4700, 1050], [4700, 2150], [7300, 1050], [7300, 2150]],
    epic: {}, roles: ['mid', 'mid', 'mid', 'mid', 'mid'], teamSize: 5,
    rules: { aram: true, startLevel: 3, startGold: 1400, fountainHeal: false, goldMult: 1.5, xpMult: 1.5, towerHpMult: 0.7, siegeMinute: 9, firstWave: 30 },
  };
}

function ruinas() {
  const W = 9000, H = 9000, R = reflect(W, H);
  const lanesBlue = {
    top: [[1300, 7700], [1100, 1100], [7700, 1300]],
    bot: [[1300, 7700], [7900, 7900], [7700, 1300]],
  };
  const towersBlue = [[1100, 4300, 'top', 1], [1100, 6200, 'top', 2], [4700, 7900, 'bot', 1], [2800, 7900, 'bot', 2], [1900, 7100, 'nexus', 4]];
  const campsBlue = [['golem', 2400, 5000], ['lobos', 3000, 6300], ['bestia', 4000, 6900]];
  const rocksBlue = [[2200, 3700, 220], [3600, 5600, 200]];
  const brushBlue = [[1700, 2600, 220], [5800, 7300, 220], [3400, 4200, 180]];
  const mirrorLane = l => l.map(p => R(p)); // empieza en el Nexo rojo
  return {
    id: 'ruinas_eclipse', W, H, bg: '#211b2e', laneCol: '#3d3354', riverCol: '#2e2440',
    fountain: [[600, 8400], [8400, 600]], nexus: [[1300, 7700], [7700, 1300]],
    lanes: [lanesBlue, { top: mirrorLane(lanesBlue.bot), bot: mirrorLane(lanesBlue.top) }],
    towers: [towersBlue, towersBlue.map(t => { const r = R(t); r[2] = t[2] === 'top' ? 'bot' : t[2] === 'bot' ? 'top' : t[2]; return r; })],
    inhibs: [[], []],
    camps: [...campsBlue.map(c => [c[0], c[1], c[2], 0]), ...campsBlue.map(c => [c[0], W - c[1], H - c[2], 1])],
    rocks: [...rocksBlue, ...rocksBlue.map(R)], brushes: [...brushBlue, ...brushBlue.map(R)], walls: [], wr: 0,
    altars: [['Norte', 2700, 2700], ['Centro', 4500, 4500], ['Sur', 6300, 6300]],
    river: [[0, 0], [W, H]], riverW: 600,
    epic: { avatar: [4500, 4500] }, roles: ['top', 'jungle', 'bot'], teamSize: 3,
    rules: { dominion: true, winPoints: 500, epicFirst: { avatar: 600 }, avatarRespawn: 240, firstWave: 65 },
  };
}

export const MAP_BUILDERS = { grieta_ceniza: grieta, puente_niebla: puente, ruinas_eclipse: ruinas };
export const buildMap = id => MAP_BUILDERS[id]();
