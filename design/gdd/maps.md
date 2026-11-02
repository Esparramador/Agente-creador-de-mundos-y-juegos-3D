# Mapas, estructuras, súbditos y objetivos

## Overview
La demo incluye 3 mapas con dinámicas distintas; los datos están en `assets/data/maps.json`. El equipo **Aurora** (azul) empieza abajo a la izquierda y el equipo **Crepúsculo** (rojo), arriba a la derecha.

## Player Fantasy
Cada mapa es un tablero táctico distinto: guerra de desgaste en la Grieta, pelea continua en el Puente y control de zonas en las Ruinas.

## Detailed Rules

### Elementos comunes
| Estructura | Vida | Daño | Reglas |
|---|---|---|---|
| Torre exterior | 5000 | 152 (+9/min) | +40% de daño por cada golpe seguido a un campeón; prioriza al campeón que ataca a un aliado |
| Torre interior | 3600 | 170 | Solo es atacable si cayó la exterior |
| Torre de inhibidor | 3300 | 170 | — |
| Inhibidor | 4000 | — | Al caer, el rival genera súper-súbditos; reaparece a los 5 min |
| Torres de Nexo (2) | 2700 | 180 | — |
| Nexo | 5500 | — | Destruirlo = victoria |

**Súbditos:**
- Una oleada cada 30 s desde el minuto 1:05, con 3 cuerpo a cuerpo y 3 a distancia.
- Cada 3ª oleada incluye además un súbdito de asedio.
- Su vida y su daño crecen cada 90 s.

**Base (Fuente):** cura un 8% por segundo y dispara láseres de 1000 de daño verdadero a los enemigos que entran.

---

### Mapa 1 — La Grieta de Ceniza (5v5 clásico)
*Ruinas de una capital élfica calcinada, partidas por un río de lava enfriada.*

- **Tamaño:** 14 000 × 14 000 u.
- **Distribución:** 3 carriles (superior, central e inferior), un río en diagonal y 4 cuadrantes de jungla.
- **Roles:** Superior (Luchador/Tanque), Jungla, Central (Mago/Asesino) y el carril inferior con Tirador + Soporte.
- **Estructuras:** 11 torres y 3 inhibidores por equipo.
- **Jungla:** 12 campamentos (6 por lado), con reaparición entre 2:15 y 5 min.
  - **Golem de Ceniza (bonus azul):** +10 de AH y +5 de maná/s durante 2 min.
  - **Bestia Ígnea (bonus rojo):** los ataques queman y ralentizan durante 2 min.
  - Lobos, aves, roca y sapo de río: oro y XP.
- **Objetivos épicos:**
  - **Dragón Elemental** (minuto 5, cada 5 min). Cada dragón es de uno de 4 tipos y da una mejora permanente a su equipo:

    | Dragón | Mejora | Cambio de terreno |
    |---|---|---|
    | Ceniza | +6% AD/PH | Grietas de humo que ocultan |
    | Marea | +3% de vida faltante/5 s | Charcos que aceleran |
    | Raíz | +8% de armadura/RM | Arbustos nuevos |
    | Forja | +6% de AH | Rocas que bloquean |

    Con 4 dragones el equipo obtiene el **Alma** del tipo dominante.
  - **Heraldo de Forja** (minuto 8 a 19:45). Al matarlo deja un ojo que, al usarse, invoca un ariete contra las torres (2000 de daño).
  - **Señor de la Ceniza** (desde el minuto 20, cada 6 min). Da 3 min de mejora: súbditos potenciados y +40 AD/PH.
- **Duración objetivo:** 25-35 min.

### Mapa 2 — Puente de la Niebla (5v5 ARAM)
*Un puente infinito sobre un abismo helado entre dos fortalezas.*

- **Tamaño:** 12 000 × 3200 u.
- **Distribución:** 1 carril, 4 torres por equipo (2 exteriores, 1 de inhibidor y 1 de Nexo) y 1 inhibidor.
- **Reglas especiales:**
  - Campeón aleatorio, con 2 cambios por equipo.
  - No se puede comprar salvo al morir o al reaparecer.
  - La Fuente no cura.
  - Hechizo exclusivo **Bola de Nieve**: lanza una bola y, si impacta, permite saltar hacia el objetivo.
  - 4 **Reliquias de vida** aparecen cada 60 s y curan 90 + 6 por nivel.
  - Se empieza en nivel 3 con 1400 de oro; el oro y la XP se ganan más rápido.
- **Duración objetivo:** 15-22 min.

### Mapa 3 — Ruinas del Eclipse (3v3 dominio)
*Templo en un bosque bajo un eclipse perpetuo.*

- **Tamaño:** 9000 × 9000 u.
- **Distribución:**
  - 2 carriles (superior e inferior) con 2 torres por carril y sin inhibidores.
  - 6 campamentos de jungla.
  - 3 **altares**: Norte, Centro y Sur.
- **Altares:**
  - Se capturan quedándose dentro, sin enemigos, durante 6 s.
  - Cada altar controlado da 1 punto cada 2 s al equipo.
  - Con 2 altares, las torres enemigas pierden un 20% de armadura.
- **Avatar del Eclipse** (minuto 10, cada 4 min): al matarlo, el equipo convierte durante 30 s todos los puntos que gana en dobles.
- **Victoria:** 500 puntos o destruir el Nexo.
- **Duración objetivo:** 12-18 min.

## Formulas
- Oleadas por minuto = 2. Oro por oleada completa ≈ 125 (195 con asedio).
- Daño de torre a un campeón tras n golpes seguidos = base × (1 + 0,4 × n), con un máximo de ×2,2.
- Puntos en Ruinas por segundo = 0,5 × altares controlados (× 2 con el Avatar).

## Edge Cases
- **Empate en Ruinas** (ambos equipos llegan a 500 en el mismo tick): gana el equipo con más altares; si persiste, muerte súbita en el altar central.
- **Ariete del Heraldo con la torre ya caída:** avanza hasta la siguiente torre.
- **Dragón en combate cuando le toca reaparecer:** se aplaza hasta que termine el combate.

## Dependencies
`combat-core.md` y `progression-economy.md`. Los diseños de nivel detallados (blockout) se harán con `/team-level`.

## Tuning Knobs
Tiempos de aparición de los objetivos, vida de las estructuras, puntos por altar y oro inicial del ARAM.

## Visual/Audio Requirements
Cada mapa tiene su paleta:
- **Grieta:** grises cálidos y naranja lava.
- **Puente:** azules y blancos con niebla volumétrica.
- **Ruinas:** violetas y dorado del eclipse.

Las capturas de altar y los objetivos épicos tienen un anuncio de voz global.

## Acceptance Criteria
- En la Grieta, una partida de bots normal contra normal dura de media entre 25 y 35 min (prueba de *soak* de 20 partidas).
- En el Puente, ningún campeón supera el 60% de victorias en 200 partidas simuladas entre bots.
- En las Ruinas, quien controla 2 de los 3 altares desde el minuto 5 gana al menos el 70% de las veces (confirma que el objetivo importa).
