# IA de bots

## Overview
Bots para jugar la demo sin conexión. Usan un árbol de comportamiento por rol y una capa táctica de equipo.

## Player Fantasy
Rivales creíbles que castigan los errores sin parecer injustos.

## Detailed Rules
### Capa estratégica (equipo, cada 2 s)
Evalúa la ventaja de oro, los objetivos disponibles y las torres en riesgo, y elige el plan del equipo: FARMEAR, AGRUPARSE_OBJETIVO, DEFENDER o ASEDIAR.

### Capa táctica (por bot, cada 0,25 s)
Prioridades de mayor a menor:
1. Huir si su vida es menor del 25% y está en peligro.
2. Combo si la amenaza estimada es favorable.
3. Último golpe.
4. Empujar la oleada.
5. Colocar visión.
6. Volver a base cuando tenga más de 1300 de oro o menos del 30% de vida.

### Amenaza estimada
Amenaza = Σ(daño potencial de los enemigos visibles en 3 s) / vida efectiva propia. El bot entra a pelear si la ratio de amenaza aliada frente a la enemiga es mayor de 1,2.

### Dificultades
| Parámetro | Fácil | Normal | Difícil |
|---|---|---|---|
| Reacción (ms) | 450 | 250 | 120 |
| Precisión de habilidades | 50% | 75% | 90% |
| Esquiva habilidades | No | A veces | Sí |
| Últimos golpes conseguidos | 40% | 70% | 90% |
| Usa la capa estratégica | No | Sí | Sí y además toma objetivos |

### Guiones por campeón
Cada campeón tiene un combo preferido (por ejemplo, Vaelor: Q → E si está quemando → W → R) y una regla de iniciación definida en un JSON por campeón.

## Formulas
- Ratio de pelea = amenaza aliada / amenaza enemiga; se entra si es mayor de 1,2 y se huye si es menor de 0,7.
- Error de puntería = desviación normal (σ) de 120 × (1 − precisión) u.

## Edge Cases
- Un bot sin ruta (bloqueado por los pilares de Brannoc): vuelve a calcular el camino cada 0,5 s y, tras 2 s, se aleja.
- Todos los bots muertos: la capa estratégica sigue planificando con los tiempos de reaparición.

## Dependencies
`combat-core.md`, `maps.md` (malla de navegación), `champion-roster.md`.

## Tuning Knobs
La tabla de dificultades, los umbrales de pelea y huida, y el oro mínimo para volver a base.

## Acceptance Criteria
- Un bot Normal consigue 50 CS o más a los 10 minutos.
- Los bots Difíciles ganan al menos el 65% de las partidas contra bots Normales (con 100 partidas simuladas).
