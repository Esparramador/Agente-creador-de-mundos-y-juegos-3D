# Mi Estudio de Juegos

Estudio de desarrollo de videojuegos con IA, basado en
[Claude Code Game Studios](https://github.com/donchitos/claude-code-game-studios) v1.2.0 (licencia MIT).

## Qué incluye
- **49 agentes**: directores, jefes de departamento, especialistas y especialistas por motor (Godot, Unity, Unreal).
- **74 skills**: comandos `/` para diseño, arquitectura, sprints, QA y lanzamiento.
- **15 hooks** que validan commits, escrituras, lecturas y assets, y bloquean comandos destructivos.
- **14 reglas** de código y **62 plantillas** de documentos.
- **Batería de pruebas** `studio-tests/run_capability_tests.py` (263 comprobaciones), que se ejecuta en CI en cada push.

## Proyecto: «Coronas de Ceniza» (demo MOBA)
- Concepto: `design/gdd/game-concept.md` · Índice de sistemas: `design/gdd/systems-index.md`
- 15 campeones: `design/gdd/champion-roster.md` (generado) y `assets/data/champions.json`
- 3 mapas: `design/gdd/maps.md` y `assets/data/maps.json` · Objetos: `assets/data/items.json`
- Dinámicas y flujo de partida: `design/gdd/match-flow.md`, `combat-core.md`, `progression-economy.md`
- Interfaz: `ui-hud-controls.md` · IA de bots: `bots-ai.md` · Alcance e hitos: `production/demo-scope.md`, `production/epics/EPICS.md`
- Para editar campeones: `tools/champions_src.py` y luego `python3 tools/build_design.py`

## Cómo empezar
```bash
npm i -g @anthropic-ai/claude-code
cd mi-estudio-de-juegos && claude
/start          # te guía para elegir la idea, el motor y el flujo de trabajo
```

## Pruebas
```bash
python3 studio-tests/run_capability_tests.py          # estructura, hooks, permisos y flujo de trabajo
python3 studio-tests/run_capability_tests.py --live   # añade pruebas con la IA real (requiere el CLI claude)
```
