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

| Gesto | Acción |
|---|---|
| Dedo en la mitad izquierda | Joystick flotante: aparece donde se apoya; destino = campeón + dirección × 600 u, reemitido cada 100 ms; al soltar, detenerse |
| Toque en Q/W/E/R (≥ 54 px, en arco) | Lanzamiento inteligente: campeón enemigo más cercano en alcance → enemigo más cercano → dirección del último movimiento; `self` lanza directo; `ally` al aliado con menos vida (o uno mismo) |
| Arrastre desde Q/W/E/R/D/F | Puntería: `aim = p + dir × min(alcance, |arrastre| × 8)`, anillo de alcance (`R.rangeHint`); volver al centro (< 40 % del radio de 60 px) cancela; soltar lanza |
| Pulsación larga (≥ 500 ms) en Q/W/E/R | Subir rango (`cmdLevel`); se decide por marcas de tiempo del evento, no por temporizador |
| ⚔ Ataque | Objetivo con prioridad campeón > súbdito > monstruo > estructura, en `max(alcance + 300, 700)` |
| 🗼 (arriba del ataque) | Estructura enemiga atacable más cercana (1600 u) |
| ⚒ (abajo del ataque) | Súbdito enemigo con menos vida dentro de alcance + 200 |
| D / F | Hechizos; Castigo busca el monstruo/súbdito más cercano al punto apuntado |
| B · 👁 | Volver a base · guardián a 350 u en la dirección del último movimiento |
| Fila superior derecha | 🛒 tienda (solo en fuente o muerto) · 🔒/🔓 candado de cámara · ☰ marcador (toque fuera lo cierra) · ⏸ pausa |
| Arrastre con un dedo en la mitad derecha | Desplaza la cámara temporalmente; al soltar vuelve al bloqueo si estaba bloqueada |
| Pellizco | Zoom con los límites del escritorio (3D 0,6–1,6; 2D 0,8–1,15) |
| Minimapa (arriba-izquierda, 150 px) | Toque = mover la cámara (se desbloquea; el candado la devuelve) · toque largo = señal |

Sin desplazamiento por borde. Los botones viven en `#touchUI` (DOM) y muestran nombre, tecla equivalente, enfriamiento,
rangos y el «+» cuando se puede subir; el joystick y la puntería se dibujan en el lienzo 2D vía `R.extraDraw`.

**HUD móvil.** Escala de interfaz × 1,15. Barra compacta arriba-centro (320 × 60): retrato, nivel, vida/recurso/XP, oro,
cargas de guardián y 6 objetos. Marcador superior igual que en escritorio. KDA, CS y temporizadores de objetivos
abajo a la izquierda (zona del joystick). El lienzo HUD usa `devicePixelRatio` (tope 2) y dibuja en px CSS.

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
