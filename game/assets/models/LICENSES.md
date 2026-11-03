# Licencias de los modelos 3D

Todos los modelos de unidades son ahora **construcciones propias sobre packs CC0** (dominio público: uso comercial sin
atribución, aunque se agradece «Kay Lousberg / KayKit» y «Quaternius»). La receta de cada uno está en
`assets/data/model_builds.json` y los scripts en `tools/blender/{champs_kaykit,monsters_quaternius,retarget_lagarto}.py`.
Los packs descargados viven en `Agente/assets-libres/` con su `.origen.json` (URL oficial, fecha, sha256).

| Archivo | Base | Origen | Licencia |
|---|---|---|---|
| `champ_brannoc`, `champ_kaelith`, `champ_aurik` | `ka_Knight` + armas y props | KayKit Character Pack: Adventurers 1.0 (Kay Lousberg) | CC0 1.0 |
| `champ_morgra`, `champ_tharok` | `ka_Barbarian` | KayKit Adventurers 1.0 | CC0 1.0 |
| `champ_vaelor`, `champ_nyxe`, `champ_gearix`, `champ_elowen` | `ka_Mage` | KayKit Adventurers 1.0 | CC0 1.0 |
| `champ_yssra`, `champ_lyra` | `ka_Rogue` | KayKit Adventurers 1.0 | CC0 1.0 |
| `champ_ossuar`, `minion_siege`, `minion_super`, `minion_ram` | `ks_Skeleton_Warrior` | KayKit Character Pack: Skeletons 1.0 (Kay Lousberg) | CC0 1.0 |
| `champ_zerath`, `minion_caster` | `ks_Skeleton_Mage` | KayKit Skeletons 1.0 | CC0 1.0 |
| `champ_sable` | `ks_Skeleton_Rogue` + dagas de `ka_Rogue` | KayKit Skeletons 1.0 + Adventurers 1.0 | CC0 1.0 |
| `minion_melee` | `ks_Skeleton_Minion` | KayKit Skeletons 1.0 | CC0 1.0 |
| Clips extra de los campeones (`Melee_*`, `Ranged_Bow_*`, `Ranged_Magic_*`, `Dodge_*`, `Sneaking`, `Skeletons_Taunt`…) | Rig_Medium | KayKit Character Animations 1.1 Free (Kay Lousberg, kaylousberg.itch.io, sha256 `65882f31…be20f`) | CC0 1.0 |
| `epic_dragon`, `champ_aurik_dragon` (Dragon), `epic_avatar` (Bat), `monster_roca` (Slime) | FBX | Quaternius · LowPoly Animated Monsters (quaternius.itch.io, sha256 `c0b73e7d…7a9b`) | CC0 1.0 |
| `epic_heraldo` (Trex), `monster_golem` (Stegosaurus), `monster_bestia` (Triceratops), `champ_rakhar` (Velociraptor) | FBX | Quaternius · Animated LowPoly Dinosaurs (quaternius.itch.io) | CC0 1.0 |
| `epic_senor` (Spider), `monster_lobo` (Rat), `monster_ave` (Wasp), `monster_sapo` (Frog) | FBX | Quaternius · Animated Easy Enemies (quaternius.itch.io) | CC0 1.0 |
| `champ_rakhar_lagarto` | `lagarto` de Joan (Lazy Lizard, Tripo) + clips retargeteados | Malla: propiedad del autor (Esparramador/lazy-lizard-3d). Clips: Quaternius Universal Animation Library | Malla propia · clips CC0 1.0 |
| `personaje.glb` | — | *RobotExpressive* de los ejemplos de three.js (Tomás Laulhé, mod. Don McCurdy); torreta/mascota de Gearix | CC0 1.0 |
| `kk_bush.glb` | — | KayKit City Builder Bits 1.0 | CC0 1.0 |
| `tree.glb`, `cypress.glb` | — | Esparramador/ceo-empire (generados con Blender) | Propiedad del autor |
| `struct_*.glb`, `prop_ward.glb`, `map_*.glb` | — | Hechos en Blender (`tools/blender/build_structures.py`, `build_maps.py`) | Propios |

Retirados el 03/11/2026 (ya tienen sustituto CC0): `guerrero.glb`, `guerrero_2.glb`, `mini_dragon_blue.glb`,
`lord_tuetano.glb`, `lagarto.glb` (el original queda en `src/` como fuente de `champ_rakhar_lagarto`), y los
`ka_*.glb`/`ks_*.glb` teñidos (siguen en `src/` como base de los scripts). Los bustos de los nexos son ahora
estandartes del equipo generados en `render3d.js`.

Los `.glb` de esta carpeta están optimizados con gltf-transform (meshopt + WebP 1024 px) por
`tools/blender/integrate_model.sh`; los exportados sin optimizar están en `final/` y los originales de los packs en `src/`.
