// Validador de modelos glTF/GLB para Coronas de Ceniza (sin dependencias).
// Comprueba cada modelo contra assets/data/model_specs.json: triángulos, altura, origen en los pies,
// orientación, texturas, huesos y clips de animación obligatorios.
//
// Uso:
//   node game/tools/validate_models.mjs <archivo.glb> --as champ_kaelith     # un modelo nuevo
//   node game/tools/validate_models.mjs --dir game/assets/models/final        # todos (nombre = id del asset)
//   node game/tools/validate_models.mjs --current                              # informe de los provisionales actuales
// Código de salida 1 si algún modelo NO cumple (sirve como puerta de calidad en CI).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPEC = JSON.parse(readFileSync(join(ROOT, 'assets/data/model_specs.json'), 'utf8'));
const COMP = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function readGlb(file) {
  const b = readFileSync(file); if (b.readUInt32LE(0) !== 0x46546c67) throw new Error('no es un GLB');
  const jl = b.readUInt32LE(12); const json = JSON.parse(b.slice(20, 20 + jl).toString());
  const binStart = 20 + jl + 8; const bin = b.slice(binStart);
  return { json, bin, size: b.length };
}
const mul = (a, b) => { const r = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) r[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return r; };
function nodeMatrix(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0];
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1];
}
export function analyze(file) {
  const { json: j, size } = readGlb(file);
  let tris = 0; const bounds = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  // recorrer escena con transformaciones para obtener la caja en mundo (usa min/max de POSITION)
  const visit = (ni, M) => {
    const n = j.nodes[ni]; const W = mul(M, nodeMatrix(n));
    if (n.mesh != null) for (const p of j.meshes[n.mesh].primitives) {
      const pa = j.accessors[p.attributes.POSITION]; tris += (p.indices != null ? j.accessors[p.indices].count : pa.count) / 3;
      if (pa.min && pa.max) for (let c = 0; c < 8; c++) { const v = [c & 1 ? pa.max[0] : pa.min[0], c & 2 ? pa.max[1] : pa.min[1], c & 4 ? pa.max[2] : pa.min[2]];
        const wv = [0, 1, 2].map(i => W[i] * v[0] + W[4 + i] * v[1] + W[8 + i] * v[2] + W[12 + i]); for (let i = 0; i < 3; i++) { bounds[i] = Math.min(bounds[i], wv[i]); bounds[3 + i] = Math.max(bounds[3 + i], wv[i]); } }
    }
    for (const c of n.children || []) visit(c, W);
  };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const ni of (j.scenes[j.scene || 0].nodes)) visit(ni, I);
  const quantized = (j.extensionsUsed || []).some(e => /quantization|meshopt/.test(e));
  return {
    file: basename(file), sizeKB: Math.round(size / 1024), tris: Math.round(tris),
    height: +(bounds[4] - bounds[1]).toFixed(3), minY: +bounds[1].toFixed(3), width: +(bounds[3] - bounds[0]).toFixed(3), depth: +(bounds[5] - bounds[2]).toFixed(3),
    centerX: +((bounds[0] + bounds[3]) / 2).toFixed(3), centerZ: +((bounds[2] + bounds[5]) / 2).toFixed(3),
    bones: Math.max(0, ...(j.skins || []).map(s => s.joints.length)), skins: (j.skins || []).length,
    clips: (j.animations || []).map(a => a.name), materials: (j.materials || []).length,
    textures: (j.images || []).length, extensions: j.extensionsUsed || [], quantized,
    texSizes: (j.images || []).map(im => im.extras?.size || null),
  };
}
export function check(info, assetId) {
  const a = SPEC.assets[assetId]; const out = { errors: [], warnings: [] };
  if (!a) { out.errors.push(`asset desconocido "${assetId}" (ver assets/data/model_specs.json)`); return out; }
  const c = SPEC.categories[a.category];
  if (info.tris < c.tris[0]) out.warnings.push(`pocos triángulos (${info.tris} < ${c.tris[0]}): ¿falta detalle?`);
  if (info.tris > c.tris[1]) out.errors.push(`demasiados triángulos (${info.tris} > ${c.tris[1]})`);
  if (a.category === 'environment') { /* escenario: origen = esquina del mapa (coordenadas de juego) y relieve bajo 0 por diseño */ }
  else if (!info.quantized) {
    const tol = Math.max(0.15 * a.height, 0.1);
    if (Math.abs(info.height - a.height) > tol) out.warnings.push(`altura ${info.height} m (objetivo ${a.height} m; el juego reescala, pero revisa proporciones)`);
    if (Math.abs(info.minY) > 0.03) out.errors.push(`el origen no está en los pies: minY = ${info.minY} (debe ser 0)`);
    if (Math.abs(info.centerX) > 0.25 * Math.max(info.width, 0.5) || Math.abs(info.centerZ) > 0.25 * Math.max(info.depth, 0.5)) out.warnings.push(`el modelo no está centrado en X/Z (${info.centerX}, ${info.centerZ})`);
  } else out.warnings.push('geometría cuantizada (meshopt): altura/origen no verificables; valida el .glb SIN optimizar de assets/models/final');
  if (info.bones > c.bonesMax) out.errors.push(`demasiados huesos (${info.bones} > ${c.bonesMax})`);
  for (const clip of c.requiredClips) if (!info.clips.includes(clip)) out.errors.push(`falta el clip de animación obligatorio "${clip}"`);
  const rec = c.recommendedClips.filter(x => !info.clips.includes(x)); if (rec.length) out.warnings.push(`clips recomendados que faltan: ${rec.join(', ')}`);
  if (c.requiredClips.length && !info.skins) out.errors.push('no tiene esqueleto (skin) y la categoría exige animaciones');
  if (info.materials > 4) out.warnings.push(`${info.materials} materiales (ideal ≤ 2 para menos llamadas de dibujo)`);
  return out;
}

const args = process.argv.slice(2);
// Comparar rutas, no URL: con espacios en la ruta `import.meta.url` lleva %20 y nunca coincidía (salía 0 sin validar nada)
if (args.length && fileURLToPath(import.meta.url) === process.argv[1]) {
  let jobs = [];
  if (args[0] === '--current') {
    const dir = join(ROOT, 'game/assets/models/src');
    const map = { ka_Knight: 'champ_kaelith', ka_Barbarian: 'champ_morgra', ka_Mage: 'champ_vaelor', ka_Rogue: 'champ_lyra', ks_Skeleton_Warrior: 'champ_ossuar',
      ks_Skeleton_Mage: 'champ_zerath', ks_Skeleton_Rogue: 'champ_sable', ks_Skeleton_Minion: 'minion_melee', personaje: 'champ_gearix', lagarto: 'champ_rakhar',
      mini_dragon_blue: 'epic_dragon', lord_tuetano: 'epic_senor', guerrero: 'struct_tower', tree: 'prop_tree', cypress: 'prop_cypress', kk_bush: 'prop_bush' };
    jobs = Object.entries(map).filter(([f]) => existsSync(join(dir, f + '.glb'))).map(([f, id]) => [join(dir, f + '.glb'), id]);
  } else if (args[0] === '--dir') jobs = readdirSync(args[1]).filter(f => f.endsWith('.glb')).map(f => [join(args[1], f), f.replace(/\.glb$/, '').replace(/_(aurora|crepusculo)$/, '')]);
  else jobs = [[args[0], args[args.indexOf('--as') + 1]]];
  let bad = 0;
  for (const [file, id] of jobs) {
    const info = analyze(file), r = check(info, id); if (r.errors.length) bad++;
    console.log(`${r.errors.length ? '✗' : '✓'} ${info.file} como ${id} · ${info.tris} tris · ${info.height} m · ${info.bones} huesos · clips: ${info.clips.join(', ') || '—'}`);
    for (const e of r.errors) console.log('    ERROR  ' + e); for (const w of r.warnings) console.log('    aviso  ' + w);
  }
  console.log(`\n${jobs.length - bad}/${jobs.length} cumplen la especificación`);
  process.exit(bad ? 1 : 0);
}
