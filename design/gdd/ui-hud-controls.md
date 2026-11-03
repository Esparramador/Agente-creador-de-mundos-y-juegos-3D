# Controles, cámara, HUD y presentación

## Overview
Esquema de control estándar del género, HUD legible y directrices de audio y efectos visuales.

## Player Fantasy
Control preciso y directo: lo que piensas es lo que hace tu campeón.

## Detailed Rules
### Controles (reasignables)
| Acción | Tecla |
|---|---|
| Mover / atacar | Clic derecho |
| Movimiento con ataque | A + clic |
| Habilidades | Q, W, E, R (Ctrl+tecla sube el rango) |
| Hechizos de invocador | D, F |
| Objetos activos | 1-3, 5-7 |
| Guardián | 4 |
| Volver a base (8 s) | B |
| Tienda | P |
| Bloquear/desbloquear la cámara | Y; espacio para centrarla en tu campeón |
| Tabla de puntuación | Tab |
| Señales al equipo | G + clic, o la rueda con Alt |
| Lanzamiento rápido | Activable en Opciones |

### Controles táctiles (móvil, estilo Wild Rift)
Se activan cuando `S.touch = 'on'`, o en `'auto'` si la pantalla es táctil (`pointer: coarse`); `?touch=1` fuerza el modo
para las pruebas. El escritorio no cambia: `touch.js` solo se inicializa en móvil. Apaisado obligatorio: en vertical se
muestra «Gira el móvil» y se intenta `screen.orientation.lock('landscape')`.

**Disposición (03/11/2026): la de Wild Rift.** Posiciones en % del ancho (x) y del alto (y) medidas sobre capturas reales
(`design/ux/wild-rift-disposicion.md`, tabla 1), en `WR_LAYOUT` de `touchmath.js`; el radio es un % del ancho con mínimo táctil
(44 px los botones de acción, 40 px los auxiliares), así que a 844×390 los botones de WR «de 40 px» quedan algo más separados que
en la tabla (columna del minimapa a y 15/26/37 en vez de 17/23/30; el ☰ en x 96 en vez de 91 para no pisar al ✕). Verificado por
`touch.test.mjs` a 844×390, 932×430 y 1180×820 (±2 % de la tabla, sin solapes círculo-círculo, dentro del lienzo, nada sobre el
minimapa ni sobre el reposo del joystick).

| Zona | Elemento | Posición (x %, y %) · radio |
|---|---|---|
| Abajo-derecha | ⚔ ataque | 85, 78 · 4,5 % (≥ 38 px) |
| | ⚒ súbdito · 🗼 torre | 79, 90 · 89, 62 (≥ 22 px) |
| | Q · W · E (arco abajo-izquierda del ataque) | 73, 86 · 74, 70 · 78, 57 · 2,8 % |
| | R definitiva, encima del ataque | 85, 51 · 3 % |
| Abajo-centro | D · F hechizos | 58, 86 · 64, 86 · 2,5 % |
| | B volver a base (azul) · 👁 guardián | 37, 86 · 31, 86 · 2,5 % |
| | Compra rápida: 4 cuadrados | entre el B y el D, centrados ≈ 47 %, y 90 % (≥ 24 px; a 844 px salen de 30 px) |
| Columna derecha | ✕ objetivo · ❗ señal · ↓ base · ⊙ cámara | x 91; y 12 / 24 / 36 / 48 (tabla 13/24/35/46) |
| Arriba-derecha | ☰ marcador | 96, 4 |
| Arriba-izquierda | Minimapa (lienzo) | cuadrado del 15 % del ancho en (7, 2) |
| | ⚙ opciones · 🔇/🔊 sonido · ❔ ayuda | x 25; y 15 / 26 / 37 |
| | Caja de oro = tienda | 7–13, 35–43 (≥ 58×40 px) · objetos comprados a su derecha en 3×2 (lienzo) |
| Abajo-izquierda | Joystick flotante | reposo en (21, 70), r = 6 % del ancho (≥ 48 px); aparece donde se apoya el dedo |

| Gesto | Acción |
|---|---|
| Dedo en la mitad izquierda | Joystick flotante: aparece donde se apoya; destino = campeón + dirección × 600 u, reemitido cada 100 ms; al soltar, detenerse |
| Toque en Q/W/E/R | Lanzamiento inteligente: campeón enemigo más cercano en alcance → enemigo más cercano → dirección del último movimiento; `self` lanza directo; `ally` al aliado con menos vida (o uno mismo) |
| Arrastre desde Q/W/E/R/D/F | Puntería: `aim = p + dir × min(alcance, |arrastre| × 8)`, anillo de alcance (`R.rangeHint`); volver al centro (< 40 % del radio de 60 px) cancela; soltar lanza |
| Pulsación larga (≥ 500 ms) en Q/W/E/R | Subir rango (`cmdLevel`); se decide por marcas de tiempo del evento, no por temporizador |
| ⚔ Ataque | Objetivo con prioridad campeón > súbdito > monstruo > estructura, en `max(alcance + 300, 700)` |
| 🗼 / ⚒ | Estructura enemiga atacable más cercana (1600 u) / súbdito enemigo con menos vida dentro de alcance + 200 |
| D / F | Hechizos; Castigo busca el monstruo/súbdito más cercano al punto apuntado |
| B · ↓ · 👁 | Volver a base (los dos) · guardián a 350 u en la dirección del último movimiento |
| ✕ | Con objetivo: lo suelta (`p.target = null`); sin él: fija el campeón enemigo más cercano (1400 u) o cualquier enemigo (1000 u). Se pinta rojo mientras hay objetivo |
| ❗ | Señal en la posición del campeón |
| ⊙ | Candado de cámara (relleno cuando está bloqueada) |
| Compra rápida | Los 4 objetos siguientes de `BUILDS[clase]` (ai.js) a partir de los ya comprados, con su coste; toque = `g.buy` si hay oro y estás en fuente o muerto; si no, el aviso de la tienda («Solo puedes comprar en tu fuente…») en el lienzo. Apagados si no se pueden pagar |
| Caja de oro | Muestra el oro y abre la tienda (que ya avisa si no puedes comprar). Los paneles (tienda, marcador, pausa, ayuda) se abren 60 ms después del toque: el `click` que sigue al `pointerup` caía sobre el panel recién abierto y compraba la primera carta |
| ⚙ · 🔇 · ❔ | Pausa/opciones · silenciar (guarda el volumen y lo devuelve) · panel de ayuda |
| Arrastre con un dedo en la mitad derecha | Desplaza la cámara temporalmente; al soltar vuelve al bloqueo si estaba bloqueada |
| Pellizco | Zoom con los límites del escritorio (3D 0,6–1,6; 2D 0,8–1,15) |
| Minimapa | Toque = mover la cámara (se desbloquea; el candado la devuelve) · toque largo = señal |

Sin desplazamiento por borde. Los botones viven en `#touchUI` (DOM; sus estilos propios los inyecta `touch.js` en `<style id="touchCss">`)
y muestran nombre, tecla equivalente, enfriamiento con el número de segundos y **anillo azul de carga** (`conic-gradient` con `--p`,
se llena al recargarse), rangos y el «+» cuando se puede subir; el joystick (anillo de reposo tenue cuando no se toca) y la puntería
se dibujan en el lienzo 2D vía `R.extraDraw`.

**HUD móvil (lienzo, `drawTopMobile`).** Nada de lo que es botón DOM se dibuja aquí. Retratos de los 4 aliados con barra de vida en
23–34 %, 2–6 % (contador de reaparición bajo un caído); **barra del objetivo** en 43–59 %, 2–8 % solo con `p.target` (retrato/inicial,
«vida / máx», AD, PH, Arm, RM); marcador «azul vs rojo» + reloj en 72–78 %; KDA + FPS + torres/dragones propios en 80–88 % con los
temporizadores de objetivos debajo; CS en círculo teal en (85, 32); objetos comprados bajo el minimapa; buffs/CC y la barra de puntos
de las Ruinas bajo la barra del objetivo. Sobre el objetivo fijado, la barra lleva el número «vida / máx». La barra central antigua
(`drawBarMobile`) ya no existe: la vida y el recurso propios van sobre el campeón, con nombre y nivel. Escala de interfaz × 1,15
solo para textos; las posiciones son porcentajes. El lienzo HUD usa `devicePixelRatio` (tope 2) y dibuja en px CSS.
`R.mobRects` expone lo dibujado (marcador, KDA, CS, objetos, aliados, barra del objetivo) para las pruebas.

**Menús en móvil** (`max-width: 900px` o `pointer: coarse`): selección en una columna, tienda `auto-fill minmax(140px)`,
marcador/pausa/tienda al 96 vw sin scroll horizontal, controles de ≥ 44 px y márgenes `env(safe-area-inset-*)`.
Opciones nuevas: «Controles táctiles» (auto/siempre/nunca, próxima partida) y «Efectos visuales» (alto/bajo/off, `S.vfx`).

### Cámara
Isométrica a 56° y FOV 40, con desplazamiento al acercar el ratón al borde de la pantalla. El zoom va de 0,8 a 1,15.

### HUD
- **Abajo, en el centro:** retrato, barras de vida y recurso, Q/W/E/R con su CD, hechizos, inventario y oro.
- **Abajo a la derecha:** minimapa de 220 px con señales.
- **Arriba a la derecha:** KDA, CS, reloj y temporizadores de los objetivos.
- **Arriba a la izquierda:** marcador de equipos (en las Ruinas, la barra de puntos y el estado de los altares).
- **Barras sobre las unidades:** vida segmentada (cada 100 puntos) y nivel; borde verde para ti, azul para aliados y rojo para enemigos.

### Accesibilidad
Modo para daltonismo (azul/naranja), escala de interfaz del 75 al 125%, subtítulos para los anuncios y opción de reducir los destellos.

### Audio y efectos visuales
- **Audio de cada facción:**
  - Horda: tambores.
  - Bosque: maderas y arpa.
  - Torre Gris: coros.
  - Grieta: sintetizadores graves.
  - Sol: metales.
  - Abismo: ecos.
- **Telegrafía de habilidades:**
  - Cada habilidad tiene un sonido de lanzamiento distinto.
  - Las definitivas tienen una frase de voz audible para ambos equipos.
- **Reglas de efectos visuales:**
  - Los efectos se leen por forma antes que por color.
  - La intensidad se reduce en los efectos aliados que no son tuyos.

## Formulas
- Tamaño del minimapa = 220 px × escala de interfaz.
- Segmentos de la barra de vida = vida máx. / 100.

## Edge Cases
- Dos acciones en la misma tecla: se avisa y se pide reasignar una de ellas.
- Resolución por debajo de 1280×720: el HUD se escala al 75% como mínimo.

## Dependencies
Todos los sistemas de juego (muestra su estado).

## Tuning Knobs
Ángulo de cámara, rango de zoom, escala de interfaz y velocidad de desplazamiento de la cámara.

## Acceptance Criteria
- Todo el HUD funciona a 1280×720.
- Móvil: `node --test game/tests/touch.test.mjs` (geometría, sin solapes a 844×390 y 1180×820) y `python3 game/tests/e2e_mobile.py` (iPhone 13 apaisado) pasan; capturas en `production/qa/evidence/2026-11-02-movil-*.png`.
- Ningún texto mide menos de 14 px a escala 100%.
- Todas las teclas se pueden reasignar.
