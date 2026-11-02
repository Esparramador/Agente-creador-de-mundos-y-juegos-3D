# Flujo de partida y dinámicas de juego

## Overview
El recorrido completo de una partida, desde el menú hasta la pantalla final, y las fases tácticas dentro de ella.

## Player Fantasy
Una historia en tres actos: el duelo en el carril, la guerra por los objetivos y el asedio final.

## Detailed Rules
### Antes de la partida
1. **Menú:** Jugar → elegir mapa → contra bots (Fácil, Normal o Difícil) o LAN.
2. **Selección de campeón (60 s):**
   - En la Grieta y las Ruinas, selección a ciegas.
   - En el Puente, selección aleatoria.
   - Se elige skin (solo la básica en la demo) y 2 hechizos de invocador.
3. **Pantalla de carga:** muestra las tarjetas de los 10 campeones con su raza, clase y facción, y las sinergias de facción activas.

### Fases de la partida (Grieta de Ceniza)
| Fase | Minutos | Objetivo del jugador | Dinámica clave |
|---|---|---|---|
| Apertura | 0-1:30 | Proteger la jungla, colocar el primer guardián | Invasiones de nivel 1 |
| Carriles | 1:30-14 | Último golpe, intercambios y control de la oleada | Ganks del jungla, primer dragón |
| Media partida | 14-25 | Agruparse, rotar y asegurar dragones/Heraldo | Peleas en el río y control de visión |
| Final | 25+ | Señor de la Ceniza, asedio, inhibidores | Una pelea decide la partida |

### Dinámicas que se enseñan en la demo (tutorial en 5 pasos)
1. **Mover y atacar** (clic derecho), y lanzar habilidades (Q/W/E/R).
2. **Último golpe** a súbditos para ganar oro.
3. **Torres:** no atacarlas sin súbditos que te cubran.
4. **Visión:** guardián con la tecla 4 y matorrales.
5. **Objetivos:** matar al Dragón con Castigo.

### Recursos de remontada
- Recompensa por romper una racha (ver `progression-economy.md`).
- El Alma de dragón y el Señor de la Ceniza se pueden robar con Castigo.
- Los tiempos de reaparición largos del final hacen decisiva una sola pelea ganada.

### Fin de partida
- Se puede votar rendición (`/ff`) desde el minuto 15, con 4 de 5 votos (o 2 de 3 en las Ruinas).
- La pantalla final muestra KDA, daño, oro, CS, visión y un gráfico de oro del equipo por minuto.

## Edge Cases
- **Desconexión:** el campeón vuelve a la base y lo controla un bot hasta que el jugador regrese (solo en LAN).
- **Pausa:** solo en partidas contra bots.

## Formulas
- Votos de rendición necesarios = ⌈0,8 × jugadores⌉.
- Duración del tutorial ≈ Σ(pasos × 70 s).

## Dependencies
`maps.md`, `champion-roster.md`, `ui-hud-controls.md`, `bots-ai.md`.

## Tuning Knobs
Tiempo de selección (60 s), minuto mínimo para rendirse (15) y pasos del tutorial.

## Acceptance Criteria
- Del menú a la partida en menos de 3 clics y 90 s.
- El tutorial se completa en menos de 6 minutos.
