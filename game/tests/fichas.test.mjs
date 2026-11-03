// Pruebas de la ficha de campeón (agente G):  node --test game/tests/fichas.test.mjs
//  - 15 fichas en assets/data/champion_presentation.json con todos los campos obligatorios
//  - tipo de ataque coherente con base_stats.range de champions.json (< 200 = cuerpo a cuerpo)
//  - cada anims.* existe en el glb del aspecto cuando ese glb está (se lee el JSON del propio .glb)
//  - PRESENTATION de game/src/data.js coincide con el JSON y gsap está instalado
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME = join(dirname(fileURLToPath(import.meta.url)), '..'), ROOT = join(GAME, '..');
const champs = JSON.parse(readFileSync(join(ROOT, 'assets/data/champions.json'), 'utf8'));
const pres = JSON.parse(readFileSync(join(ROOT, 'assets/data/champion_presentation.json'), 'utf8'));
const byId = Object.fromEntries(champs.map(c => [c.id, c]));
const REQ = ['id', 'name', 'title', 'tipoAtaque', 'arma', 'cuerpo', 'color', 'clase', 'raza', 'rol', 'anims', 'vfx', 'aspectos', 'lore', 'pasiva', 'Q', 'W', 'E', 'R'];
const CLIPS = ['Idle', 'Run', 'Attack', 'Cast', 'Death'];

// Lee los nombres de animación del JSON embebido en un .glb (cabecera 12 bytes + chunk JSON)
function clipsDelGlb(file) {
  const b = readFileSync(file); assert.equal(b.readUInt32LE(0), 0x46546c67, `${file}: no es un glb`);
  const len = b.readUInt32LE(12); assert.equal(b.readUInt32LE(16), 0x4e4f534a, `${file}: el primer chunk no es JSON`);
  const j = JSON.parse(b.subarray(20, 20 + len).toString('utf8')); return (j.animations || []).map(a => a.name);
}
function glbDe(modelo) { for (const d of ['assets/models/final', 'assets/models']) { const f = join(GAME, d, modelo + '.glb'); if (existsSync(f)) return f; } return null; }

test('hay 15 fichas, una por campeón y con los campos obligatorios', () => {
  assert.equal(pres.length, 15); assert.equal(champs.length, 15);
  assert.deepEqual(pres.map(p => p.id).sort(), champs.map(c => c.id).sort());
  for (const p of pres) for (const k of REQ) assert.ok(p[k] !== undefined && p[k] !== '', `${p.id}: falta ${k}`);
  for (const p of pres) {
    assert.match(p.color, /^#[0-9a-f]{6}$/i, `${p.id}: color`);
    assert.ok(['melee', 'ranged', 'magic'].includes(p.tipoAtaque), `${p.id}: tipoAtaque ${p.tipoAtaque}`);
    assert.ok(p.aspectos.length >= 1 && p.aspectos.every(a => a.id && a.nombre && a.modelo), `${p.id}: aspectos`);
    for (const k of 'QWER') { const a = p[k], src = byId[p.id].abilities.find(x => x.key === k);
      assert.equal(a.name, src.name, `${p.id} ${k}: nombre`); assert.deepEqual(a.base, src.base, `${p.id} ${k}: números`); assert.deepEqual(a.cooldown, src.cooldown, `${p.id} ${k}: CD`);
      assert.ok(['estela', 'proyectil', 'glifo', 'aura', 'cono', 'muro', 'humo', 'cura', 'rayo'].includes(p.vfx.cast[k].kind), `${p.id} ${k}: vfx ${p.vfx.cast[k].kind}`); }
    assert.equal(p.pasiva.name, byId[p.id].passive.name, `${p.id}: pasiva`);
  }
});

test('el tipo de ataque es coherente con base_stats.range', () => {
  for (const p of pres) {
    const c = byId[p.id], r = c.base_stats.range;
    if (p.tipoAtaque === 'melee') assert.ok(r < 200, `${p.id}: melee con alcance ${r}`);
    else { assert.ok(r >= 500, `${p.id}: ${p.tipoAtaque} con alcance ${r}`);
      assert.equal(p.tipoAtaque, c.damage === 'Mágico' ? 'magic' : 'ranged', `${p.id}: daño ${c.damage}`); }
  }
  assert.equal(pres.filter(p => p.tipoAtaque === 'melee').length, 8);
  assert.equal(pres.filter(p => p.tipoAtaque === 'ranged').length, 2);
  assert.equal(pres.filter(p => p.tipoAtaque === 'magic').length, 5);
});

test('Rakhar tiene los aspectos felino y lagarto; el resto uno', () => {
  const r = pres.find(p => p.id === 'rakhar');
  assert.deepEqual(r.aspectos.map(a => a.id), ['felino', 'lagarto']);
  assert.deepEqual(r.aspectos.map(a => a.modelo), ['champ_rakhar', 'champ_rakhar_lagarto']);
  for (const p of pres) if (p.id !== 'rakhar') assert.equal(p.aspectos.length, 1, p.id);
});

test('anims sigue el contrato de D (Idle, Run, Attack, Cast, Death) y existe en el glb cuando el glb está', () => {
  let conGlb = 0, sinGlb = [];
  for (const p of pres) {
    for (const k of CLIPS) assert.equal(p.anims[k], k, `${p.id}: anims.${k}`);
    for (const a of p.aspectos) {
      const f = glbDe(a.modelo); if (!f) { sinGlb.push(a.modelo); continue; }
      conGlb++; const clips = clipsDelGlb(f);
      for (const k of CLIPS) assert.ok(clips.includes(p.anims[k]), `${a.modelo}.glb: falta el clip ${p.anims[k]} (tiene ${clips.join(', ')})`);
      const opc = (p.animsOpcionales || []).filter(k => !clips.includes(p.anims[k]));
      if (opc.length) console.log(`  aviso ${a.modelo}: sin clips opcionales ${opc.join(', ')}`);
    }
  }
  console.log(`  glb definitivos comprobados: ${conGlb}; pendientes de D: ${sinGlb.length} (${sinGlb.slice(0, 4).join(', ')}${sinGlb.length > 4 ? '…' : ''})`);
});

test('data.js lleva PRESENTATION idéntica al JSON y gsap está instalado', async () => {
  const src = readFileSync(join(GAME, 'src/data.js'), 'utf8');
  const m = src.match(/export const PRESENTATION = (.*);\n/); assert.ok(m, 'data.js sin PRESENTATION');
  assert.deepEqual(JSON.parse(m[1]), pres);
  const pkg = JSON.parse(readFileSync(join(GAME, 'package.json'), 'utf8'));
  assert.match(pkg.dependencies.gsap || '', /^\^?3\./);
  const gs = JSON.parse(readFileSync(join(GAME, 'node_modules/gsap/package.json'), 'utf8')); assert.match(gs.version, /^3\.1[3-9]|^3\.[2-9]/);
  for (const f of ['src/vfx.js', 'src/fichas.js']) assert.ok(existsSync(join(GAME, f)), f);
});
