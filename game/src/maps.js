// Geometría de los 3 mapas (design/gdd/maps.md). El equipo Crepúsculo es la reflexión
// puntual del equipo Aurora: (x,y) -> (W-x, H-y), así ambos lados son idénticos.

const reflect = (W, H) => ([x, y, ...r]) => [W - x, H - y, ...r];

function grieta() {
  const W = 14000, H = 14000, R = reflect(W, H);
  const lanesBlue = {
    top: [[1700, 12300], [1500, 10500], [1500, 2500], [2500, 1500], [10500, 1500], [12300, 1700]],
    mid: [[1700, 12300], [12300, 1700]],
    bot: [[1700, 12300], [3500, 12500], [11500, 12500], [12500, 11500], [12500, 3500], [12300, 1700]],
  };
  const towersBlue = [
    // [x, y, lane, tier]  tier: 1 exterior, 2 interior, 3 inhibidor, 4 nexo
    [1500, 4500, 'top', 1], [1500, 7500, 'top', 2], [1500, 10200, 'top', 3],
    [5600, 8400, 'mid', 1], [4600, 9400, 'mid', 2], [3400, 10600, 'mid', 3],
    [9500, 12500, 'bot', 1], [6500, 12500, 'bot', 2], [3800, 12500, 'bot', 3],
    [2150, 11600, 'nexus', 4], [2400, 11850, 'nexus', 4],
  ];
  const inhibsBlue = [[1500, 11000, 'top'], [2900, 11100, 'mid'], [3000, 12500, 'bot']];
  const campsBlue = [
    ['golem', 3500, 6500], ['lobos', 2800, 8000], ['aves', 5600, 7600],
    ['bestia', 7400, 10400], ['roca', 6300, 11300], ['sapo', 9900, 11000],
  ];
  const rocksBlue = [[2700, 5600, 250], [4200, 8600, 280], [6600, 9800, 260], [8400, 11300, 260], [4800, 6400, 220], [8000, 9300, 230]];
  const brushBlue = [[2200, 6200, 260], [6000, 11950, 280], [6500, 7500, 260], [3600, 11600, 200], [9000, 10200, 240], [3000, 4000, 230]];
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
    river: [[0, 0], [W, H]], riverW: 900,
    epic: { dragon: [9700, 9700], herald: [4300, 4300], lord: [4300, 4300] },
    roles: ['top', 'jungle', 'mid', 'bot', 'support'],
    teamSize: 5, rules: {},
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
    camps: [], rocks: [], brushes: [...brushBlue, ...brushBlue.map(R)],
    relics: [[4700, 1050], [4700, 2150], [7300, 1050], [7300, 2150]],
    epic: {}, roles: ['mid', 'mid', 'mid', 'mid', 'mid'], teamSize: 5,
    rules: { aram: true, startLevel: 3, startGold: 1400, fountainHeal: false, goldMult: 1.5, xpMult: 1.5, towerHpMult: 0.7, siegeMinute: 9 },
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
    rocks: [...rocksBlue, ...rocksBlue.map(R)], brushes: [...brushBlue, ...brushBlue.map(R)],
    altars: [['Norte', 2700, 2700], ['Centro', 4500, 4500], ['Sur', 6300, 6300]],
    river: [[0, 0], [W, H]], riverW: 600,
    epic: { avatar: [4500, 4500] }, roles: ['top', 'jungle', 'bot'], teamSize: 3,
    rules: { dominion: true, winPoints: 500 },
  };
}

export const MAP_BUILDERS = { grieta_ceniza: grieta, puente_niebla: puente, ruinas_eclipse: ruinas };
export const buildMap = id => MAP_BUILDERS[id]();
