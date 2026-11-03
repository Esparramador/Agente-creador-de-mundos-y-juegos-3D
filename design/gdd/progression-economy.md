# Progresión y economía

## Overview
Niveles 1-18 por experiencia (XP), oro por súbditos, campeones y objetivos, y una tienda con 31 objetos (`assets/data/items.json`): básicos, botas por niveles (7.2), legendarios y 4 objetos activos; los sets de objetos, runas y hechizos de la selección están en `runes-and-item-sets.md`.

## Player Fantasy
Pasar de aprendiz a coloso: cada compra se nota en la siguiente pelea.

## Detailed Rules
### Niveles
- La XP necesaria para pasar al nivel n es 280 + 100 × (n−2).
- La definitiva (R) se desbloquea en los niveles 6, 11 y 16; el resto de puntos se reparte entre Q, W y E (máx. 5 cada una).

### Oro
| Fuente | Oro |
|---|---|
| Ingreso pasivo (desde 1:05) | 20,4 / 10 s |
| Súbdito cuerpo a cuerpo / a distancia / de asedio | 21 / 14 / 60–90 |
| Asesinato de campeón | 300 (racha: +100 por asesinato, hasta 1000) |
| Romper una racha | +150 por cada nivel de racha de la víctima |
| Asistencia | 50% del valor, repartido |
| Torre | 250 para el equipo + 150 para quien la derriba |
| Primera sangre | +100 |
| Dragón / Heraldo / Señor | 75 / 200 / 300 por cada jugador del equipo |

### Tienda
- Solo se compra en la base (la Fuente); el inventario tiene 6 huecos.
- Vender un objeto devuelve el 70% de su coste.
- Los objetos están en `assets/data/items.json` (31): 5 básicos, 8 botas (nivel 1 → 2 → 3 desde el 10:00), 14 legendarios y 4 activos (solo uno por campeón). Reglas de compra en `runes-and-item-sets.md` §3.4.

### Experiencia compartida
Las unidades enemigas que mueren a menos de 1600 u. dan XP; se reparte entre los aliados presentes con un bonus del 15% por cada aliado extra.

## Formulas
- Oro por minuto esperado de un carril bien farmeado ≈ 400 en el minuto 10 y ≈ 550 en el 25.
- Valor del objeto ≈ Σ(estadística × precio unitario): AD 35 · PH 21,75 · Vida 2,67 · Armadura 20 · RM 18 · Velocidad de ataque 25/1% · Velocidad de movimiento 12.

## Edge Cases
- Comprar con el inventario lleno: si la receta consume componentes, se permite; si no, se bloquea con un mensaje de aviso.
- Repartir oro de asistencia con un aliado muerto: se le entrega igualmente.

## Tuning Knobs
Ingreso pasivo, oro por súbdito, tope de racha y la tabla de XP.

## Dependencies
`combat-core.md` (estadísticas), `maps.md` (fuentes de oro), `assets/data/items.json`.

## Acceptance Criteria
- Un jugador con 10 súbditos/min y sin asesinatos tiene unas 3500 de oro en el minuto 10.
- El nivel 18 se alcanza alrededor del minuto 32 en el carril central.
