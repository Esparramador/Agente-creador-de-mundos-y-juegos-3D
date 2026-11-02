// Asignación de modelos 3D (glTF) a cada unidad. Es la ÚNICA tabla que hay que tocar al sustituir
// un modelo provisional por el definitivo de Blender (ver production/handoff/BLENDER-3D-HANDOFF.md).
// h = altura en metros de mundo (1 m = 100 u. de juego); tint = color que se mezcla al 45%; sx = escala X/Z.
// anims = clip glTF para cada estado: idle, run, attack, cast, death.

const KAY = { idle: 'Idle', run: 'Running_A', attack: '1H_Melee_Attack_Chop', cast: 'Spellcast_Shoot', death: 'Death_A' };
const KAY_RANGED = { ...KAY, attack: 'Spellcast_Shoot' };
const KAY_2H = { ...KAY, attack: '2H_Melee_Attack_Chop' };
const SKEL = { ...KAY, idle: 'Idle_Combat' };
const ROBOT = { idle: 'Idle', run: 'Running', attack: 'Punch', cast: 'ThumbsUp', death: 'Death' };
// Clips de los modelos DEFINITIVOS hechos en Blender (nombres obligatorios de model_specs.json)
export const FINAL = { idle: 'Idle', run: 'Run', attack: 'Attack', cast: 'Cast', death: 'Death' };
const LIZARD = { idle: 'Idle', run: 'Idle', attack: 'Coger', cast: 'Saludo', death: 'Adios' };

// Campeones: modelo provisional → definitivo (columna "final" del documento de handoff)
export const MODEL_MAP = {
  brannoc: { model: 'ka_Knight', h: 1.9, sx: 1.25, tint: 0x9e7a5a, anims: KAY_2H },       // enano: bajo y ancho
  morgra:  { model: 'ka_Barbarian', h: 2.4, tint: 0x6aa84f, anims: KAY_2H },              // orca: piel verde
  ossuar:  { model: 'ks_Skeleton_Warrior', h: 2.7, anims: SKEL },                         // gólem de huesos
  kaelith: { model: 'ka_Knight', h: 2.2, tint: 0xffe082, anims: KAY },                    // paladina dorada
  tharok:  { model: 'ka_Barbarian', h: 2.4, tint: 0xc62828, anims: KAY_2H },              // hacha roja
  yssra:   { model: 'ka_Rogue', h: 2.2, tint: 0x26c6da, anims: KAY },                     // sirénida
  vaelor:  { model: 'ka_Mage', h: 2.2, tint: 0xff7043, anims: KAY_RANGED },               // mago de ceniza
  nyxe:    { model: 'ka_Mage', h: 1.7, tint: 0xea80fc, anims: KAY_RANGED },               // hada
  zerath:  { model: 'ks_Skeleton_Mage', h: 2.3, tint: 0x7c4dff, anims: { ...SKEL, attack: 'Spellcast_Shoot' } },
  lyra:    { model: 'ka_Rogue', h: 2.2, anims: KAY_RANGED },                              // arquera élfica
  gearix:  { model: 'personaje', h: 1.7, anims: ROBOT, yaw: 0 },                          // ingeniera (robot)
  sable:   { model: 'ks_Skeleton_Rogue', h: 2.2, tint: 0x37474f, anims: SKEL },
  rakhar:  { model: 'lagarto', h: 2.0, tint: 0xd84315, anims: LIZARD },                   // bestial (tu lagarto)
  elowen:  { model: 'ka_Mage', h: 2.1, tint: 0x66bb6a, anims: KAY_RANGED },               // dríade
  aurik:   { model: 'ka_Knight', h: 2.3, tint: 0xffca28, anims: KAY },                    // dracónido (R: mini_dragon_blue)
};

export const MODEL_FILES = ['ka_Knight', 'ka_Barbarian', 'ka_Mage', 'ka_Rogue', 'ks_Skeleton_Warrior', 'ks_Skeleton_Mage', 'ks_Skeleton_Rogue',
  'ks_Skeleton_Minion', 'personaje', 'lagarto', 'mini_dragon_blue', 'lord_tuetano', 'guerrero', 'guerrero_2', 'tree', 'cypress', 'kk_bush',
  // hechos en Blender (tools/blender/build_structures.py)
  'struct_tower', 'struct_inhib', 'struct_nexus', 'struct_fountain', 'prop_ward'];
// Escenarios hechos en Blender (tools/blender/build_maps.py): se carga solo el del mapa en juego
export const MAP_FILES = { grieta_ceniza: 'map_grieta_ceniza', puente_niebla: 'map_puente_niebla', ruinas_eclipse: 'map_ruinas_eclipse' };

const TEAM_TINT = [0x64b5f6, 0xef5350];
export function UNIT_MODELS(u) {
  if (u.kind === 'champ') return MODEL_MAP[u.cid];
  if (u.kind === 'minion') {
    if (u.mtype === 'caster') return { model: 'ks_Skeleton_Mage', h: 1.2, tint: TEAM_TINT[u.team], anims: { ...SKEL, attack: 'Spellcast_Shoot' } };
    if (u.mtype === 'siege' || u.mtype === 'ram') return { model: 'ks_Skeleton_Warrior', h: u.ram ? 2.6 : 1.7, tint: TEAM_TINT[u.team], anims: KAY_2H };
    if (u.mtype === 'super') return { model: 'ks_Skeleton_Warrior', h: 2.2, tint: TEAM_TINT[u.team], anims: KAY_2H };
    return { model: 'ks_Skeleton_Minion', h: 1.2, tint: TEAM_TINT[u.team], anims: SKEL };
  }
  if (u.kind === 'monster') {
    if (u.epicType === 'dragon') return { model: 'mini_dragon_blue', h: 3.6, tint: { 'Dragón de Ceniza': 0xff7043, 'Dragón de Marea': null, 'Dragón de Raíz': 0x66bb6a, 'Dragón de Forja': 0xffb300 }[u.name] ?? null, anims: {} };
    if (u.epicType) return { model: 'lord_tuetano', h: u.epicType === 'lord' ? 3.2 : 2.4, tint: u.epicType === 'avatar' ? 0x9575cd : u.epicType === 'herald' ? 0xff8a65 : null, anims: {} };
    return u.big ? { model: 'ks_Skeleton_Warrior', h: 1.9, tint: 0x8d6e63, anims: SKEL } : { model: 'ks_Skeleton_Minion', h: 1.0, tint: 0xa1887f, anims: SKEL };
  }
  if (u.kind === 'pet') return { model: 'personaje', h: 1.0, tint: TEAM_TINT[u.team], anims: ROBOT };
  if (u.kind === 'ward') return { model: 'prop_ward', h: 0.95, team: u.team, anims: {} };
  if (u.structure) return { model: { tower: 'struct_tower', inhib: 'struct_inhib', nexus: 'struct_nexus' }[u.kind], h: { tower: 5.65, inhib: 2.6, nexus: 5.0 }[u.kind], team: u.team, structure: true, anims: {} };
  return { model: null };
}
