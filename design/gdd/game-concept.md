# Coronas de Ceniza — Concepto del juego (DEMO)

## Elevator Pitch
MOBA por equipos en el que dos bandos de campeones se disputan un reino que arde. Cada partida dura entre 12 y 35 minutos según el mapa. Se recogen las mecánicas que han hecho grande al género (carriles, súbditos, torres, jungla, objetivos épicos y objetos) con un mundo propio de razas y facciones enfrentadas.

## Core Identity
- **Género:** MOBA (Multiplayer Online Battle Arena), vista cenital isométrica.
- **Plataforma de la demo:** PC (Windows/Linux), teclado y ratón.
- **Motor recomendado:** Godot 4.x (código abierto y sin regalías; buen 3D isométrico). Alternativa: Unity.
- **Modos de la demo:** 5v5 clásico, 5v5 ARAM y 3v3 dominio; contra bots o en LAN.

## Core Fantasy
Ser el héroe decisivo de una batalla épica: dominar un kit de 4 habilidades, leer el mapa y coordinar con tu equipo la jugada que gana la partida.

## Unique Hook
- **Razas y facciones con sinergias:** 2+ campeones de la misma facción dan un pequeño bonus de equipo (ver `combat-core.md`).
- **Mapa vivo:** el Dragón Elemental cambia el terreno de la Grieta de Ceniza (ceniza, marea, raíces o forja).

## Player Experience Analysis (MDA Framework)
- **Mecánicas:** habilidades con apuntado, último golpe a súbditos, compra de objetos, visión con guardianes.
- **Dinámicas:** presión por carriles, emboscadas desde la jungla, peleas por objetivos y tácticas de división del equipo.
- **Estética:** desafío, compañerismo, expresión de habilidad y remontadas épicas.

## Player Motivation Profile
Competencia (dominar campeones), relación (equipo) y autonomía (elegir campeón, rol y objetos).

## Core Loop
- **30 s:** farmear súbditos, intercambiar daño en el carril, colocar visión.
- **3-5 min:** regresar a base, comprar objetos y ayudar a otros carriles (gank), disputar un objetivo.
- **Partida:** fase de carriles → peleas de grupo → asedio → Nexo.

## Game Pillars
1. **Legible antes que complejo:** cada habilidad se entiende con solo verla (telegráfos claros y colores por equipo).
2. **Cada decisión cuenta:** oro, visión y tiempo son recursos escasos y compartidos.
3. **Remontar es posible:** las recompensas por romper rachas y los objetivos tardíos evitan partidas decididas en el minuto 10.
4. **Identidad por facción:** arte, sonido y mecánicas cuentan qué raza y facción es cada campeón.

## Inspiration and References
League of Legends, Dota 2, Heroes of the Storm (objetivos de mapa), SMITE (ARAM). **Ningún personaje, nombre ni asset es de esas obras:** todo el contenido es original.

## Target Player Profile
Jugadores de 16 a 35 años que conocen el género o vienen de los shooters por equipos; sesiones de 20-40 minutos.

## Technical Considerations
- Simulación de servidor autoritativa a 30 ticks/s; el cliente predice el movimiento propio.
- Datos impulsados por JSON (`assets/data/*.json`), que el hook `validate-assets` comprueba.
- Bots locales para jugar la demo sin servidor.

## Risks and Open Questions
- **Riesgo de propiedad intelectual:** conservar una identidad propia y evitar clones de kits conocidos.
- **Equilibrio:** con 15 campeones aparecen combinaciones dominantes; se mitiga con `tools/build_design.py --check` y con playtests.
- **Abierto:** ¿incluir ya en la demo selección con bloqueos (draft)?

## MVP Definition
Ver `production/demo-scope.md`. Mínimo jugable: la Grieta de Ceniza, 6 campeones (uno por clase) y bots en dificultad normal.

## Next Steps
`/design-review design/gdd/combat-core.md` → `/create-architecture` → `/create-epics` → `/sprint-plan`.
