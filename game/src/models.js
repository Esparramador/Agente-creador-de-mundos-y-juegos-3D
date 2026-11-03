// Asignación de modelos 3D (glTF) a cada unidad. Es la ÚNICA tabla que hay que tocar al sustituir un modelo
// (ver production/handoff/BLENDER-3D-HANDOFF.md). Todos los modelos de unidades son ya los DEFINITIVOS construidos
// con tools/blender/{champs_kaykit,monsters_quaternius,retarget_lagarto}.py a partir de assets/data/model_builds.json:
// cada uno lleva su propio esqueleto, sus armas/props en la mano y los clips con los nombres del contrato
// (Idle, Run, Attack, Cast, Death, Hit, Cast_Q…). Las tiras de evidencia están en production/qa/evidence/modelos/.
// h = altura en metros de mundo (1 m = 100 u. de juego); tint = color que se mezcla al 45 % (solo súbditos por equipo
// y dragones por elemento: el resto ya sale tintado del .glb); fly = altura de vuelo en m (voladores).

// Clips de los modelos definitivos (nombres obligatorios de model_specs.json)
export const FINAL = { idle: 'Idle', run: 'Run', attack: 'Attack', cast: 'Cast', death: 'Death', hit: 'Hit' };
const FINAL_NOCAST = { ...FINAL, cast: 'Attack' };          // súbditos y monstruos: sin clip Cast
const ROBOT = { idle: 'Idle', run: 'Running', attack: 'Punch', cast: 'ThumbsUp', death: 'Death' };

// Campeones (15): cada entrada apunta a game/assets/models/champ_<id>.glb
export const MODEL_MAP = {
  brannoc: { model: 'champ_brannoc', h: 1.9, anims: FINAL },   // enano: bajo y ancho, martillo de forja a dos manos
  morgra:  { model: 'champ_morgra', h: 2.4, anims: FINAL },    // orca: tótem
  ossuar:  { model: 'champ_ossuar', h: 2.7, anims: FINAL },    // gólem de huesos, garfio y caja torácica emisiva
  kaelith: { model: 'champ_kaelith', h: 2.2, anims: FINAL },   // paladina: espada y escudo
  tharok:  { model: 'champ_tharok', h: 2.4, anims: FINAL },    // hacha doble
  yssra:   { model: 'champ_yssra', h: 2.2, anims: FINAL },     // sirénida: tridente y aleta
  vaelor:  { model: 'champ_vaelor', h: 2.2, anims: FINAL },    // mago de ceniza: báculo con brasa
  nyxe:    { model: 'champ_nyxe', h: 1.7, anims: FINAL, fly: 0.3 },   // hada: alas translúcidas, flota
  zerath:  { model: 'champ_zerath', h: 2.3, anims: FINAL },    // espíritu encapuchado
  lyra:    { model: 'champ_lyra', h: 2.2, anims: FINAL },      // arquera: arco largo (Attack = tensar + soltar)
  gearix:  { model: 'champ_gearix', h: 1.7, anims: FINAL },    // ingeniera: trabuco, gafas y mochila
  sable:   { model: 'champ_sable', h: 2.2, anims: FINAL },     // asesina: dos dagas
  rakhar:  { model: 'champ_rakhar', h: 2.0, anims: FINAL },    // bestia cuadrúpeda (aspecto «lagarto» en SKINS)
  elowen:  { model: 'champ_elowen', h: 2.1, anims: FINAL },    // dríade: ramas, hojas y vara de raíz
  aurik:   { model: 'champ_aurik', h: 2.3, anims: FINAL },     // dracónido: lanza, cuernos y alas (R: champ_aurik_dragon)
};
// Aspectos alternativos por campeón: u.skin === '<nombre>'
export const SKINS = {
  rakhar: { lagarto: { model: 'champ_rakhar_lagarto', h: 2.0, anims: FINAL } },   // el lagarto de Joan con clips por retarget
};
// Forma Dragón de Aurik (buff 'dragon')
export const AURIK_DRAGON = { model: 'champ_aurik_dragon', h: 3.2, anims: FINAL, fly: 0.8 };

// Lista LITERAL (tools/bundle.mjs la lee con una expresión regular para incrustar los .glb en dist/)
export const MODEL_FILES = [
  'champ_brannoc', 'champ_morgra', 'champ_ossuar', 'champ_kaelith', 'champ_tharok', 'champ_yssra', 'champ_vaelor', 'champ_nyxe',
  'champ_zerath', 'champ_lyra', 'champ_gearix', 'champ_sable', 'champ_rakhar', 'champ_elowen', 'champ_aurik', 'champ_rakhar_lagarto', 'champ_aurik_dragon',
  'minion_melee', 'minion_caster', 'minion_siege', 'minion_super', 'minion_ram',
  'monster_golem', 'monster_bestia', 'monster_lobo', 'monster_ave', 'monster_roca', 'monster_sapo',
  'epic_dragon', 'epic_heraldo', 'epic_senor', 'epic_avatar',
  'personaje',                                   // torreta/mascota de Gearix (RobotExpressive, CC0)
  'tree', 'cypress', 'kk_bush',
  // hechos en Blender (tools/blender/build_structures.py)
  'struct_tower', 'struct_inhib', 'struct_nexus', 'struct_fountain', 'prop_ward'];
// Escenarios hechos en Blender (tools/blender/build_maps.py): se carga solo el del mapa en juego
export const MAP_FILES = { grieta_ceniza: 'map_grieta_ceniza', puente_niebla: 'map_puente_niebla', ruinas_eclipse: 'map_ruinas_eclipse' };

const TEAM_TINT = [0x64b5f6, 0xef5350];
// Dragón elemental: un solo modelo, cuatro tintes (por u.dragonType; si no, por el nombre)
const DRAGON_TINT = { Ceniza: 0xff7043, Marea: 0x4fc3f7, 'Raíz': 0x66bb6a, Forja: 0xffb300 };
// CONTRATO con C (world.js): los monstruos de campamento llevan u.ctype (golem|bestia|lobos|aves|roca|sapo);
// si no viene, se usa u.camp.type. u.big = el grande del campamento.
const CAMP_MODELS = {
  golem:  { model: 'monster_golem', h: 2.0 },
  bestia: { model: 'monster_bestia', h: 1.8 },
  lobos:  { model: 'monster_lobo', h: 1.2 },
  aves:   { model: 'monster_ave', h: 1.0, fly: 0.5 },
  roca:   { model: 'monster_roca', h: 1.6 },
  sapo:   { model: 'monster_sapo', h: 1.4 },
};
export function UNIT_MODELS(u) {
  if (u.kind === 'champ') return (u.skin && SKINS[u.cid]?.[u.skin]) || MODEL_MAP[u.cid];
  if (u.kind === 'minion') {
    const tint = TEAM_TINT[u.team];
    if (u.mtype === 'caster') return { model: 'minion_caster', h: 1.2, tint, anims: FINAL_NOCAST };
    if (u.ram) return { model: 'minion_ram', h: 2.6, tint, anims: FINAL_NOCAST };
    if (u.mtype === 'siege') return { model: 'minion_siege', h: 1.7, tint, anims: FINAL_NOCAST };
    if (u.mtype === 'super') return { model: 'minion_super', h: 2.2, tint, anims: FINAL_NOCAST };
    return { model: 'minion_melee', h: 1.2, tint, anims: FINAL_NOCAST };
  }
  if (u.kind === 'monster') {
    if (u.epicType === 'dragon') { const t = u.dragonType || Object.keys(DRAGON_TINT).find(k => (u.name || '').includes(k)); return { model: 'epic_dragon', h: 3.6, tint: DRAGON_TINT[t] ?? null, anims: FINAL_NOCAST, fly: 0.8 }; }
    if (u.epicType === 'herald') return { model: 'epic_heraldo', h: 2.4, anims: FINAL_NOCAST };
    if (u.epicType === 'lord') return { model: 'epic_senor', h: 3.2, anims: FINAL_NOCAST };
    if (u.epicType === 'avatar') return { model: 'epic_avatar', h: 2.4, anims: FINAL_NOCAST, fly: 0.6 };
    const c = CAMP_MODELS[u.ctype ?? u.camp?.type] || CAMP_MODELS.lobos;
    return { ...c, h: u.big ? c.h : c.h * 0.7, anims: FINAL_NOCAST };
  }
  if (u.kind === 'pet') return { model: 'personaje', h: 1.0, tint: TEAM_TINT[u.team], anims: ROBOT };
  if (u.kind === 'ward') return { model: 'prop_ward', h: 0.95, team: u.team, anims: {} };
  if (u.structure) return { model: { tower: 'struct_tower', inhib: 'struct_inhib', nexus: 'struct_nexus' }[u.kind], h: { tower: 5.65, inhib: 2.6, nexus: 5.0 }[u.kind], team: u.team, structure: true, anims: {} };
  return { model: null };
}
