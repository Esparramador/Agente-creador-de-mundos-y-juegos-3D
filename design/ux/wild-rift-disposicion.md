# Wild Rift — disposición real medida sobre capturas (03/11/2026)

Fuente: 9 capturas de Joan en un móvil 2992×1344 (20:9), en `design/ux/referencias/wild-rift/`. Posiciones en **% del ancho (x) y del alto (y)**, medidas sobre las capturas; sirven de contrato para `touchmath.js` (`layoutButtons`) y para la selección de campeón. Donde Riot documenta algo, `wild-rift-fuentes.md` lo cita.

## 1. En partida (capturas 01–06)

| Elemento | Posición (x %, y %) | Tamaño | Notas |
|---|---|---|---|
| **Minimapa** | 7–22, 2–34 | cuadrado ≈ 15 % del ancho | arriba-izquierda; torres, campamentos (con nivel), jugadores; el propio jugador con círculo verde |
| Botones junto al minimapa | x 24; y 17 / 23 / 30 | 3 iconos pequeños | ⚙ ajustes · 🔇 silenciar · 🎤 micro (columna vertical a la derecha del minimapa) |
| **Oro** | 7–11, 35–43 | caja dorada | «LL 100» bajo el minimapa |
| Objetos comprados | 12–21, 35–43 | 2 ranuras cuadradas | a la derecha del oro, en la misma fila (capturas 04–06) |
| Mensajes de aliados | 7–30, 48 | texto con retrato | «¡Venid a disfrutar de estos frutos!» |
| **Retratos de aliados** | 23–34, 2–6 | 4 círculos con barra de vida | arriba-centro-izquierda (los 4 compañeros); un retrato con número de muertes debajo cuando uno cae |
| **Barra del objetivo** | 43–59, 2–7 | retrato + «894/1100» + AD/AP/armadura/RM | solo cuando hay un objetivo fijado (capturas 02, 03) |
| **Marcador** | 72–78, 2–5 | «0 vs 0» + reloj «00:12» | arriba-derecha |
| KDA + red/batería/FPS | 80–88, 2–5 | «0/0/0», «27 ms», «FPS:30» | |
| Chat | 91, 3 | icono bocadillo | esquina superior derecha |
| **Columna derecha** | x 91; y 13 / 24 / 35 / 46 | 4 botones de 40 px | ✕ bloquear/soltar objetivo · ❗ señal · ↓ **volver a base** · ⊙ centrar cámara |
| Contador CS | 85, 32 | círculo teal «0 / 95» | súbditos rematados / oro acumulable (debajo de la columna) |
| **Ataque básico** | 85, 78 | r ≈ 4,5 % del ancho (el mayor) | espada en círculo dorado |
| Sub-botón súbdito | 79, 90 | pequeño | ⚒ debajo-izquierda del ataque: enfocar súbdito |
| Sub-botón torre | 89, 62 | pequeño | 🗼 arriba-derecha del ataque: enfocar torre |
| **Habilidad 1** | 73, 86 | r ≈ 2,8 % | abajo-izquierda del ataque, con contador de enfriamiento y anillo azul de carga |
| **Habilidad 2** | 74, 70 | r ≈ 2,8 % | izquierda del ataque |
| **Habilidad 3** | 78, 57 | r ≈ 2,8 % | arriba-izquierda del ataque |
| **Definitiva** | 85, 51 | r ≈ 3 % | encima del ataque; «63» cuando está en enfriamiento |
| Poción / objeto activo | 88, 62 | pequeño | frasco azul a la derecha de la definitiva (aparece cuando hay poción) |
| Subir rango | sobre cada habilidad | «+» | aparece cuando hay punto disponible |
| **Hechizos de invocador** | 58, 86 y 64, 86 | r ≈ 2,5 % | dos: p. ej. Castigo («1 / 600» con contador) y Destello (amarillo) — abajo-centro-derecha |
| **Volver a base** | 37, 86 | r ≈ 2,5 % | botón azul abajo-centro-izquierda (además del ↓ de la columna) |
| Compra rápida | 45–55, 88–92 | 4 iconos pequeños | objetos recomendados siguientes (con coste); tocar = comprar |
| **Joystick** | centro 21, 70 | r ≈ 6 % | abajo-izquierda, flotante; aro + punto |
| Nombre y nivel del jugador | sobre el campeón | «3 · Esparramador» | nivel en círculo a la izquierda de la barra |
| Barras de los monstruos/súbditos | sobre cada unidad | barra con número al fijar | |

Observaciones de jugabilidad visibles: cámara semibloqueada centrada en el jugador; jungla con **muros altos** y pasos; campamentos en claros con vegetación; el Castigo tiene cargas («1») y coste visual; recordatorio de rango «+» en la habilidad disponible; anillo de carga azul alrededor de las habilidades que se están enfriando.

## 2. Selección de campeón (captura 07)

| Elemento | Posición | Notas |
|---|---|---|
| Cabecera | 40–60, 2–9 | «LOS OPONENTES ESTÁN ELIGIENDO» + cuenta atrás «19» |
| Retratos de preselección (aliados) | 8–25, 2–7 | 5 círculos |
| Retratos de rivales | 75–92, 2–7 | 5 círculos (uno «⊘» cuando no visible) |
| **Lista de aliados** | 7–25, 15–75 | fila por jugador: hechizos (2 iconos), retrato, **posición** (CALLE CENTRAL, JUNGLA, CALLE DEL DRAGÓN, CALLE DEL BARÓN) y nombre; el propio en amarillo; icono ⇄ para intercambiar |
| **Filtros por rol** | 33–67, 13–16 | iconos: todos · tanque · luchador · asesino · mago · tirador · soporte · 🔍 buscar |
| **Rejilla de campeones** | 33–67, 19–83 | 5 columnas, retratos cuadrados con nombre debajo; el elegido con marco dorado; «⊘» = baneado/no disponible; insignia roja = recomendado; «6» = maestría |
| Jugadores rivales | 76–93, 15–75 | «Jugador 1…5» con retrato cuando eligen |
| Botón «Fijar preselección» | 84–92, 84 | |
| Barra inferior izquierda | 7–32, 92 | emoticono · perfil · chat · micro · silenciar |
| **Barra inferior derecha** | 72–92, 92 | aspecto (⬆) · runas (⊕ con «1» cuando falta configurar) · emblema · **2 hechizos** (iconos cuadrados) |

## 3. Ajustes de hechizos (captura 08)

Panel lateral derecho (60–100 % del ancho): título «AJUSTES DE HECHIZOS», «ELIGE UN HECHIZO», **9 hechizos en rejilla de 5+4** (Fantasma, Curar, Barrera, Agotar, Flash de aire/Destello, Prender, Castigo, Purificar…), y abajo los **2 elegidos** grandes. Toca uno de los dos para sustituirlo.

## 4. Sets de objetos y runas (captura 09)

Panel lateral derecho con pestañas **PERSONAL · DESTACADO · POPULAR · MEJORES JUGADORES**. Cada set: etiqueta verde, **«Popularidad: N» y «Porcentaje de victorias: NN,NN %»**, fila de **6 objetos** (con icono de «se puede cambiar» ↻ debajo), fila de **runas** (5 iconos: clave + 3 menores + 1) y los **2 hechizos**; a la derecha ⬇ descargar / ✓ seleccionado; columna lateral con el rol (jungla ⚔ / líneas).

## 5. Qué implica para Coronas de Ceniza

- HUD: recolocar según la tabla 1 (hoy: barra arriba-centro, habilidades en arco a 180°–285°). Cambios: minimapa a 15 % con ⚙ al lado; oro + objetos bajo el minimapa; retratos de aliados arriba-centro-izquierda; marcador/reloj/KDA arriba-derecha; columna derecha ✕/❗/↓/⊙; **definitiva encima del ataque** y las 3 habilidades en arco abajo-izquierda del ataque; hechizos de invocador abajo-centro-derecha; volver a base azul abajo-centro-izquierda; compra rápida abajo-centro; anillo de carga en los enfriamientos; barra del objetivo arriba-centro al fijar.
- Selección: filtros por rol, rejilla 5 columnas, lista de aliados con posición, panel de hechizos (9, elige 2), panel de **sets** (6 objetos + runas + hechizos con popularidad y % de victorias) y **runas** (clave + menores).
- Nuestro kit tiene 4 habilidades (Q/W/E/R) = 3 + definitiva, igual que Wild Rift.
