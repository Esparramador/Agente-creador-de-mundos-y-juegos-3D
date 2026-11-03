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

## H · HUD Wild Rift (03/11/2026)

**Desenlace:** el HUD táctil está colocado como en las 9 capturas reales de Wild Rift (tabla 1 de `design/ux/wild-rift-disposicion.md`): minimapa al 15 % con ⚙ 🔇 ❔ al lado, oro + objetos debajo, retratos de aliados y barra del objetivo arriba, marcador/reloj/KDA/FPS arriba-derecha, columna ✕ ❗ ↓ ⊙, CS en círculo, ataque con 🗼/⚒, Q/W/E en arco y la definitiva encima, D/F, B azul, compra rápida con la build del campeón y anillo azul de carga en los enfriamientos. Escritorio intacto. Sin commit.

**Verificado (comando y cifras)**
- `node --test game/tests/touch.test.mjs` → **9/9** (3 de geometría + `hits` + 5 disposiciones: 844×390 ×1, 932×430 ×1, 1180×820 ×1, 1180×820 ×1,15 y 844×390 ×1,15). Cada disposición comprueba: los 24 botones dentro del lienzo; sin solapes (círculo contra círculo por distancia, rectángulos por caja); 15 posiciones a **±2 %** de la tabla (ataque 85/78, ⚒ 79/90, 🗼 89/62, Q 73/86, W 74/70, E 78/57, R 85/51, D 58/86, F 64/86, B 37/86, ✕ 91/13, ❗ 91/24, ↓ 91/35, ⊙ 91/46, oro 9/39); compra rápida en el hueco B–D a y 90 %; radios ataque > definitiva ≥ habilidades (4,5 / 3 / 2,8 % del ancho); R encima del ataque, 🗼 arriba-derecha y ⚒ abajo-izquierda; mínimos 44 px (acción) / 40 px (auxiliares) / 24 px (compra rápida: a 844 px salen de 30 px); nada pisa el minimapa (7–22 %, 2–34 %) ni el reposo del joystick (21 %, 70 %, r 6 %).
- `node --test game/tests/touch.test.mjs game/tests/game.test.mjs` → **96/96** (una ejecución anterior dio 95/96 con un fallo que no se repitió en dos ejecuciones más — `game.test.mjs` a solas 87/87; es la flakiness bajo carga que ya anotó C).
- `python3 game/tests/e2e_mobile.py` (fuera del sandbox, iPhone 13 apaisado 844×390, `?touch=1`) → **48/48**, sin errores de JS. Las 35 de ayer siguen (joystick, Q toque/arrastre/cancelar/largo, ataque y ⚒, cámara, pellizco, minimapa, candado, tienda y marcador sin scroll, pausa) más 13 nuevas: 24 botones; Q/W/E/R ≥ 44 px; ataque en (85, 78) y R en (85, 51) encima; Q/W/E y D/F a ±2 %; columna derecha en x 91 ordenada y B en (37, 86); minimapa 15 % en (7 %, 2 %); 4 retratos de aliados en 23–34 %, marcador en 72–78 %, KDA hasta 89 %; CS en (85 %, 32 %) y sin barra del objetivo sin objetivo; caja de oro con el oro y bajo el minimapa; **tocar la caja abre la tienda sin comprar nada por debajo**; compra rápida con 4 objetos y coste en la fuente; tocar el primero compra Botas (oro 500 → 200, objeto en el inventario y dibujado bajo el minimapa); fuera de la fuente no compra y muestra el aviso de la tienda; **anillo azul de carga** en Q en enfriamiento (`.cooling`, `--p` en %, número de segundos); **barra del objetivo** en (43–59 %, 2–8 %) con «vida / máx» al fijar con ⚔; ✕ suelta el objetivo y la barra desaparece.
- `python3 game/tests/e2e_browser.py` (escritorio) → **35/35** antes de tocar nada y **35/35** después.
- Capturas miradas a ojo y comparadas con `01-partida-inicio.png`: `production/qa/evidence/2026-11-03-movil-{partida,objetivo,habilidad,compra,menu}.png`. Coinciden en sitio: minimapa y columna ⚙/🔇/❔, oro «🪙 500» y «Botas» debajo, R Y G A arriba, «0 vs 0 / 00:00» y «0/0/0 / FPS», ✕ ❗ ↓ ⊙ en la derecha, CS teal, ataque rojo grande con 🗼 y ⚒, Corte/Égida/Paso en arco con «+», Sent… (R) encima, Parp…/Brasa (D/F), B azul, 4 cuadrados de compra con coste, aro de reposo del joystick. Diferencias visibles respecto a WR: nuestros botones son círculos planos con texto (sin arte de iconos) y las letras de los nombres se cortan en 48 px («Sent…», «Parp…»).
- `dist/` reconstruido con `node game/tools/bundle.mjs` (14,5 MB; `juego.js` 909 KB).

**Causa raíz encontrada por el camino:** tocar la caja de oro abría la tienda en `pointerup` y el `click` de compatibilidad que sigue al toque caía sobre la primera carta de la tienda recién abierta y la compraba (una Espada Larga sin querer). Los cuatro paneles (tienda, marcador, pausa, ayuda) se abren ahora 60 ms después del toque y el e2e comprueba que no se compra nada por debajo.

**Diseño / decisiones** (detalle en `design/gdd/ui-hud-controls.md` § Controles táctiles, con la tabla de posiciones)
- Posiciones en `WR_LAYOUT` (`touchmath.js`) como `[x %, y %, radio % del ancho, radio mínimo px]`; `layoutButtons(w, h, scale)` las convierte y recorta al lienzo; `joystickRest(w, h)` da el reposo (21 %, 70 %, r 6 %). `scale` (uiScale) solo agranda; las posiciones no se mueven.
- Desviaciones de la tabla, por los mínimos táctiles a 390 px de alto: columna del minimapa a y 15/26/37 (tabla 17/23/30: 40 px no caben a 6–7 % de paso), ☰ marcador en x 96 (el chat de WR está en 91 y pisaría al ✕), columna derecha a 12/24/36/48 (±2 de la tabla). Sin poción/objeto activo (no hay objetos activos en nuestros datos; la tabla además la pone encima del 🗼).
- ↓ de la columna y B azul hacen lo mismo (volver a base), como pide la tabla. 👁 guardián (sin equivalente en WR) a la izquierda del B. El 🎤 de WR es ❔ ayuda.
- `render.js`: `drawTopMobile` sustituye a `drawBarMobile` (borrado); en móvil no se dibuja el marcador central de escritorio ni el bloque KDA abajo-izquierda. Minimapa móvil = 15 % del ancho en (7 %, 2 %). `this.fps` suavizado en `draw(dt)`. Número «vida / máx» sobre la barra del objetivo fijado (3D en `hpBar2`, 2D en `hpBar`). `R.mobRects` expone lo dibujado para las pruebas.
- `touch.js` inyecta su CSS (`<style id="touchCss">`): anillo (`conic-gradient` + máscara radial), caja de oro, cuadrados de compra, B azul; `index.html` no se toca. Lee `BUILDS` de `ai.js` e `ITEMS` de `data.js` por `import`, sin editarlos. `T.quickBuyIds()` expuesto.

**Implementado sin probar en vivo**
- Pantalla real de iPhone/Android con muesca: las posiciones son porcentajes y el 7 % de margen izquierdo es el de WR, pero no se aplica `env(safe-area-inset-*)` a los botones (solo a los menús). 🔇 silencia poniendo `S.volume = 0` y lo devuelve al volver a tocar; no se guarda en `localStorage` (a propósito). ❔ abre `#help` con `classList.toggle('on')`: no probé cómo se cierra en móvil. Contador de reaparición bajo el retrato de un aliado caído (el e2e no mata a ningún aliado). Barra de puntos de las Ruinas en móvil (el e2e móvil solo juega la Grieta). ×1,15 de `uiScale` en 844×390 pasa el test de solapes pero no lo miré en captura.

**Bloqueado / no hecho**
- Nada bloqueado. No hace falta ningún gancho en `main.js`: todo entra por `initTouch` y `Renderer` como ayer. Las capturas `2026-11-02-movil-{tienda,marcador}.png` de ayer ya no las regenera el e2e (quedan como estaban); las de hoy son las cinco nuevas.

**Ficheros míos**: `game/src/touch.js`, `game/src/touchmath.js`, `game/src/render.js`, `game/tests/touch.test.mjs`, `game/tests/e2e_mobile.py`, `design/gdd/ui-hud-controls.md`, `production/qa/evidence/2026-11-03-movil-*.png`, esta sección. `dist/` reconstruido. Sin commit.

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

## F2 · Integración tanda Wild Rift (03/11/2026 tarde) — CERRADO
- Integrados H (HUD) y S (selección, hechizos, sets, runas, objetos). Arreglos de F2: comprobación del menú móvil (`#selCuerpo` 3 columnas) y `#play` ≥ 44 px en móvil.
- Regresión final: Node 138/138 · validador 32/32 · e2e escritorio 57/57 · móvil 48/48 · fichas 40/40 · estudio 263. Detalle: `production/qa/smoke-2026-11-03.md` (tanda 2).

## F · Integración y verificación (03/11/2026) — CERRADO
- Integrado todo en `main` (commits `1785190` B+C+G+A, `894e2e2` D) y publicado con el historial purgado de los modelos del autor (`paula`, `ceo_crafter`, `guerrero*`, `mini_dragon_blue`, `lord_tuetano`; `lagarto` se conserva como aspecto de Rakhar por decisión de Joan).
- Regresión final con modelos definitivos: `game.test.mjs` 87/87 · Node táctil+fichas 11/11 · validador 32/32 · e2e escritorio 35/35 · móvil 35/35 · fichas 40/40 · fps M3 57,4 escritorio / 59,8 móvil. Detalle y lo que NO está probado: `production/qa/smoke-2026-11-03.md`.
- Arreglos propios de F: integración de `fichas.js`/`vfx.js` en `main.js`; `validate_models.mjs` con rutas con espacios (y el CI valida `final/` de verdad); `annotate_maps.py` dibuja muros y fosos con fuentes de macOS; `data.js` regenerado.
- Pendiente para Joan: probar en un teléfono real (URL de Pages) y decidir la primera oleada si aparece fuente oficial de Wild Rift.

## S · Selección Wild Rift (03/11/2026)

**Desenlace:** la selección de campeón es ya la de las capturas 07–09 (sala con posiciones, cuenta atrás, filtros, rejilla de 5 columnas con retratos reales, panel de hechizos, sets con popularidad y % de victorias medidos, runas con ramas), y todo lo que se elige tiene efecto real en la simulación: 9 hechizos con los enfriamientos oficiales, 13 claves + 16 menores de runas, 31 objetos (botas 7.2 por niveles, 4 activos) y 45 sets que alimentan la compra rápida del HUD y la tienda de los bots. Sin commit.

**Verificado (comando y cifras)**
- `node --test game/tests/game.test.mjs game/tests/seleccion.test.mjs game/tests/touch.test.mjs game/tests/fichas.test.mjs` → **138/138** (87 anteriores intactos + 33 nuevos en `game.test.mjs`: los 9 hechizos hacen algo medible y entran en enfriamiento; Juicio 600 verdadero + cura, 2 cargas que recargan a 90 s, 15 s entre usos, evolución tras 3 usos a 1000 y sobre campeones; 4 ramas / 13 claves / 29 runas y validación de páginas; cada una de las 13 claves cambia una estadística o un daño frente a la misma arena con otra clave; menores con estadística (+10 celeridad, +200 maná, +8 arm/RM, +100 vida, tenacidad acorta un aturdimiento 2 → 0,8 s… ); botas por niveles con descuento, nivel 3 bloqueado antes del 10:00, un solo activo, maná sube `resMax`, robo de vida/omnivampirismo en `st`; los 4 activos (estasis invulnerable 2,5 s, relicario, azogue bajo CC, cohete 300 u + ráfaga); 45 sets válidos (6 ids existentes, ≤ 18 000 oro, unas botas, ≤ 1 activo, runas válidas, hechizos reales, cifras numéricas); partida con `lineup` en la que `G.player.itemSet/runes/setId` son los pasados, los rivales son los de la alineación, la jungla lleva Juicio y los 9 bots compran solo objetos de su set en 6 min. `seleccion.test.mjs` (7, puro sin DOM): posiciones, filtros por rol y búsqueda sin tildes, sala con 9 campeones distintos, re-elección del bot, intercambio ⇄, cuenta atrás (revela a 10 s, agotada a 0, campeón final), alineación para `Game`). Suite completa: 1,5 min.
- `python3 game/tests/e2e_browser.py` (Chromium fuera del sandbox, 1600×900) → **57/57** (35 anteriores adaptados + 22 de menú nuevos: 4 bots aliados con posición y 5 rivales ocultos; lista de aliados con 2 hechizos y ⇄; cuenta atrás real; filtro «Mago» deja 3 tarjetas, buscar «kae» deja 1; marco dorado + insignias; ⇄ cambia la posición; panel de hechizos con 9 y los 2 elegidos, tocar Zancada cambia `#sum0`; pestaña POPULAR con popularidad y % de victorias, aplicar un set lo marca con ✓ y fija `state.itemSet`; PERSONAL compone 6 tocando objetos (localStorage); insignia «1» de runas hasta aplicar; panel de runas con 4 ramas, elegir Roca/Garra del Sepulcro/Raíces Profundas y aplicar; en la partida: `G.player.itemSet` = set aplicado y `G.player.setId`, `G.player.runes.key`, +100 de vida máx. por Raíces Profundas, rivales revelados = rivales de la partida, jugador en su posición, jungla aliada con Juicio). Capturas revisadas a ojo frente a 07–09: `production/qa/evidence/2026-11-03-seleccion-{campeon,hechizos,sets,runas}.png` (y las de 844×390 en la sesión: sin scroll horizontal, 15 tarjetas, paneles a 62 vw).
- Simulación de sets (`node game/tools/simular_sets.mjs 45 15 10 7`): **45 partidas reales entre bots en la Grieta** (tope 10 min, 7 hilos, 172 s), cada bot eligiendo un set de su campeón (al azar en la primera ronda de 15 y después ponderado por victorias⁴); popularidad = partidas en las que se usó (media 10 por set, mín. 1, máx. 25), % de victorias = ganadas/usadas. **Es menos de las 20 por set pedidas**: la tirada de 120 partidas a 20 min proyectaba 95 min (117 s por partida) y la de 90 a 15 min, 55 min; se cortaron por orden del coordinador. Metadatos: `production/qa/evidence/2026-11-03-simulacion-sets.json`. Para afinar: `node game/tools/simular_sets.mjs 120 40 15` y `python3 tools/build_design.py` (conserva las cifras).
- `python3 tools/build_design.py` → 15 campeones, 31 objetos, 45 sets, `data.js` con `ITEM_SETS` y `RUNES`; `python3 tools/retratos.py` → 15 retratos (caras frontales de las tiras de D, fondo del color del campeón, 29 KB incrustados en `retratos.js`); `node game/tools/bundle.mjs` → 14,6 MB, `juego.js` 994 KB.

**Contratos para el HUD (B)**: `G.player.itemSet` (6 ids ordenados), `G.player.setId`, `G.nextSetItem(u)` (siguiente del set que falta; devuelve `botas` antes que unas de nivel 2), `G.canBuy(u, id)` → `{ ok, why, cost, prev }`, `G.player.runes` `{ key, minors[3], secondary }`, `G.cmdItemActive(u, aim)` + `u.activeCd` + `u.items.find(i => i.active)` (tecla **1** en escritorio; el botón táctil es de B), `SUMMONERS[id].icon/col/desc`, `u.smiteCharges`/`u.smiteRecharge`/`u.p.smiteUses` (≥ 3 = Juicio Gélido). Nombres de hechizos cambiados (propios): Parpadeo, Zancada, Sanar, Muralla, Extenuar, Brasa, Juicio, Purga, Portal — `render.js`/`touch.js` los leen de `SUMMONERS[id].name`, sin cambios de código.

**Diseño**: `design/gdd/runes-and-item-sets.md` (8 secciones), fila 11 en `systems-index.md`, `progression-economy.md` actualizado a 31 objetos. Decisiones: ramas Acero/Sombra/Roca/Arcano = Precisión/Dominación/Valor/Brujería; Juicio evoluciona al 4.º uso (tras 3); botas nivel 3 solo desde el 10:00; un objeto activo por campeón; Bola de Nieve se mantiene solo en el Puente (Riot la quitó en 7.1, pero el Puente la usa y sus tests la comprueban).

**Implementado sin probar en vivo**
- Pantalla táctil real (todo es Playwright + SwiftShader). `e2e_mobile.py` (de B) no lo he ejecutado tras el cambio del menú: mi comprobación a 844×390 (misma media query) no da scroll horizontal y muestra 15 tarjetas, pero la captura `menu` de B cambiará.
- Efectos de runas sobre bots en partidas largas (solo arena de 1v1 y partida de 6 min); Portal a guardián/aliado (test solo con torre antes del 6:00); extensión de Zancada por derribo; Capa del Ángel en partida real; Juicio Gélido usado por bots (`smiteIf` lo contempla).
- Páginas de runas y sets personales en `localStorage` entre sesiones reales del navegador (probado dentro de una sesión de Playwright).

**Bloqueado / no hecho**
- Popularidad con ≥ 20 usos por set: cortado por tiempo (ver arriba); el script está listo.
- Botón táctil del objeto activo y de la compra rápida en el HUD: de B (contrato expuesto).
- `e2e_fichas.py` (G) no se ha vuelto a pasar: `#fichaBtn` sigue existiendo con la clase `on` cuando hay campeón (ahora dentro de la barra inferior), que es lo que comprueba.

**Ficheros míos**: `game/index.html`, `game/src/main.js`, `game/src/seleccion.js` (nuevo), `game/src/runas.js` (nuevo), `game/src/retratos.js` (generado), `game/src/fichas.js` (comentario), `game/src/world.js`, `game/src/kits.js`, `game/src/ai.js`, `game/src/data.js` (generado), `assets/data/{items,item_sets,runes}.json`, `game/assets/retratos/*.webp`, `tools/build_design.py`, `tools/retratos.py` (nuevo), `game/tools/simular_sets.mjs` (nuevo), `game/tests/game.test.mjs`, `game/tests/seleccion.test.mjs` (nuevo), `game/tests/e2e_browser.py`, `design/gdd/runes-and-item-sets.md` (nuevo), `design/gdd/systems-index.md`, `design/gdd/progression-economy.md`, `production/qa/evidence/2026-11-03-seleccion-*.png`, `production/qa/evidence/2026-11-03-simulacion-sets.json`, `game/dist/` reconstruido. Sin commit.
