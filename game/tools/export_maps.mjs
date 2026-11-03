// Exporta la geometría de los 3 mapas (la misma que usa la simulación) a assets/data/map_layouts.json,
// para que tools/blender/build_maps.py construya los escenarios en Blender en las posiciones exactas.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAP_BUILDERS } from '../src/maps.js';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = {};
for (const [id, build] of Object.entries(MAP_BUILDERS)) {
  const m = build();
  out[id] = { W: m.W, H: m.H, bg: m.bg, laneCol: m.laneCol, riverCol: m.riverCol || null, river: m.river || null, riverW: m.riverW || 0, bounds: m.bounds || null,
    fountain: m.fountain, nexus: m.nexus, lanes: m.lanes[0], towers: m.towers, inhibs: m.inhibs, camps: m.camps, rocks: m.rocks, brushes: m.brushes,
    altars: m.altars || [], relics: m.relics || [], epic: m.epic, pits: m.pits || {},
    walls: m.walls || [], wr: m.wr || 0, rules: m.rules || {} };
}
writeFileSync(join(root, 'assets/data/map_layouts.json'), JSON.stringify(out, null, 1));
console.log('OK assets/data/map_layouts.json', Object.keys(out).join(', '));
