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
- Ningún texto mide menos de 14 px a escala 100%.
- Todas las teclas se pueden reasignar.
