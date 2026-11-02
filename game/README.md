# Coronas de Ceniza — demo jugable (3D)

## Jugar
Abre `game/dist/coronas-de-ceniza.html` en el navegador (doble clic; no requiere servidor).

En desarrollo: `python3 -m http.server` desde `game/` y abre `http://localhost:8000`.

## Gráficos 3D
Usa three.js con modelos glTF reales de los repos del autor (KayKit CC0, dragón, bustos, lagarto). Las unidades están animadas y hay sombras y niebla de guerra. Si no hay WebGL o se desactiva en Opciones, el juego pasa a 2D. Asignación de modelos: `src/models.js`. Modelos definitivos con Blender: `production/handoff/BLENDER-3D-HANDOFF.md`.

## Contenido
- 15 campeones con pasiva y 4 habilidades.
- 3 mapas: Grieta 5v5, Puente ARAM 5v5 y Ruinas 3v3 dominio, más un tutorial.
- Bots en 3 dificultades, 12 objetos y 7 hechizos de invocador.
- Súbditos, torres, inhibidores, jungla y objetivos épicos (dragones con cambio de terreno, Heraldo, Señor y Avatar).
- Visión, matorrales y guardianes; HUD, minimapa, tienda, marcador y opciones (lanzamiento rápido, modo daltónico, escala de interfaz, volumen, reasignación de teclas).
- Rendición y pantalla final con gráfico de oro.

## Construir y probar
```bash
python3 tools/build_design.py          # datos -> game/src/data.js
node game/tools/bundle.mjs             # -> game/dist/coronas-de-ceniza.html
node --test game/tests/game.test.mjs   # 77 pruebas: fórmulas, 60 habilidades, sistemas, 3 partidas completas
python3 game/tests/e2e_browser.py      # 35 comprobaciones en Chromium real (3D + 2D) + capturas
node game/tools/validate_models.mjs --current   # informe de los modelos 3D
```

## Código
| Archivo | Contenido |
|---|---|
| `src/core.js` | Combate |
| `src/kits.js` | Campeones |
| `src/maps.js` | Mapas |
| `src/world.js` | Partida |
| `src/ai.js` | Bots |
| `src/render3d.js` | Render 3D (three.js) |
| `src/models.js` | Qué modelo usa cada unidad |
| `src/render.js` | HUD, minimapa y modo 2D |
| `src/main.js` | Menús y controles |
