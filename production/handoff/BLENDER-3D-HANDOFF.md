# Traspaso: modelos 3D definitivos con Blender (modelar, texturizar, riggear y animar)

> **Para quién:** una sesión nueva de Claude Code abierta en la raíz de este repositorio, con Blender 4.2 LTS o superior instalado.
> **Objetivo:** sustituir los 40 modelos provisionales del juego por modelos propios, coherentes, texturizados y animados. Cada uno debe pasar el validador automático y verse bien en el juego.
> **Estado al traspasar (2026-11-02):** el juego funciona en 3D (three.js) con modelos provisionales. Hay 77 pruebas de simulación y 35 comprobaciones en navegador, todas superadas. El flujo Blender → glTF → validador → juego está probado de punta a punta con un maniquí (`tools/blender/selftest_pipeline.py`).

---

## 0. Cómo empezar la sesión (copia este mensaje en Claude Code)

```text
Lee production/handoff/BLENDER-3D-HANDOFF.md entero y sigue su plan.
Empieza por el §3 (dirección de arte): ejecuta /art-bible con esos datos.
Después produce los modelos en el orden del §7, uno a uno. Para cada modelo:
setup_scene.py → modelar → UV y texturas → rig → animaciones → export_glb.py
(debe salir ✓) → render_preview.py → integrate_model.sh → actualizar game/src/models.js
→ node game/tools/bundle.mjs → pruebas (§8) → captura del juego en production/qa/evidence/.
Pregúntame antes de cambiar el diseño de un campeón. No hagas commit sin pedírmelo.
```

Agentes y skills del estudio (CCGS) que conviene usar:

| Tarea | Agente / skill |
|---|---|
| Biblia de arte, paleta, siluetas | `/art-bible`, agente `art-director` |
| Ficha de cada asset (+ prompts para IA de base) | `/asset-spec` |
| Rig, shaders, presupuestos y exportación | agente `technical-artist` |
| Animaciones de combate y lectura de habilidades | `/team-combat` (game-designer, technical-artist) |
| Auditoría de nombres, tamaños y formatos | `/asset-audit` |
| Rendimiento (tris, llamadas de dibujo) | `/perf-profile`, agente `performance-analyst` |
| Pulido final | `/team-polish` |
| Cerrar cada historia con evidencia | `/story-done` |

---

## 1. Qué hay ahora mismo (provisional)

Los modelos provisionales vienen de tus repositorios de GitHub. Los originales sin optimizar están en `game/assets/models/src/`; las versiones optimizadas que usa el juego, en `game/assets/models/*.glb`.

| Modelo | Origen | Licencia | Uso actual en el juego |
|---|---|---|---|
| `ka_Knight`, `ka_Barbarian`, `ka_Mage`, `ka_Rogue` | `ceo-empire/public/assets/kit` (KayKit Adventurers, Kay Lousberg) | CC0 | 9 campeones, con tintes de color |
| `ks_Skeleton_Warrior`, `_Mage`, `_Rogue`, `_Minion` | `ceo-empire` (KayKit Skeletons) | CC0 | Ossuar, Zerath y Sable; súbditos y monstruos |
| `guerrero`, `guerrero_2` | `ceo-empire/public/assets/models` | Tuyos | Bustos sobre las torres (no tienen piernas) |
| `mini_dragon_blue` | `ceo-empire/public/assets/models` | Tuyo | Dragón Elemental y Forma Dragón de Aurik (sin esqueleto) |
| `lord_tuetano` | `ceo-empire/public/assets/models` | Tuyo | Heraldo, Señor y Avatar (sin esqueleto) |
| `lagarto` | `lazy-lizard-3d/modelo` | Tuyo | Rakhar (60 huesos, pero sin clips de combate) |
| `personaje` | `Shopy-Crafter/.../regalo-demo` | CC0 (es el *RobotExpressive* de los ejemplos de three.js, no es tuyo) | Gearix y su torreta |
| `tree`, `cypress`, `kk_bush` | `ceo-empire` | Tuyos / CC0 | Matorrales, árboles y guardianes |
| `ceo_crafter`, `paula` | `ceo-empire`, `Shopy-Crafter` | Tuyos | **No se usan:** son de estética moderna y no encajan con la fantasía |

Informe del validador sobre los provisionales: `node game/tools/validate_models.mjs --current`. Solo cumplen 3 de 16. Los fallos son demasiados triángulos, el origen fuera de los pies y la falta de clips de combate. Eso es lo que hay que resolver.

**Dónde se decide qué modelo usa cada unidad:** solo en `game/src/models.js` (`MODEL_MAP`, `UNIT_MODELS` y `MODEL_FILES`). El render (`game/src/render3d.js`) no necesita cambios para modelos nuevos.

---

## 2. Especificación técnica (obligatoria)

La versión legible por máquina está en `assets/data/model_specs.json` y la aplica `game/tools/validate_models.mjs`.

| Regla | Valor |
|---|---|
| Formato | glTF 2.0 binario (`.glb`), un archivo por asset (con variantes de equipo como `_aurora` / `_crepusculo`) |
| Escala | 1 m de Blender = 1 unidad three.js = 100 unidades de juego. Altura objetivo por asset en `model_specs.json` |
| Ejes | Exportar con *+Y Up*. En Blender el personaje **mira hacia −Y** (sale como +Z en glTF, el «frente» del juego) |
| Origen | En los pies, z = 0, centrado en X/Y. Transformaciones aplicadas |
| Triángulos | Campeón 6 k–20 k · súbdito 1,5 k–6 k · monstruo 2 k–12 k · épico 8 k–30 k · estructura ≤ 8 k · prop ≤ 3 k |
| Materiales | 1–2 por modelo (PBR Principled BSDF: Base Color, ORM y Normal). Evitar transparencias salvo efectos |
| Texturas | Campeón y épico ≤ 2048 px; el resto ≤ 1024. Se exportan en PNG; `integrate_model.sh` las pasa a WebP de 1024 |
| Esqueleto | Humanoides: ≤ 80 huesos, nombres en inglés (`Hips`, `Spine`, `Head`, `Arm.L`, …). Máximo 4 influencias por vértice |
| Animación | 30 fps, *in place* (sin mover la raíz), en bucle donde toque (Idle, Run) |
| Clips obligatorios | Campeón: `Idle`, `Run`, `Attack`, `Cast`, `Death`. Súbdito: `Idle`, `Run`, `Attack`, `Death`. Monstruo y épico: `Idle`, `Attack`, `Death` |
| Clips recomendados | `Attack2`, `Cast_Q`, `Cast_W`, `Cast_E`, `Cast_R`, `Hit`, `Recall`, `Victory`, `Taunt`. Épicos: `Roar`, `Spawn`. Estructuras: `Destroy` |
| Colecciones de Blender | `MODEL` (mallas), `RIG` (armadura) y `REF` (referencias; nunca se exporta). Las crea `setup_scene.py` |
| Archivos | `art/blender/<asset_id>/<asset_id>.blend` (+ texturas fuente en la misma carpeta) |

**Lectura en el juego:** la cámara está a unos 30 m con 38° de FOV, así que el personaje ocupa unos 60–90 px de alto. Prioriza **siluetas claras**, cabeza y arma algo grandes (estilo *chibi* heroico, como KayKit), colores de bloque y poco detalle fino. Mira el juego con `tools/blender/render_preview.py`, vista «juego».

---

## 3. Dirección de arte (para `/art-bible`)

- **Estilo:** fantasía estilizada *low-poly* pintada a mano, con proporciones heroicas algo achatadas (cabeza ≈ 1/4 de la altura), bordes biselados y sombreado limpio. Coherente con KayKit para poder mezclar provisionales y definitivos durante la transición.
- **Equipos:**
  - Aurora: azul #42a5f5, con acentos plata.
  - Crepúsculo: rojo #ef5350, con acentos bronce.
  - Modo daltónico: naranja #ff9800.

  Los súbditos y las estructuras usan el color de equipo en una máscara de material (*team mask*) o en variantes `_aurora` / `_crepusculo`.
- **Facciones (paleta y motivos):**

  | Facción | Paleta | Motivos |
  |---|---|---|
  | Clanes de Hondaforja | Hierro y bronce | Runas de forja, remaches |
  | Horda de Colmillo Rojo | Rojo óxido y hueso | Colmillos, pieles, tatuajes |
  | Reino Velado | Gris hueso y verde espectral | Costillas, sudarios |
  | Orden del Sol Partido | Oro y blanco | Soles partidos, tabardos |
  | Abismo de Coral | Turquesa y coral | Conchas, escamas, nácar |
  | Concilio de la Torre Gris | Gris ceniza y naranja brasa | Túnicas quemadas, ascuas |
  | Bosque Onírico | Verde musgo y violeta | Hojas, alas, flores |
  | La Grieta | Negro violáceo | Ojos múltiples, fractales |
  | Consorcio de Engranajes | Latón y verde óxido | Tuercas, gafas |
  | Hermandad del Velo | Negro y púrpura apagado | Capuchas, dagas |
  | Tribus de las Dunas | Arena y escarlata | Plumas, huesos, pinturas |

- **Mapas:**

  | Mapa | Paleta | Ambiente |
  |---|---|---|
  | Grieta de Ceniza | Grises cálidos y lava naranja | Ruinas élficas calcinadas |
  | Puente de la Niebla | Azul y blanco | Piedra helada, niebla |
  | Ruinas del Eclipse | Violeta y dorado | Templo cubierto de lianas |

---

## 4. Flujo de trabajo por asset (probado)

```bash
# 1) escena preparada (unidades, altura de referencia, frente, cámara del juego)
blender -b -P tools/blender/setup_scene.py -- champ_kaelith
# 2) trabajo en Blender (GUI o por script): modelado → UV → texturas → rig → acciones con los nombres del §2
blender art/blender/champ_kaelith/champ_kaelith.blend
# 3) exportar + validar (sale ✓ o lista los ERRORES a corregir)
blender -b art/blender/champ_kaelith/champ_kaelith.blend -P tools/blender/export_glb.py
# 4) evidencia visual (4 vistas + 3 fotogramas por clip)
blender -b art/blender/champ_kaelith/champ_kaelith.blend -P tools/blender/render_preview.py
# 5) optimizar e integrar
bash tools/blender/integrate_model.sh champ_kaelith
#    y en game/src/models.js:  kaelith: { model: 'champ_kaelith', h: 2.2, anims: FINAL }  (+ 'champ_kaelith' en MODEL_FILES)
# 6) reconstruir y probar (§8)
```

- **Sin interfaz:** `pip install bpy==4.2.0` permite ejecutar los scripts con `python3` en lugar de `blender -b -P` (es como se probó aquí).
- **Ejemplo completo por script:** `tools/blender/selftest_pipeline.py` crea un maniquí con 7 huesos, material PBR y los 5 clips, y lo exporta y valida (✓ 1/1). Sirve de referencia para la API de bpy: armadura, grupos de vértices, keyframes y acciones.

### Cómo llegar a calidad final (recomendado)
Modelar personajes de calidad solo con primitivas por script no da un resultado profesional. Conviene este flujo híbrido, que ya usaste en `lazy-lizard-3d` (`fuentes/lagarto-rig-tripo.glb`):

1. **Base:** concept → malla base generada (Tripo, Meshy o Rodin, con los prompts que da `/asset-spec`) o esculpida en Blender. Importar en la colección `MODEL`.
2. **Limpieza:** retopología (Remesh/Decimate + QuadriFlow o retopo manual) hasta el presupuesto de triángulos; simetría; eliminar geometría interna.
3. **UV:** *Smart UV Project* o costuras manuales. Un solo atlas de 2048 px para campeones.
4. **Texturas:** bakear del alto al bajo poligonaje (normal y AO) y pintar el color base en Texture Paint o con nodos procedurales. Exportar Base Color + ORM + Normal.
5. **Rig:** Rigify (*Human Meta-Rig* → *Generate*) o Auto-Rig; renombrar los huesos deformadores al esquema del §2; pesos automáticos y corrección a mano en hombros y caderas.
6. **Animación:** los 5 clips obligatorios primero y luego los recomendados. Referencias de timing:

   | Clip | Duración |
   |---|---|
   | Idle | 2–3 s, en bucle |
   | Run | 0,6–0,8 s por ciclo, *in place* |
   | Attack | 0,5–0,7 s (el impacto al 40%) |
   | Cast | 0,4–0,6 s |
   | Death | 1–1,5 s, sin bucle |

7. **Opcional — Blender MCP:** con el complemento *blender-mcp*, Claude Code puede manejar una sesión de Blender abierta (ver la escena, ejecutar bpy y capturar el visor). Así es más fácil iterar el aspecto que solo en modo `-b`.

---

## 5. Fichas de arte por campeón (silueta · materiales · arma · animaciones clave)

> Los datos de juego (clase, raza, habilidades) están en `design/gdd/champion-roster.md`. Aquí solo va lo visual. Cada `Cast_*` debe leerse desde la cámara cenital.

| # | Asset | Campeón | Silueta y rasgos | Materiales y paleta | Arma | Animaciones a cuidar |
|---|---|---|---|---|---|---|
| 1 | `champ_brannoc` | Brannoc, Enano tanque (Hondaforja) | Muy ancho y bajo, barba trenzada, yunque a la espalda | Hierro, bronce, cuero; brasas naranjas en las runas | Martillo de forja a dos manos | Cast_Q golpe al suelo; Cast_R levanta los brazos y surgen pilares |
| 2 | `champ_morgra` | Morgra, Orca tanque (Horda) | Corpulenta, tótem en el pecho, melena con huesos | Piel verde oliva, pieles, tatuajes rojos | Garras y tótem | Cast_Q planta el tótem; Cast_R carga de embestida |
| 3 | `champ_ossuar` | Ossuar, gólem de huesos (Reino Velado) | Enorme, jaula torácica abierta con brillo verde dentro | Hueso amarillento, sudario gris, verde espectral emisivo | Garfio de costilla | Cast_Q lanzar garfio; Death se desmorona en huesos |
| 4 | `champ_kaelith` | Kaelith, paladina humana (Sol Partido) | Armadura de placas con tabardo, capa, pelo corto | Oro, blanco, rojo apagado | Espada larga solar | Attack con tajo amplio; Cast_E zancada; Cast_R salto con mandoble |
| 5 | `champ_tharok` | Tharok, Orco luchador (Horda) | Hombros enormes, torso tatuado, cicatrices | Piel verde oscuro, hierro negro, rojo | Hacha doble | Cast_Q torbellino (giro de 1,5 s en bucle); Cast_R rugido rojo |
| 6 | `champ_yssra` | Yssra, sirénida (Abismo de Coral) | Escamas en brazos y cuello, aletas en las orejas, corona de coral | Turquesa, coral, nácar iridiscente | Tridente | Cast_E surfear (pose inclinada); Cast_R tridente al cielo |
| 7 | `champ_vaelor` | Vaelor, elfo de Ceniza mago (Torre Gris) | Alto y delgado, túnica chamuscada, orejas largas | Gris ceniza, naranja brasa emisivo | Báculo con brasa | Cast_R canalización de 2 s (bucle) con brazos al cielo |
| 8 | `champ_nyxe` | Nyxe, hada (Bosque Onírico) | Pequeña, alas translúcidas de polilla, flota a 30 cm | Violeta, rosa, alas semitransparentes (alpha clip) | Polvo de hada (sin arma) | Idle flotando; Cast_E desvanecerse |
| 9 | `champ_zerath` | Zerath, espíritu del Vacío (La Grieta) | Forma humanoide incompleta, se deshace en jirones, varios ojos | Negro violáceo, emisivo morado | Manos-garra | Cast_W drenaje (bucle de 3 s); Cast_R implosión |
| 10 | `champ_lyra` | Lyra, elfa silvana arquera (Bosque Onírico) | Capucha, carcaj, postura ligera | Verde musgo, cuero claro, plumas blancas | Arco largo | Attack disparo (tensar, soltar); Cast_R arco al cielo cargando |
| 11 | `champ_gearix` | Gearix, gnoma ingeniera (Engranajes) | Diminuta, gafas grandes, mochila de herramientas | Latón, verde óxido, cuero | Escopeta-trabuco | Attack retroceso; Cast_Q desplegar torreta; Cast_E salto hacia atrás |
| 12 | `champ_sable` | Sable, asesina humana (Hermandad del Velo) | Capucha y máscara, capa rasgada | Negro, púrpura apagado, metal pulido | Dos dagas | Attack combo de dos golpes; Cast_W fundido a invisible |
| 13 | `champ_rakhar` | Rakhar, bestia felina (Tribus de las Dunas) | Cuadrúpedo/bípedo felino, melena con plumas | Pelaje arena, rayas escarlata, pinturas tribales | Garras | Cast_E abalanzarse; Run a cuatro patas |
| 14 | `champ_elowen` | Elowen, dríade (Bosque Onírico) | Cuerpo de corteza y hojas, flores en el pelo | Madera, verde vivo, flores rosas | Vara de raíz | Cast_W curación (brazos abiertos); Cast_R floración |
| 15 | `champ_aurik` | Aurik, dracónido (Sol Partido) | Humanoide con escamas doradas, alas plegadas y cola | Oro, blanco, cuernos marfil | Lanza | Cast_R transformación |
| 15b | `champ_aurik_dragon` | Aurik en Forma Dragón | Dragón dorado de 3,2 m, alas abiertas | Oro y blanco | — | Idle volando, Attack aliento, Death |

> **Rakhar:** el provisional es tu lagarto (mascota de Lazy Lizard). El diseño pide un felino. Si prefieres conservar tu lagarto como Rakhar, cambia la raza en `tools/champions_src.py` y le hacen falta los clips de combate (`Run`, `Attack`, `Cast`, `Death`) sobre su esqueleto de 60 huesos.

---

## 6. Fichas del resto de unidades y escenario

| Asset | Descripción visual | Notas |
|---|---|---|
| `minion_melee` (×2 equipos) | Soldado de piedra animada con escudo, 1,2 m | Variante por equipo (color de hombreras y escudo) |
| `minion_caster` | Acólito con orbe flotante | Attack = lanzar orbe |
| `minion_siege` / `minion_super` | Gólem con cañón a la espalda / gólem gigante con cristal | Super: brillo de equipo |
| `minion_ram` | Ariete del Heraldo: tronco con cabeza de carnero de forja | Run lento y pesado |
| `monster_golem` | Gólem de Ceniza (bonus azul), roca gris con runas azules | Idle respirando, Death se desmorona |
| `monster_bestia` | Bestia Ígnea (bonus rojo), cuadrúpedo de lava | Partículas fuera del modelo |
| `monster_lobo`, `monster_ave`, `monster_roca`, `monster_sapo` | Lobo de ceniza, ave carroñera, roca viva y sapo de lava | Grandes y pequeños por escala |
| `epic_dragon` (4 variantes) | Dragón de 3,6 m. Ceniza naranja, Marea azul, Raíz verde y Forja dorado | Basado en tu `mini_dragon_blue`, reducido a ≤ 30 k triángulos, riggeado y animado (Idle, Attack aliento, Roar, Death) |
| `epic_heraldo` | Bestia de forja con ojo central | Al morir deja el ojo (prop aparte) |
| `epic_senor` | Señor de la Ceniza: gran cabeza con tentáculos de ascua (evolución de tu `lord_tuetano`) | Spawn sale del suelo |
| `epic_avatar` | Avatar del Eclipse: figura de luz violeta y dorada | Emisivo |
| `struct_tower` (×2) | Torre de piedra de 5,8 m con cristal de equipo. Tus bustos `guerrero` y `guerrero_2` como remate | Destroy: colapso; mantener ≤ 8 k (los bustos tienen 18 k y hay que reducirlos) |
| `struct_inhib`, `struct_nexus`, `struct_fountain` (×2) | Cristal flotante sobre anillo de piedra / gran cristal hexagonal / fuente con plataforma | Brillo del color de equipo |
| `prop_bush`, `prop_tree`, `prop_cypress`, `prop_rock`, `prop_ward` | Vegetación, rocas y guardián (un farol con ojo) | Una variante por mapa (ceniza, hielo y templo) |

---

## 7. Orden de producción (de mayor a menor impacto visual)

1. `minion_melee` y `minion_caster` (los más vistos en pantalla) más `struct_tower`.
2. Cinco campeones, uno por clase: `champ_kaelith`, `champ_vaelor`, `champ_lyra`, `champ_brannoc` y `champ_sable` (hito M2 de `production/demo-scope.md`).
3. `epic_dragon` (riggear tu dragón) y `monster_golem` / `monster_bestia`.
4. Los 10 campeones restantes, más `champ_aurik_dragon`.
5. El resto de súbditos, monstruos y épicos, estructuras y props por mapa.

Cada punto es una historia de la épica E2/E3. Ciérrala con `/story-done`, que exige captura en `production/qa/evidence/`.

---

## 8. Pruebas y criterios de aceptación de cada modelo

```bash
node game/tools/validate_models.mjs game/assets/models/final/<id>.glb --as <id>   # debe dar ✓ (0 ERRORES)
node game/tools/bundle.mjs                                                       # reconstruye dist/
node --test game/tests/game.test.mjs                                             # 77/77 (la simulación no debe cambiar)
python3 game/tests/e2e_browser.py                                                # 35/35 en Chromium + capturas
python3 studio-tests/run_capability_tests.py                                     # el estudio sigue íntegro
```

Un modelo está **terminado** cuando:
1. El validador da ✓ (sin errores; los avisos están justificados en la historia).
2. En el juego se ve a la altura correcta, mira hacia donde camina y reproduce Idle, Run, Attack, Cast y Death en el momento adecuado. Compruébalo con la vista previa (`game/tools/preview/`) y una partida.
3. Hay capturas en `production/qa/evidence/models/` (render_preview) y una del juego.
4. La licencia está anotada en `game/assets/models/LICENSES.md`.
5. La partida en el navegador mantiene más de 50 fps en una GPU integrada con 10 campeones y 3 oleadas en pantalla (`/perf-profile`).

---

## 9. Mapa de archivos

| Archivo | Para qué |
|---|---|
| `game/src/models.js` | Qué modelo y qué clips usa cada unidad (lo único que se edita al integrar) |
| `game/src/render3d.js` | Render three.js: carga, animación, terreno, estructuras, niebla y efectos |
| `assets/data/model_specs.json` | Presupuestos y clips obligatorios por asset (lo lee el validador) |
| `game/tools/validate_models.mjs` | Validador (`--current`, `--dir`, `<glb> --as <id>`) |
| `tools/blender/setup_scene.py` | Crea `art/blender/<id>/<id>.blend` configurado |
| `tools/blender/export_glb.py` | Exporta a `game/assets/models/final/<id>.glb` y valida |
| `tools/blender/render_preview.py` | Renders de evidencia |
| `tools/blender/integrate_model.sh` | Valida, optimiza (meshopt + WebP) y copia a `game/assets/models/` |
| `tools/blender/selftest_pipeline.py` | Autoprueba del flujo y ejemplo de rig y animación por script |
| `game/tools/preview/anim_check.js` | Comprueba en navegador que los clips de un `.glb` mueven huesos |
| `game/tools/bundle.mjs` | Genera `dist/coronas-de-ceniza.html` (modelos incrustados) y `dist/web/` |
