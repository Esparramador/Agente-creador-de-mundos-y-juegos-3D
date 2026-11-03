# Runas, hechizos de invocador y sets de objetos

**Sistema:** selección de campeón al estilo Wild Rift (pantalla, hechizos, sets, runas) · **Categoría:** Core / Feature · **Estado:** implementado y verificado (03/11/2026) · **Fuentes:** `design/ux/wild-rift-disposicion.md` §2–§4 (capturas 07–09) y `design/ux/wild-rift-fuentes.md` §3, §5, §6.

## 1. Overview

Antes de la partida el jugador entra en una **sala** con 4 bots aliados ya asignados a sus posiciones y 5 rivales ocultos, elige campeón en una rejilla de 5 columnas con filtros por rol, y configura su **equipamiento**: 2 hechizos de invocador (de 9), una **página de runas** (1 clave + 3 menores de la rama primaria + 1 menor de otra rama) y un **set de 6 objetos** (destacado, popular, de los mejores jugadores o personal). Todo ello tiene efecto real en `world.js`: el set alimenta la compra rápida del HUD y la tienda de los bots, las runas modifican estadísticas y daño, y los hechizos tienen los enfriamientos oficiales. Los nombres de hechizos, runas y objetos son propios de Coronas de Ceniza; los efectos equivalen a los de Wild Rift.

## 2. Player Fantasy

«Preparo mi campeón como un profesional»: ver a mi equipo y mi posición, descubrir a los rivales en los últimos 10 segundos, y llegar a la Grieta con un plan (set + runas + hechizos) que de verdad cambia cómo juega mi campeón.

## 3. Detailed Rules

### 3.1 Sala de selección (`game/src/seleccion.js`, DOM en `main.js`/`index.html`)
- Posiciones (nombres Wild Rift): CALLE DEL BARÓN (`top`), JUNGLA (`jungle`), CALLE CENTRAL (`mid`), CALLE DEL DRAGÓN (`bot`), SOPORTE (`support`). Al jugador se le asigna una al azar; los 4 bots aliados reciben las otras con un campeón que encaje (`posicionPrincipal` = la misma regla que `ROLE_OF` en `world.js`); los 5 rivales también, sin repetir campeón entre los 10.
- **Cuenta atrás real de 60 s** (`crearCuentaAtras`): los rivales se revelan a los 10 s; a 0 se fija el campeón marcado o uno libre al azar que encaje en la posición, y arranca la partida. Se detiene mientras hay una ficha, un panel lateral, la ayuda o las opciones abiertos.
- Rejilla de 5 columnas con retratos reales (caras de los modelos, `tools/retratos.py` → `game/src/retratos.js`), marco dorado al elegido, insignia «REC.» para los que encajan en la posición del jugador y «ALIADO» para los que ya lleva un bot. Filtros: todos · Tanque · Luchador · Asesino · Mago · Tirador · Soporte · búsqueda por nombre sin tildes (`filtrar`).
- Elegir un campeón que llevaba un bot aliado: el bot vuelve a elegir para su posición (`elegirCampeon`). **⇄** pide cambio de posición a un bot: siempre acepta, intercambian posiciones y el bot re-elige campeón (`intercambiarPosicion`).
- Doble toque en una tarjeta o «Ficha del campeón» / «Aspecto» abren la ficha de `fichas.js` (con selector de aspecto).
- «Fijar preselección» (`#play`) crea la partida con la **alineación** de la sala (`alineacion` → `new Game({ lineup })`): el jugador primero en el equipo 0 con hechizos, set y runas; bots y rivales con su posición. El Puente (ARAM) sigue siendo aleatorio.

### 3.2 Hechizos de invocador (`kits.js` `SUMMONERS`, `castSummoner`)
| id | Nombre | Efecto | Enfr. |
|---|---|---|---|
| flash | Parpadeo | salto de 400 u | 150 s |
| ghost | Zancada | +35 % vel. mov. 8 s; +6 s por derribo | 90 s |
| heal | Sanar | cura 110 (+17/nivel) a ti y al aliado cercano más herido; +30 % vel. 1 s | 100 s |
| barrier | Muralla | escudo 120 (+26/nivel) 2,5 s | 100 s |
| exhaust | Extenuar | campeón enemigo: −40 % daño infligido y 35 % ralentización 2,5 s | 100 s |
| ignite | Brasa | 72 (+18/nivel) daño verdadero en 5 s, revela, heridas graves 60 % | 100 s |
| smite | Juicio | 600 verdadero a monstruo/súbdito y cura 70 (+10/nivel); **2 cargas** (una cada 90 s), 15 s entre usos; **tras 3 usos evoluciona** a Juicio Gélido: 1000 y se puede lanzar a campeones (20+8/nivel verdadero + 30 % ralentización 2 s) | 15 s |
| cleanse | Purga | quita todos los controles de masas (se lanza bajo CC) e inmunidad 0,25 s | 110 s |
| teleport | Portal | canaliza 3 s hacia el aliado o guardián más avanzado (torres antes del 6:00) | 150 s |
| snowball | Bola de Nieve | solo en el Puente (ARAM) | 40 s |

Recomendados por posición (`SUMMONERS_BY_POSITION`): jungla Parpadeo+Juicio (obligatorio: `spawnChampion` lo fuerza), barón Parpadeo+Portal, central Parpadeo+Brasa, dragón Parpadeo+Sanar, soporte Parpadeo+Extenuar. Los bots usan los 9 (`ai.js` `useSummoners`). Celeridad de invocador (`sumHaste`, botas de Lucidez) acorta los enfriamientos.

### 3.3 Runas (`assets/data/runes.json`, `game/src/runas.js`)
Estructura Wild Rift: **1 clave + rama primaria (3 menores de la rama de la clave) + rama secundaria (1 menor de otra rama)**; `validarPagina` lo comprueba. Ramas: **Acero** (Precisión), **Sombra** (Dominación), **Roca** (Valor), **Arcano** (Brujería). 13 claves (equivalencias en §4) y 16 menores (4 por rama). Página recomendada por campeón = la del set destacado. Las menores con estadística se aplican como buff permanente `runas`; el resto son ganchos en `world.js`: `kit.onDealt` (daño infligido), `performAttack` (ataques), `kit.onDamaged`, `emit('cc')` (inmovilizar), `onChampDeath` (derribos), `updateChampion` (tick). Pantalla de runas desde ⊕ (insignia «1» hasta que el jugador aplica una página o un set), con páginas guardadas en `localStorage` (`cdc_runas`).

### 3.4 Objetos (`tools/build_design.py` `ITEMS` → `assets/data/items.json`, 31)
- 5 básicos, **botas 7.2**: Botas (nivel 1, 300) → nivel 2 a 1200 (Azogue: RM + 30 % tenacidad; Acero: armadura y −10 % de ataques básicos; Grebas del Frenesí: +25 % vel. ataque; Lucidez, 1000: +10 celeridad y −10 % enfriamiento de invocador) → **nivel 3 desde el 10:00** (+1000: Trituradoras Encadenadas, Avance Blindado, Lucidez Carmesí). Cada nivel descuenta el anterior y sustituye el par (`slot: 'botas'`): solo un par.
- 14 legendarios (8 anteriores + Sed de Sangre, Garra Sangrienta, Yelmo del Abismo, Cuchilla del Verdugo, Capa del Ángel con renacer al 30 % cada 180 s, Eco de Brasas).
- **4 objetos activos** (7.2: solo UNO por campeón, `slot: 'activo'`, tecla 1 / `G.cmdItemActive(u, aim)`): Reloj de Estasis (invulnerable 2,5 s, 90 s), Relicario de Hierro (escudo a aliados cercanos, 90 s), Cinturón Cohete (impulso 300 u + ráfaga, 40 s), Azogue Vital (quita CC, 90 s). Los bots los usan (`ai.js`).
- Estadísticas nuevas que `core.recalcStats` no lee de los objetos (`ls`, `arpen`, `tenacity`, `omnivamp`, `mana`, `sumHaste`) se suman en el buff permanente `objetos` (`Game.syncItemBuff`). El maná sube `resMax` (`recalcRes`). El omnivampirismo cura con todo el daño nuevo (un tercio contra lo que no es campeón).
- `Game.canBuy(u, id)` → `{ ok, why, cost, prev }` (motivo: «necesitas Botas», «desde el 10:00», «solo un objeto activo», «ya llevas botas», «inventario lleno», «sin oro», «fuera de la fuente»).

### 3.5 Sets de objetos (`assets/data/item_sets.json`, 45 = 3 por campeón)
- Cada set: nombre, `featured`, 6 objetos (unas botas de nivel 2, ≤ 1 activo), página de runas válida, 2 hechizos de su posición, y **popularidad / porcentaje de victorias medidos por simulación** (`game/tools/simular_sets.mjs`: partidas reales entre bots en la Grieta, cada bot elige un set de su campeón —al azar en la primera ronda y después con preferencia por los que más ganan—; popularidad = partidas en las que se usó, victorias = partidas ganadas / usadas). `build_design.py` conserva las cifras al regenerar.
- Pestañas: PERSONAL (el jugador compone 6 tocando objetos; `localStorage` `cdc_sets_personal`), DESTACADO (`featured`), POPULAR (orden por popularidad), MEJORES JUGADORES (orden por % de victorias). ✓ = seleccionado; ⬇ aplica el set (objetos + runas + hechizos). ↻ bajo los objetos 4–6 = intercambiables.
- **Contrato con el HUD** (compra rápida): `G.player.itemSet` = lista ordenada de 6 ids; `G.player.setId`; `G.nextSetItem(u)` = siguiente objeto del set que falta (devuelve las Botas base antes que unas de nivel 2); `G.canBuy(u, id)`; `G.player.runes` = `{ key, minors[3], secondary }`; `G.player.activeCd` y `u.items.find(i => i.active)` para el botón de objeto activo.
- Bots: `spawnChampion` elige el set más popular (ponderado al azar entre los de su campeón, `elegirSet`), compra siguiendo el set (`ai.js` `shop`/`nextItem`) y mejora las botas al nivel 3 desde el 10:00.

## 4. Formulas

| Clave (rama) | Equivalente | Efecto implementado |
|---|---|---|
| Asedio (Acero) | Empowerment / Press the Attack | 3 ataques básicos seguidos a un campeón → 30 + 6·nivel adaptativo y «expuesto» (+8 % daño recibido) 6 s |
| Compás Letal (Acero) | Lethal Tempo | +10 % vel. ataque por carga (máx. 6) 6 s; con 6, +50 alcance |
| Pies de Viento (Acero) | Fleet Footwork | cada 2 s el siguiente ataque cura 5 + 1,5·nivel y +20 % vel. mov. 1 s |
| Vencedor (Acero) | Conqueror | +2 AD / +4 PH por carga (máx. 6) 6 s; con 6, 9 % omnivampirismo (5 % a distancia) |
| Tormenta Rápida (Sombra) | Electrocute | 3 golpes en 3 s → 30 + 8·nivel adaptativo; 20 s |
| Siega Sombría (Sombra) | Dark Harvest | objetivo < 50 % vida → 20 + 5·nivel + 5·almas adaptativo; 25 s, 1 s tras derribo |
| Primer Tajo (Sombra) | First Strike | golpear primero → +15 oro y +7 % daño 3 s; 25 s |
| Garra del Sepulcro (Roca) | Grasp of the Undying | cada 3 s en combate: siguiente ataque 3 % vida máx. mágico, cura 1,5 %, +3 vida máx. permanente |
| Custodio (Roca) | Guardian | al recibir un golpe de campeón: escudo 40 + 10·nivel a ti y al aliado más cercano (350 u) 2 s; 60 s |
| Señor de la Escarcha (Roca) | Ice Overlord | inmovilizar → zona de hielo (30 % ralentización 2 s) y +30 armadura/RM 2,5 s; 20 s |
| Luciérnaga (Arcano) | Aery | habilidad → +10 + 3·nivel mágico; 3 s |
| Cometa de Ceniza (Arcano) | Arcane Comet | habilidad → cometa 30 + 6·nivel mágico a los 0,6 s; 12 s |
| Paso de Fase (Arcano) | Phase Rush | 3 golpes en 4 s → +30 % vel. mov. y +10 celeridad 3 s; 15 s |

Adaptativo: tipo físico si `adBonus ≥ ap`, mágico si no (1 de fuerza adaptativa = 1 AD o 2 PH). Menores: Brutal +6 AD +10 PH · Triunfo cura 10 % de la vida perdida y +20 oro por derribo · Ardor +10 % vel. ataque · Golpe de Gracia +8 % daño a < 40 % · Golpe Barato 10 + 2·nivel verdadero a objetivos bajo CC (4 s) · Impacto Súbito +8 % penetración · Trofeos +2 AD/+4 PH por derribo (máx. 5) · Cazador Incansable +12 vel. mov. · Placas de Hueso +8 arm/+8 RM · Segundo Aliento +4 + 0,5·nivel vida/s bajo 50 % · Inquebrantable +20 % tenacidad · Raíces Profundas +100 vida · Trascendencia +10 celeridad · Caudal de Maná +200 maná · Tormenta Creciente +4 AD/+7 PH cada 5 min · Chamuscar 15 + 2·nivel mágico tras 1 s (10 s).

Botas: `cost(nivel n) = precio(n) − precio(objeto base que ya llevas)`; nivel 3 solo si `g.t ≥ 600`. Simulación: `peso(set) = ((victorias + 1) / (partidas + 2))⁴` a partir de la segunda ronda.

## 5. Edge Cases

- El jugador elige un campeón que llevaba un bot aliado → el bot re-elige; nunca hay dos iguales en la sala. Si al llegar a 0 no hay campeón marcado, se elige uno libre que encaje en la posición.
- Cambiar de modo con un campeón ya elegido re-aplica el equipamiento (el tutorial fuerza Parpadeo + Juicio; el Puente, Parpadeo + Bola de Nieve y no usa la alineación).
- Página de runas inválida guardada (datos viejos) → `normalizarPagina` cae a la recomendada. Set personal con menos de 6 objetos no se puede aplicar.
- Juicio sin evolucionar sobre un campeón → no se lanza (no gasta carga). Purga se lanza aturdido; Azogue Vital también. Reloj de Estasis bloquea mover/atacar 2,5 s (CC propio, inmune a daño).
- Comprar unas botas de nivel 2 sin llevar Botas → «necesitas Botas» (los bots compran primero las Botas, `nextSetItem`). Un segundo objeto activo → «solo un objeto activo».
- Capa del Ángel: tras renacer, el buff vuelve a los 180 s; vender la capa lo quita.
- Las 3 posiciones de las Ruinas (3v3) toman los 3 primeros de la alineación.

## 6. Dependencies

`combat-core.md` (estadísticas, CC, tenacidad), `progression-economy.md` (oro, tienda), `bots-ai.md` (compra y uso de hechizos/activos), `ui-hud-controls.md` (compra rápida y botón de objeto activo, del flujo B), `champion-roster.md`, `assets/data/{items,item_sets,runes}.json`, `tools/build_design.py`, `tools/retratos.py`, `game/tools/simular_sets.mjs`.

## 7. Tuning Knobs

Enfriamientos y valores de `SUMMONERS`; umbral de evolución de Juicio (3 usos) y recarga (90 s); números de cada runa en `runas.js`; `ITEMS`/`SET_TEMPLATES`/`SUMMONERS_BY_POSITION` en `build_design.py`; `since` de las botas de nivel 3 (600 s); partidas/ronda/tope de `simular_sets.mjs`; duración de la cuenta atrás (60 s) y revelado (10 s).

## 8. Acceptance Criteria

- `node --test game/tests/game.test.mjs`: 9 hechizos con efecto medible y enfriamiento; Juicio con cargas, recarga y evolución; 13 claves que cambian una estadística o un daño frente a la misma arena sin esa clave; menores con estadística; botas por niveles y objetos activos; sets válidos (6 ids existentes, ≤ 18 000 de oro, runas válidas, cifras numéricas); partida con alineación en la que los bots compran su set y la jungla lleva Juicio.
- `node --test game/tests/seleccion.test.mjs`: posiciones, filtros, sala, re-elección, intercambio, cuenta atrás, alineación.
- `python3 game/tests/e2e_browser.py`: filtro por rol reduce la rejilla, panel de hechizos cambia `#sum0`, aplicar un set cambia `G.player.itemSet`, runas aplicadas cambian `G.player.st.maxHp`, rivales revelados = rivales de la partida; capturas `production/qa/evidence/2026-11-03-seleccion-{campeon,hechizos,sets,runas}.png`.
