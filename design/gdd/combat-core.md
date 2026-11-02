# Combate base

## Overview
Reglas compartidas por todas las unidades (campeones, súbditos, monstruos y torres): estadísticas, cálculo de daño, control de masas (CC), visión, muerte y reaparición.

## Player Fantasy
Cada golpe pesa: un buen esquive o un aturdimiento a tiempo deciden una pelea.

## Detailed Rules
### Estadísticas
Vida, maná/recurso, daño de ataque (AD), poder de habilidad (PH/AP), armadura, resistencia mágica (RM), velocidad de ataque, velocidad de movimiento, alcance, aceleración de habilidades (AH), crítico, robo de vida y penetración.

### Tipos de daño
- **Físico:** se mitiga con armadura.
- **Mágico:** se mitiga con RM.
- **Verdadero:** no se mitiga.

### Ataques básicos
Se ejecutan con clic derecho sobre un enemigo. Cada uno tiene un tiempo de preparación (*windup*) del 25% del intervalo de ataque; cancelar el movimiento durante esa preparación anula el ataque (*animation cancel*).

### Control de masas (CC)
| CC | Efecto | ¿Lo reduce la tenacidad? |
|---|---|---|
| Ralentización | −X% de velocidad de movimiento | Sí |
| Aturdimiento | Ni moverse, ni atacar, ni lanzar habilidades | Sí |
| Inmovilización | No puede moverse; sí atacar y lanzar | Sí |
| Lanzamiento por los aires | Como un aturdimiento, no se puede purificar | No |
| Silencio | No puede lanzar habilidades | Sí |
| Ceguera | Los ataques básicos fallan | Sí |
| Provocación / miedo | Movimiento forzado | Sí |
| Sueño | Aturdimiento que se rompe al recibir daño | Sí |

Los CC del mismo tipo no se acumulan: se aplica la duración mayor.

### Visión
- Radio de visión: campeón 1350 u., súbdito 1100 u., torre 1350 u.
- **Matorrales:** quien está dentro solo es visible desde dentro o con un guardián.
- **Guardianes:** 2 cargas, duran 90 s, se recargan cada 120 s. **Guardián de control** (75 de oro): revela la invisibilidad.

### Muerte y reaparición
- Tiempo de reaparición = 6 + 2,5 × nivel s (máx. 50 s); a partir del minuto 30, +0,15 s por minuto extra.
- El asesino recibe la recompensa en oro y XP (ver `progression-economy.md`); los asistentes, en un radio de 1600 u. y si dañaron en los últimos 10 s, se reparten un 50% extra.

### Sinergia de facción
2 campeones de la misma facción en el equipo dan +3% a una estadística, según la facción:
- Horda: AD.
- Bosque Onírico: AH.
- Orden del Sol: armadura.
- Torre Gris: PH.
- El resto: +10 de velocidad de movimiento.

Con 3 o más, el bonus se duplica.

### Hechizos de invocador (2 por jugador)
| Hechizo | Efecto | CD (s) |
|---|---|---|
| Destello | Teletransporte de 400 u. | 300 |
| Prender | 70–410 de daño verdadero en 5 s y −40% de curación recibida | 180 |
| Curar | 90–345 de curación y +30% de velocidad 1 s | 240 |
| Castigo | 600–1200 de daño a un monstruo; obligatorio para el jungla | 15 (2 cargas) |
| Teleportar | Viaja a una estructura aliada | 360 |
| Barrera | Escudo de 115–455 durante 2 s | 180 |

## Formulas
- Daño final = daño bruto × 100/(100 + R) si R ≥ 0, o × (2 − 100/(100 − R)) si R < 0.
- R efectiva = R × (1 − penetración%) − letalidad.
- Intervalo de ataque = 1 / (vel. base × (1 + bonus%)), con tope de 2,5 ataques/s.
- CD efectivo = CD × 100/(100 + AH).
- Duración del CC = duración × (1 − tenacidad).

## Edge Cases
- **Daño simultáneo letal:** el servidor procesa por orden de llegada en el mismo tick; si los dos mueren, ambos reciben la recompensa.
- **Destello durante un lanzamiento por los aires:** no es posible.
- **Escudos y daño verdadero:** los escudos sí absorben el daño verdadero.

## Dependencies
Datos de campeón (`champion-roster.md`) y objetos (`progression-economy.md`).

## Tuning Knobs
Tope de vel. de ataque, fórmula de reaparición, tamaño de los bonus de sinergia, duración y CD de los guardianes.

## Visual/Audio Requirements
Los telegráfos de habilidad son rojos para enemigos y azules para aliados. Cada tipo de CC tiene un icono sobre la cabeza y un sonido propio.

## Acceptance Criteria
- Un ataque de 100 contra 100 de armadura inflige 50.
- Un aturdimiento de 2 s con 30% de tenacidad dura 1,4 s.
- Un enemigo dentro de un matorral no es visible desde fuera sin guardián.
