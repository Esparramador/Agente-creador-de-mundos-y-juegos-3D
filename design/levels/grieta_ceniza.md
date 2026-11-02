# La Grieta de Ceniza — documento de diseño de nivel

![Plano anotado](renders/grieta_ceniza_plano.png)
![Perspectiva](renders/grieta_ceniza_persp.png)

## Overview
Mapa principal 5v5 de 14 000 × 14 000 u. Las ruinas de una capital élfica calcinada están cruzadas en diagonal por un río de lava enfriada. Tiene tres carriles, cuatro cuadrantes de jungla y dos fosos épicos en el río.

## Player Fantasy
Una guerra en tres frentes sobre un reino en cenizas. Cada pelea en el río por el Dragón o el Señor se ve venir y se siente decisiva.

## Detailed Rules (disposición)
| Elemento | Posición (Aurora; Crepúsculo = reflejo (W−x, H−y)) | Notas |
|---|---|---|
| Fuente / Nexo | (700, 13300) / (1700, 12300) | Fuente: cura un 8%/s y su láser expulsa a los enemigos (radio 900) |
| Carril superior | Nexo → (1500, 10500) → (1500, 2500) → esquina → (12300, 1700) | 21 036 u; 61 s a pie; los súbditos llegan al centro en ~33 s |
| Carril central | Diagonal de Nexo a Nexo | 14 991 u; 43 s |
| Carril inferior | Nexo → (3500, 12500) → (11500, 12500) → esquina → Nexo rival | 21 036 u; 61 s |
| Torres (por carril) | T1 exterior, T2 interior, T3 de inhibidor (+ 2 TN del Nexo) | T1 a 20–26 s de la fuente; T3 a 9–11 s |
| Jungla (6 por lado) | Gólem azul (3500, 6500) · Lobos (2800, 8000) · Aves (5600, 7600) · Bestia roja (7400, 10400) · Roca (6300, 11300) · Sapo (9900, 11000) | Claro de tierra y anillo de piedras alrededor de cada campamento |
| Dragón Elemental | Foso inferior del río (9700, 9700) | A 28 s de ambas fuentes; anillo de runas de lava; los 4 tipos cambian el terreno |
| Heraldo / Señor | Foso superior del río (4300, 4300) | A 28 s de ambas fuentes |
| Rocas | 12 (6 por lado) | Bloquean el paso y la visión de la jugada (obstáculo real de la simulación) |
| Matorrales | 12 (6 por lado) | Ocultan a quien está dentro; en las entradas de jungla y en el río |

**Rutas de emboscada (gank):** desde cada bonus el jungla alcanza su carril lateral en ~10 s y el central en ~8 s. Los matorrales del río ((6500, 7500) y su reflejo) cubren las dos entradas a mitad de carril.

**Ritmo:**
- Primera oleada en el carril a los ~1:35.
- Dragón a las 5:00, Heraldo a las 8:00 y Señor a las 20:00.
- La partida dura 25–35 min (medido en partidas de bots: 27–38 min).

## Formulas
- Tiempo de recorrido = longitud / velocidad (345 u/s campeón, 325 u/s súbdito).
- Simetría por reflexión puntual: P_Crepúsculo = (14000 − x, 14000 − y). Ninguna posición favorece a un equipo.

## Edge Cases
- Las rocas temporales (pilares de Brannoc) y las de Forja (Dragón de Forja) se añaden en el juego, no en el `.glb`.
- Los matorrales nuevos (Dragón de Ceniza o de Raíz) los genera el juego sobre el escenario.

## Dependencies
`design/gdd/maps.md` (reglas), `game/src/maps.js` (geometría), `tools/blender/build_maps.py` (escenario).

## Tuning Knobs
Posiciones en `maps.js` (después: `export_maps.mjs` y `build_maps.py`), paleta `PAL['grieta_ceniza']` y densidad del decorado (`scatter_border`).

## Arte y ambiente
- Paleta de ceniza (pardos y grises cálidos), losas en los carriles y lecho de basalto en el río con grietas de lava emisivas.
- Acantilados de 2–5 m en el borde, con árboles muertos y frondosos, y charcas de lava fuera del área de juego.
- Estandartes del color de cada equipo rodean las bases.

## Acceptance Criteria
- Los obstáculos y matorrales del `.glb` coinciden con los de la simulación (se generan del mismo JSON).
- Ningún elemento decorativo supera 0,3 m de altura dentro de la zona jugable, salvo rocas, estructuras y matorrales.
- 60 fps con GPU integrada (83 k triángulos de escenario).
