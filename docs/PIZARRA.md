# Pizarra — Coronas de Ceniza (móvil Wild Rift)

Todo agente la lee al empezar y la actualiza al terminar. Cada flujo escribe SOLO en su sección (añadir, no reescribir el archivo).

## Estado general (02/11/2026)
- Repo público: https://github.com/Esparramador/Agente-creador-de-mundos-y-juegos-3D · Pages: https://esparramador.github.io/Agente-creador-de-mundos-y-juegos-3D/ (HTTP 200, flujo `deploy-pages.yml`).
- Historial purgado de `paula.glb` y `ceo_crafter.glb`; CI de capacidades en verde.
- Línea base de rendimiento (`game/tools/fps_probe.py`, Chrome real, Apple M3, minuto 5): **56,0 fps**, 153 k triángulos, 77 llamadas, 105 unidades → `production/qa/evidence/fps-escritorio.json`.
- Línea base de pruebas: `game.test.mjs` 77/77 · `run_capability_tests.py` 263 · e2e escritorio: **35/35** (anotada por B el 02/11, línea base sobre el dist anterior y repetida sobre el nuevo).
- Contratos entre flujos: C expone `game.epicFirst`, `game.heraldUntil`, `ctype` en monstruos; B expone `settings.mobile`, `S.vfx`; D expone `onUnitSpawn/onUnitDeath/onCast`, `getObj`, lee `settings.mobile`; G lee los ganchos de D y `S.vfx`.

## A · Equipo único (hecho)
- `eq_estudio_juegos` = 64 fichas (49 CCGS + 15 Blender), 10 fases; `eq_juegos_blender` eliminado; `auditar_equipos.py` 0 defectos en 36 equipos.

## B · Móvil (02/11/2026 → 03/11/2026)
**Verificado (con comando y cifras)**
- `node --test game/tests/game.test.mjs game/tests/touch.test.mjs` → **93/93** (87 de C + 6 nuevos de `touch.test.mjs`: vector del joystick, puntería recortada al alcance, zona de cancelación < 40 %, y `layoutButtons` sin solapes, dentro del lienzo, en la mitad derecha y con Q/W/E/R ≥ 54 px a 844×390 ×1, 1180×820 ×1,15 y 844×390 ×1,15).
- `python3 game/tests/e2e_browser.py` (escritorio, 1600×900) → **35/35**, misma cifra que la línea base tomada antes de tocar nada (35/35 sobre una copia del dist anterior). Era la cifra «pendiente de anotar» del estado general: **35**.
- `python3 game/tests/e2e_mobile.py` (Chromium emulando iPhone 13 apaisado 844×390, `is_mobile`, `has_touch`, dpr 3 → tope 2, URL `dist/coronas-de-ceniza.html?touch=1`) → **35/35**, sin errores de JS: menú en una columna sin scroll horizontal; `#touchUI` con 15 botones y Q/W/E/R ≥ 54 px CSS; lienzo HUD a 844×2 px con `R.W = 844`; minimapa arriba-izquierda; cámara bloqueada por defecto; tienda solo visible en fuente/muerto; joystick por CDP `Input.dispatchTouchEvent` (vector +x, `cmdMove` y avance > 200 u; soltar = `cmdStop`); toque en Q = lanzamiento inteligente (CD > 0); arrastre desde Q = anillo de alcance + puntería ≤ alcance, soltar = lanzar, volver al centro = cancelar; pulsación larga = +1 rango; ⚔ fija `p.target` enemigo y ⚒ un súbdito; arrastre en la mitad derecha mueve la cámara y al soltar vuelve al bloqueo; pellizco = zoom dentro de los límites; toque en el minimapa mueve la cámara y el candado la devuelve; tienda (5 columnas) y marcador caben en 844 px sin scroll horizontal; pausa con las opciones nuevas.
- Capturas (revisadas a ojo): `production/qa/evidence/2026-11-02-movil-{menu,partida,habilidad,tienda,marcador}.png`.
- `grep -n "c\.width\|c\.height" game/src/render.js` → **0** (49 apariciones sustituidas por `this.W/this.H` en px CSS; `setDpr(dpr)` + `ctx.setTransform(dpr,0,0,dpr,0,0)` en `draw()`; niebla también en px CSS).
- Contrato con C aplicado en `render.js`: `g.epicFirst?.[key] ?? {dragon:300,…}` y `g.heraldUntil ?? 1185`.
- Chromium NO arranca dentro del sandbox de Claude (`bootstrap_check_in … Permission denied` al registrar el puerto Mach): los dos e2e se ejecutan fuera del sandbox, como ya anotó G. El `$TMPDIR` cambia entre dentro y fuera: usar rutas explícitas para logs.

**Diseño implementado** (detalle en `design/gdd/ui-hud-controls.md` § Controles táctiles)
- Detección: `S.touch` `'auto'|'on'|'off'` (Opciones, próxima partida) → `esMovil()` = `'on'` o `'auto'` + `(pointer: coarse)`; `?touch=1` fuerza. `S.mobile` se fija en `startGame` ANTES de `World3D` y `Renderer` (D lee `settings.mobile`); `body.mobile`; `screen.orientation.lock('landscape')` protegido; `#rotate` «Gira el móvil» en vertical. Escritorio intacto: `touch.js` no se inicializa si no es móvil.
- `touchmath.js` (puro): `joystickVector`, `aimFromDrag(p,dx,dy,range,k=8)`, `isCancelZone`, `layoutButtons(w,h,scale)` → ataque 80 px con 🗼 arriba y ⚒ abajo, Q/W/E/R 56 px en arco (180°–285°, r 135), D/F 44 px en arco exterior (r 195), B y 👁 en fila inferior, y fila superior derecha 🛒 🔒 ☰ ⏸ (40 px).
- `touch.js`: botones DOM en `#touchUI` con nombre, tecla, CD, rangos y «+»; multi-touch por `pointerId` con captura; joystick flotante (mitad izquierda, 600 u cada 100 ms); lanzamiento inteligente (campeón enemigo en alcance → enemigo → dirección del último movimiento; `ally` al aliado con menos vida); arrastre = puntería con `R.rangeHint` y marcador en el lienzo vía `R.extraDraw`; **la pulsación larga se decide por `e.timeStamp` en `pointerup`, no por temporizador** — causa raíz de un fallo intermitente: con SwiftShader un fotograma > 500 ms hacía que el temporizador disparase antes de procesar el `pointermove` y convertía un arrastre en «subir rango»; cámara semibloqueada (arrastre temporal, pellizco con `zoomLimits()`), minimapa toque/largo = cámara/señal, marcador se cierra tocando fuera.
- `main.js`: `resize()` con `dpr = min(devicePixelRatio, 2)` y `R.setDpr`; `cast(key, aim)`, `doCast(key, aim)`, `summoner(i, aim)` aceptan puntería; bandera `touchActive` neutraliza `mousedown/mousemove` tras un toque; sin desplazamiento por borde en móvil; `S.vfx` `'alto'|'bajo'|'off'` en Opciones (G lo lee); `__cdc.touch` expuesto.
- `render.js`: `drawBarMobile` (320×60 arriba-centro: retrato, nivel, vida/recurso/XP, oro, guardianes, 6 objetos; buffs/CC debajo), minimapa 150 px arriba-izquierda, KDA/objetivos abajo-izquierda (zona del joystick), `uiScale × 1,15` en móvil.
- `index.html`: viewport `viewport-fit=cover, user-scalable=no`; `touch-action:none; -webkit-user-select:none` en los canvas; `@media (max-width:900px), (pointer:coarse)`: `.layout` 1 columna, tienda `auto-fill minmax(140px,1fr)`, marcador/pausa/tienda/ayuda `min-width:0 !important; width:96vw`, botones ≥ 44 px, `env(safe-area-inset-*)`; `#touchUI` (oculto en escritorio) y `#rotate`.

**Implementado sin probar en vivo**
- Modo 2D de respaldo con `dpr > 1` (el e2e de escritorio lo prueba a dpr 1 y el móvil solo en 3D). Pellizco con el dedo del joystick activo a la vez (probado con dos dedos en la mitad derecha). Señal por toque largo en el minimapa (el e2e prueba el toque corto). Pantalla táctil real de iPhone/Android (todo es emulación Playwright + SwiftShader).
- `screen.orientation.lock` solo funciona en pantalla completa en la mayoría de navegadores móviles; sin ella, el aviso «Gira el móvil» cubre el caso vertical.

**Bloqueado / no hecho**
- No integré el fragmento de G (`fichas.js`/`vfx.js` en `main.js`): lo integra F/B después, por instrucción del coordinador.
- `game/tests/screenshots/*.png` han cambiado porque `e2e_browser.py` las regenera en cada ejecución (no son mías; no hay que revisarlas).

**Ficheros míos**: `game/src/main.js`, `game/src/render.js`, `game/index.html`, `game/src/touch.js` (nuevo), `game/src/touchmath.js` (nuevo), `game/tests/touch.test.mjs` (nuevo), `game/tests/e2e_mobile.py` (nuevo), `design/gdd/ui-hud-controls.md`, `production/qa/evidence/2026-11-02-movil-*.png`, esta sección. `dist/` reconstruido con `node game/tools/bundle.mjs` (10,7 MB, juego.js 776 KB). Sin commit.

## C · Mapa (02/11/2026)
**Verificado (con comando y cifras)**
- `node --test game/tests/game.test.mjs` → **87/87** (77 anteriores + 10 nuevos; ninguno de los 77 asumía inhibidores, no hubo que adaptar ninguno). Partida larga de la Grieta sola: 39,1 min simulados en 100 s (antes 54 s; el coste extra son los 320 círculos de muro en `moveStep`, con descarte rápido por ejes; la suite entera tarda 3,6 min bajo carga).
- Reglas Wild Rift en la Grieta: `inhibs = [[], []]`, 3 torres por carril; súper-súbditos cuando cae la torre `tier 3` de ese carril (`spawnWave`) + anuncio «¡Torre base destruida! Súper-súbditos en camino» (`onStructureDeath`); el Puente conserva su inhibidor y su rama `inhib`. Tests: sin inhibidores + TN atacables; súper-súbdito solo en el carril abierto.
- Tiempos en datos: `maps.js` `rules = { epicFirst:{dragon:360,herald:360,lord:660,avatar:600}, dragonRespawn:270, heraldUntil:660, lordRespawn:360, firstWave:65 }`; Puente `firstWave:30`; Ruinas `firstWave:65, epicFirst:{avatar:600}, avatarRespawn:240` (comportamiento idéntico al anterior, con test). Dragón a 360 s en (9700, 9700) y +270 tras morir; Heraldo a 360 s en (4300, 4300), retirado a 660 s cuando sale el Señor; foso del Dragón separado del del Señor.
- Muros: 22 polilíneas (11 por lado, `wr` 110) → 320 círculos `{perm:true, wall:true, col:'#3a3632'}` en `game.obstacles`. Test de datos: ningún círculo a < 300 u de carriles, campamentos, estructuras, fuentes ni puntos de terreno del Dragón (movidos a `[[6200,6200],[7800,7800],[5300,7900],[6100,8700]]`); círculos de polilíneas distintas a ≥ 500 u (huecos de 560–1300 u); simetría por reflejo exacta.
- `game/src/nav.js`: rejilla 200 u (70×70), margen 45, A\* octil sin cortar esquinas, string pulling con `segDist`; reconstrucción por `obstaclesVersion` (`addObstacle` y su retirada, Forja). Tests: camino de la base a los 12 campamentos, los 2 fosos y la base rival; el muro entre T2 superior y T1 central bloquea la recta y la ruta (3 puntos) lo rodea sin tocar nada; `cmdMove` llega en < 25 s y la persecución alcanza al rival al otro lado; bot jungla limpia sus 6 campamentos en < 240 s (`c.clears`). Las rutas tardan 0–1 ms.
- Blender 5.2.2 (fuera del sandbox, Metal): `build_maps.py -- grieta_ceniza` → 5 objetos, 91 010 triángulos; `gltf-transform optimize --compress meshopt --texture-compress webp` → `map_grieta_ceniza.glb` 6,26 MB → **856 KB**. Renders regenerados (`grieta_ceniza_top/persp/plano.png`, 2:15 + 0:50 de Cycles) y revisados a ojo: muros fuera de carriles y campamentos, huecos visibles, fosos en el río con agua `(36,70,78)`, grietas de lava en el del Dragón y niebla morada con huesos en el del Señor.
- `grep -n "nhibidor"`: `assets/data/maps.json` y `tools/build_design.py` con `inhibitors: 0` y objetivos a 6/6/11 min en la Grieta; `maps.md`, `match-flow.md`, `design/levels/grieta_ceniza.md` y `README.md` al día.

**Primera oleada**: se queda en **1:05** (`firstWave: 65`). No verificado: `wiki.leagueoflegends.com/en-us/WR:Minion` → 404; notas de parche oficiales 6.2 (16/07/2025) y 7.3 (21/09/2026) no fijan el instante; única cifra, guía OneEsports 17/02/2021 (0:12 y cada 25 s), secundaria y anterior a varios parches. Detalle y enlaces en `match-flow.md` § Reloj de la Grieta.

**Implementado sin probar en vivo**
- El `.glb` nuevo en el navegador (los muros como relieve bajo los círculos; D decide qué hacer con `o.wall` en `render3d.js`: hoy los obstáculos iniciales no se dibujan con `map_*.glb` cargado, así que no hay dodecaedros encima de las crestas). En el 2D (`render.js`, B) los muros se pintan como círculos con `o.col` oscuro.
- Fosos a −0,2 m: las unidades siguen a y = 0 en three.js (flotan 20 cm sobre el lecho del foso; invisible bajo el Dragón de r = 1,1 m).

**Bloqueado / fuera de alcance**
- Muros sin bloqueo de visión (documentado en `maps.md`). `annotate_maps.py` no es mío: el plano no dibuja las polilíneas (se ven en el render de fondo) y la leyenda sigue listando «Inhibidor».
- `game/src/data.js` (`MAPS`) lo regenera `build_design.py` y no es mío: su copia de `maps.json` queda vieja hasta que F lo ejecute.

**Contratos expuestos**: `game.epicFirst` `{dragon,herald,lord,avatar}` y `game.heraldUntil` (B ya los lee en `render.js:248-249`); `game.epicNext` (siguiente aparición); `u.ctype` en cada monstruo de campamento (D); `o.wall === true` en los círculos de muro de `game.obstacles` (D/B); `u.route` / `u.chase` (lista `[x,y]`) en campeones y mascotas que rodean; `game.obstaclesVersion`; `map.walls`, `map.wr`, `map.pits`, `map.rules` en `map_layouts.json`; `wallCircles(poly, wr)` exportado de `maps.js`.

**Ficheros míos**: `game/src/maps.js`, `game/src/world.js`, `game/src/nav.js` (nuevo), `game/tests/game.test.mjs`, `game/tools/export_maps.mjs`, `assets/data/map_layouts.json`, `assets/data/maps.json`, `tools/build_design.py` (solo `MAPS`), `tools/blender/build_maps.py`, `art/blender/maps/grieta_ceniza.blend`, `game/assets/models/{,src/}map_grieta_ceniza.glb`, `design/gdd/maps.md`, `design/gdd/match-flow.md`, `design/levels/*`. `ai.js` sin cambios (hereda la ruta vía `cmdMove`). Sin commit.

## D · Modelos (03/11/2026)

**Desenlace:** las 32 unidades del juego (15 campeones + aspecto `champ_rakhar_lagarto` + `champ_aurik_dragon`, 5 súbditos, 6 monstruos de campamento distintos y 4 épicos) tienen ya modelo CC0 con esqueleto propio, armas y props en la mano y clips del contrato (`Idle, Run, Attack, Cast, Death` + `Hit`/`Cast_*`); validador 32/32, Khronos 0 errores, tiras revisadas; los modelos del autor (`guerrero*`, `mini_dragon_blue`, `lord_tuetano`, `lagarto` teñido) y los KayKit teñidos están retirados de `game/assets/models/` (quedan en `src/` como fuente). Sin commit.

**Verificado (comando y cifra)**
- `node --input-type=module -e "<analyze/check de validate_models.mjs>" -- game/assets/models/final` → **32/32 cumplen** (ojo: el bloque `main` de `validate_models.mjs` no se ejecuta con espacios en la ruta del repo —`import.meta.url` lleva `%20`— y sale 0 sin validar; `integrate_model.sh` lo llama así. Los scripts de Blender usan sus funciones exportadas. Corregirlo es de F/B, no mío).
- Khronos (`comprobar_glb.mjs` de la skill): 0 errores en los 32; three.js con piel en CPU: altura = objetivo de `model_specs.json` y suelo con piel en 0 (±1 cm) en todos.
- Puertas anti-deformación por modelo (abortan): 0 vértices sin peso · ≤4 influencias · ≤80 huesos · diagonal de la caja con piel de cada clip dentro de ±15 % del primer fotograma de Idle (Death ±60 %; `gates` propias en sapo 45 %, avispa 35 %, lagarto 25 %) · estiramiento de aristas de la malla evaluada p99 ≤4× y máx ≤12× (lagarto Tripo: 8×/45×, pesos casi binarios ya en el original) · suela a ±1 cm en Idle y nunca bajo el suelo en el resto (pies clavados fotograma a fotograma sobre el hueso raíz, ganancia medida) · Khronos 0 · validador ✓. Informe por modelo: `production/qa/evidence/modelos/salida/<id>.json`.
- `node game/tools/bundle.mjs` → `dist/coronas-de-ceniza.html` 14,5 MB (44 modelos). `node --test game/tests/game.test.mjs` → fail 0.
- `python3 game/tests/e2e_browser.py` (fuera del sandbox: Chromium muere con SIGTRAP dentro) → 33/35. Fallan: (1) `3D: 23 modelos glTF … champ == 'ka_Knight'`: la prueba tiene escritos los provisionales (ahora 42 plantillas cargadas y `champ_kaelith`); hay que actualizar esa línea de `e2e_browser.py` (no es mía). (2) `B inicia la vuelta a base` falló una vez y pasó en la segunda ejecución (34/35): flaky de tiempos con el bundle más grande (14,5 MB), no del modelo.
- Tiras `production/qa/evidence/modelos/<id>.png` (reposo frente · lado · Idle · Run · Attack · Cast · Death) miradas una a una: armas en la mano (espada+escudo, hacha, bastón con brasa, tridente, arco, dagas, martillo, lanza), pies en el suelo, nada estirado; la avispa miraba a +X y se giró (`yaw: -90`). Captura del juego con los nuevos: `game/tests/screenshots/04_grieta_combate.png` (Kaelith con espada y escudo, súbditos con sombrero de mago).

**Packs descargados** (con `assets-libres/descargar.py`, `.origen.json` en cada carpeta):

| Carpeta | Fuente | Licencia | Tamaño | sha256 |
|---|---|---|---|---|
| `Agente/assets-libres/kaykit/character-animations` | (https://kaylousberg.itch.io/kaykit-character-animations) | CC0-1.0 | 14510 KB | `65882f31f905ad2e953819648a59287cdeab8f623908d5ef701971d3758be20f` |
| `Agente/assets-libres/quaternius/lowpoly-animated-monsters` | (https://quaternius.itch.io/lowpoly-animated-monsters) | CC0-1.0 | 1373 KB | `c0b73e7d641a25348e46195e1413d050d08cf14302d999e0d40a634c43c47a9b` |
| `Agente/assets-libres/quaternius/animated-lowpoly-dinosaurs` | (https://quaternius.itch.io/animated-lowpoly-dinosaurs) | CC0-1.0 | 10595 KB | `d9ca7d3568bd98b323b0be9a82b546af66d77c2a18e355c1bee5c50061b8931c` |
| `Agente/assets-libres/quaternius/lowpoly-animated-animals` | (https://quaternius.itch.io/lowpoly-animated-animals) | CC0-1.0 | 6800 KB | `b4bc5f209368cafc21962934e7d676cf1cfb1f746a363086cd9f45c4385db70e` |
| `Agente/assets-libres/quaternius/animated-easy-enemies` | (https://quaternius.itch.io/animated-easy-enemies) | CC0-1.0 | 3021 KB | `a97f38b981fec2f42b263fe92828a7bf73f9da1228d5aac906fe354cd2b21004` |

**Bloqueado por algo externo:** *Quaternius Ultimate Monsters* no existe en itch.io (`quaternius.itch.io/ultimate-monsters` → 404); su descarga oficial es una carpeta de Google Drive y el 02/11 devolvía «Quota exceeded» en los 260 archivos. Se sustituyó por cuatro packs CC0 del mismo autor desde su itch.io oficial. Consecuencia para las decisiones de Joan: el **felino cuadrúpedo de Rakhar es hoy el Velociraptor** (cuadrúpedo ágil con Idle/Run/Attack/Death/Jump) y el dragón es el *Dragon* de LowPoly Animated Monsters. Cuando el Drive vuelva a servir, basta cambiar `base` en `model_builds.json` (Cat/Dragon_Evolved) y relanzar `monsters_quaternius.py`.

**Tabla por asset** (puertas = desviación máx. de la diagonal · aristas p99 · Khronos errores/avisos; tira revisada ✓):

| Asset | Base | Clips | Puertas | Altura · tamaño final | Correcciones registradas | Tira |
|---|---|---|---|---|---|---|
| `champ_aurik` | ka_Knight | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 12% · ×1.41 · 0/6 | 2.3 m · 558 KB | — | ✓ |
| `champ_aurik_dragon` | Dragon.fbx | Idle, Run, Attack, Cast, Death, Hit | 14% · ×1.68 · 0/1 | 3.2 m · 269 KB | influencias 7→4 | ✓ |
| `champ_brannoc` | ka_Knight | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 22% · ×1.44 · 0/6 | 1.9 m · 564 KB | — | ✓ |
| `champ_elowen` | ka_Mage | Idle, Run, Attack, Cast, Death, Hit, Cast_W, Cast_R | 8% · ×1.33 · 0/6 | 2.1 m · 609 KB | — | ✓ |
| `champ_gearix` | ka_Mage | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_E, Cast_R | 11% · ×1.34 · 0/6 | 1.326 m · 605 KB | — | ✓ |
| `champ_kaelith` | ka_Knight | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_E, Cast_R | 12% · ×1.44 · 0/6 | 2.2 m · 595 KB | — | ✓ |
| `champ_lyra` | ka_Rogue | Idle, Run, Attack, Cast, Death, Hit, Cast_E, Cast_R | 11% · ×1.36 · 0/6 | 2.2 m · 556 KB | — | ✓ |
| `champ_morgra` | ka_Barbarian | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 15% · ×1.42 · 0/6 | 2.4 m · 556 KB | — | ✓ |
| `champ_nyxe` | ka_Mage | Idle, Run, Attack, Cast, Death, Hit, Cast_E, Cast_R | 8% · ×1.33 · 0/6 | 1.36 m · 496 KB | — | ✓ |
| `champ_ossuar` | ks_Skeleton_Warrior | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 20% · ×1.35 · 0/9 | 2.7 m · 711 KB | — | ✓ |
| `champ_rakhar` | Velociraptor.fbx | Idle, Run, Attack, Cast, Death, Cast_E | 12% · ×1.76 · 0/1 | 2.0 m · 274 KB | influencias 7→4 | ✓ |
| `champ_rakhar_lagarto` | lagarto.glb | Idle, Run, Attack, Cast, Death, Hit, Cast_E | 12% · ×2.14 · 0/2 | 2.0 m · 1357 KB | decimado 29960→16478 tris | ✓ |
| `champ_sable` | ks_Skeleton_Rogue | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_W, Cast_E | 10% · ×1.24 · 0/8 | 2.2 m · 703 KB | — | ✓ |
| `champ_tharok` | ka_Barbarian | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 14% · ×1.42 · 0/6 | 2.4 m · 559 KB | — | ✓ |
| `champ_vaelor` | ka_Mage | Idle, Run, Attack, Cast, Death, Hit, Cast_Q, Cast_R | 8% · ×1.33 · 0/6 | 2.2 m · 542 KB | — | ✓ |
| `champ_yssra` | ka_Rogue | Idle, Run, Attack, Cast, Death, Hit, Cast_E, Cast_R | 11% · ×1.36 · 0/6 | 2.2 m · 533 KB | — | ✓ |
| `champ_zerath` | ks_Skeleton_Mage | Idle, Run, Attack, Cast, Death, Hit, Cast_W, Cast_R | 9% · ×1.15 · 0/8 | 2.3 m · 638 KB | — | ✓ |
| `epic_avatar` | Bat.fbx | Idle, Run, Attack, Attack2, Death, Hit | 15% · ×2.00 · 0/1 | 2.4 m · 242 KB | influencias 7→4 | ✓ |
| `epic_dragon` | Dragon.fbx | Idle, Run, Attack, Attack2, Death, Hit | 14% · ×1.68 · 0/1 | 3.6 m · 268 KB | influencias 7→4 | ✓ |
| `epic_heraldo` | Trex.fbx | Idle, Run, Attack, Death, Roar | 14% · ×1.69 · 0/1 | 2.4 m · 326 KB | influencias 7→4 | ✓ |
| `epic_senor` | Spider.fbx | Idle, Run, Attack, Death, Spawn | 17% · ×1.43 · 0/1 | 3.2 m · 467 KB | influencias 6→4 | ✓ |
| `minion_caster` | ks_Skeleton_Mage | Idle, Run, Attack, Death, Hit | 11% · ×1.11 · 0/8 | 1.2 m · 425 KB | — | ✓ |
| `minion_melee` | ks_Skeleton_Minion | Idle, Run, Attack, Death, Hit | 11% · ×1.10 · 0/9 | 1.2 m · 484 KB | — | ✓ |
| `minion_ram` | ks_Skeleton_Warrior | Idle, Run, Attack, Death, Hit | 35% · ×1.50 · 0/9 | 2.6 m · 570 KB | decimado 5104→4078 tris | ✓ |
| `minion_siege` | ks_Skeleton_Warrior | Idle, Run, Attack, Death, Hit | 17% · ×1.21 · 0/9 | 1.7 m · 554 KB | — | ✓ |
| `minion_super` | ks_Skeleton_Warrior | Idle, Run, Attack, Death, Hit | 31% · ×1.43 · 0/9 | 2.2 m · 526 KB | decimado 5104→4333 tris | ✓ |
| `monster_ave` | Wasp.fbx | Idle, Run, Attack, Death | 27% · ×1.15 · 0/1 | 1.0 m · 434 KB | 1 vértice sin peso reparado; influencias 7→4 | ✓ |
| `monster_bestia` | Triceratops.fbx | Idle, Run, Attack, Death, Hit | 8% · ×2.46 · 0/1 | 1.8 m · 287 KB | influencias 8→4 | ✓ |
| `monster_golem` | Stegosaurus.fbx | Idle, Run, Attack, Death, Hit | 13% · ×2.84 · 0/1 | 2.0 m · 405 KB | influencias 14→4 | ✓ |
| `monster_lobo` | Rat.fbx | Idle, Run, Attack, Death, Hit | 3% · ×2.22 · 0/1 | 1.2 m · 520 KB | influencias 10→4 | ✓ |
| `monster_roca` | Slime.fbx | Idle, Run, Attack, Death | 22% · ×1.40 · 0/1 | 1.6 m · 176 KB | influencias 6→4 | ✓ |
| `monster_sapo` | Frog.fbx | Idle, Run, Attack, Death | 56% · ×1.97 · 0/1 | 1.4 m · 561 KB | influencias 6→4 | ✓ |

**Contratos cumplidos**
- C: `UNIT_MODELS` usa `u.ctype` (fallback `u.camp?.type`) para `monster_golem|bestia|lobo|ave|roca|sapo`; `u.big` = grande (los pequeños al 70 %). Los círculos con `o.wall === true` no son míos de dibujar (el relieve va en `map_grieta_ceniza.glb`); `render3d.js` sigue dibujando las rocas de `game.obstacles` como hasta ahora.
- B: `render3d.js` lee `settings.mobile` → `antialias: !mobile`, `setPixelRatio(min(dpr, mobile ? 1.25 : 1.5))`, `shadowMap.enabled = !mobile`.
- G: `World3D.onUnitSpawn(obj,u)` al crear la malla, `onUnitDeath(obj,u)` al entrar en `death`, `onCast(obj,u,k)` al entrar en `cast` (`k = u.lastCastKey ?? u.castKey ?? null`: la simulación hoy solo escribe `u.lastCast`; si C/G quieren la tecla, que `world.js` escriba `u.lastCastKey`) y `getObj(u)`. `vfx.js` ya los engancha con `?.`.
- Aspectos: `u.skin === 'lagarto'` → `champ_rakhar_lagarto` (`SKINS` en `models.js`; `'felino'` = modelo por defecto); Forma Dragón de Aurik → `champ_aurik_dragon` (`AURIK_DRAGON`). Voladores (`fly`): hada, dragón, avatar, ave planean a esa altura.
- Nexos: los bustos `guerrero*` son ahora estandartes del equipo (`banner()` en `render3d.js`); la torre ya no lleva busto.

**Implementado sin probar en partida real:** el cambio de aspecto en caliente (`swapModel` al cambiar `u.skin`) y la Forma Dragón solo se han visto en las tiras y en el e2e (que no lanza la R de Aurik).

**Ficheros míos:** `game/src/models.js`, `game/src/render3d.js`, `game/assets/models/{champ_*,minion_*,monster_*,epic_*}.glb` (+ `final/`, `LICENSES.md`), `assets/data/model_specs.json` (+ `champ_rakhar_lagarto`), `assets/data/model_builds.json` (nuevo), `tools/blender/{champs_kaykit,monsters_quaternius,retarget_lagarto}.py` (nuevos), `production/handoff/BLENDER-3D-HANDOFF.md` (§0 bis), `production/qa/evidence/modelos/*` (tiras, `inventario-packs.json`, `salida/`), `Agente/assets-libres/{kaykit/character-animations,quaternius/{lowpoly-animated-monsters,animated-lowpoly-dinosaurs,lowpoly-animated-animals,animated-easy-enemies}}`.

## G · Fichas y VFX (02/11/2026)
**Verificado (con comando y cifras)**
- `node --test game/tests/fichas.test.mjs` → 5/5: 15 fichas con campos obligatorios; tipo de ataque coherente con `base_stats.range` (8 cuerpo a cuerpo, 2 a distancia, 5 mágicos); Rakhar con aspectos `felino` (`champ_rakhar`) y `lagarto` (`champ_rakhar_lagarto`); `anims` = contrato de D (`Idle, Run, Attack, Cast, Death`, `Cast_Q..R` opcionales), comprobado contra el JSON del `.glb` cuando existe (hoy 0 definitivos, 16 pendientes de D; el lector de glb está probado con `lagarto.glb`); `PRESENTATION` de `data.js` idéntica al JSON; gsap 3.15.0 instalado.
- `python3 game/tests/e2e_fichas.py` (Chromium + swiftshader, fuera del sandbox porque Chromium necesita mach ports) → **40/40**, sin errores de JS: ficha de Kaelith/Lyra/Rakhar con retrato 3D cargado, pasiva + 4 habilidades con números, tipo de ataque, selector de aspecto que deja `skins.rakhar='lagarto'` y cambia el retrato al lagarto, «Ver ataques» dibuja mallas y partículas; cabe en 844×390; aparición con `Object3D` falso: escala 0,001 → 1,000 (`back.out`); muerte deja la escala en 1 y hunde el modelo; `vfx:'off'` no falla; en partida 3D real `initVfx` se engancha (ganchos + pool de 200 partículas) y reaparición + estela + derrumbe de torre dibujan en la escena.
- Capturas: `production/qa/evidence/2026-11-02-ficha-{kaelith,lyra,rakhar}.png`, `2026-11-02-ficha-movil-844x390.png`, `2026-11-02-vfx-reaparicion.png` (revisadas a ojo; bajé la columna de aparición a 0,32 de opacidad y escaloné apariciones simultáneas porque cinco columnas aditivas en la fuente salían blancas).
- Bundle de prueba (main + fichas + vfx + modelos incrustados): 897 KB, gsap dentro. `python3 tools/build_design.py --check` OK; `assets/data/champions.json` byte a byte igual que antes.

**Implementado sin probar en vivo**
- Efectos que dependen de que ocurra en partida: muerte de campeón con ganchos de D (probada por sondeo propio), rugido de épico y tinte de dragón por elemento (`Ceniza/Marea/Raíz/Forja`), glifo/proyectil/estela por `cast` de `G.events` (probados en el retrato, no en partida larga). Sacudida de cámara ×0,35 con `settings.mobile`.
- Retrato con modelos DEFINITIVOS `champ_<id>.glb`: hoy cae al provisional de `MODEL_MAP` (p. ej. `ka_Knight` para Kaelith) y lo dice en la ficha («modelo ka_Knight»).

**Bloqueado**
- `dist/web/juego.js` y `dist/coronas-de-ceniza.html` aún sin gsap: `main.js` (B) no importa `fichas.js`/`vfx.js`. Hasta que entre el fragmento de abajo, el e2e usa su propio bundle en `$TMPDIR/cdc-fichas/`.
- Modelos definitivos (D): `assets/models/final/champ_*.glb` vacío. El test de clips se activa solo cuando aparezcan.

**Ficheros míos**: `game/src/vfx.js`, `game/src/fichas.js`, `game/tests/fichas.test.mjs`, `game/tests/e2e_fichas.py`, `assets/data/champion_presentation.json` (generado), `tools/champions_src.py` (+`PRESENTATION`, `VFX_BY_ABILITY_TYPE`), `tools/build_design.py` (+`presentation_for`, `PRESENTATION` en `data.js`, sección del roster), `design/gdd/champion-roster.md` § «Ficha y presentación», `game/package.json`/`package-lock.json` (+gsap). Sin commit.

**Fragmento de integración para `main.js` (lo integra F/B; `fichas.js` se monta solo y crea `<div id="fichas">`)**
```js
import { montarFichas } from './fichas.js';
import { initVfx } from './vfx.js';
// tras definir `state` y `renderMenu` (la ficha añade un botón flotante «Ficha del campeón» y abre con doble clic en la tarjeta):
const fichas = montarFichas({ onElegir: (id, skin) => { state.champ = id; state.skin = skin; renderMenu(); } });
// en startGame, justo después de `G = new Game({...})`:
if (fichas.skins[state.champ]) G.player.skin = fichas.skins[state.champ];   // Rakhar: 'felino' | 'lagarto' (D elige champ_rakhar / champ_rakhar_lagarto)
// en startGame, dentro del `.then(() => { R.setWorld3D(r3d); ... })` de r3d.load:
window.__cdc.vfx = initVfx(r3d, G, { ...S, mobile: !!settings?.mobile });   // sin r3d o con S.vfx='off' no hace nada
```
Contrato con D (ya consumido con `?.`): `R3.onUnitSpawn(obj,u)`, `R3.onUnitDeath(obj,u)`, `R3.onCast(obj,u,k)`, `R3.getObj(u)`; si D no los llama, `vfx.js` detecta por sí mismo apariciones/muertes/reapariciones (`G.units`) y lanzamientos (`G.events` tipo `cast`). `obj.userData.model` es el modelo que se escala/hunde; `obj.userData.vfxAlpha` multiplica a `setOpacity`.

## F · Integración y verificación (03/11/2026, en curso)
**Integrado y verificado** (commit `de0e9a0`, en `main` y publicado):
- Fragmento de G en `main.js` (`montarFichas`, `initVfx`, aspecto por campeón) · `data.js` regenerado con `build_design.py` (`--check` OK) · `annotate_maps.py` dibuja muros y fosos, leyenda sin «Inhibidor» en la Grieta y fuente de macOS (antes caía a la fuente por defecto sin acentos).
- `node --test game/tests/game.test.mjs` → 87/87 (3,6 min) · `touch.test.mjs` + `fichas.test.mjs` → 11/11.
- Fuera del sandbox (Chromium necesita puertos Mach): `e2e_browser.py` 35/35 · `e2e_mobile.py` 35/35 · `e2e_fichas.py` 40/40, tras la integración.
- `fps_probe.py` (Chrome real, Apple M3, minuto 5): escritorio **56,0 fps** (153 k tris, 77 llamadas) · móvil 844×390 **56,4 fps** (161 k tris, 83 llamadas) → `production/qa/evidence/fps-{escritorio,movil}.json`.
- Bundle: `coronas-de-ceniza.html` 10,8 MB · `dist/web/juego.js` 898 KB (con gsap).

**Pendiente**: flujo D (modelos definitivos) → después: `validate_models.mjs` 100 %, reempaquetar, repetir los tres e2e y la sonda de fps, purga de modelos del autor del historial (autorizada), commit y push.
