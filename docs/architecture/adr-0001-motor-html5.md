# ADR-0001: Demo jugable en HTML5/JavaScript en lugar de Godot

**Estado:** Aceptado · **Fecha:** 2026-11-02 · **GDD:** `design/gdd/*`, `production/demo-scope.md`

## Contexto
El concepto recomendaba Godot 4. En el entorno de desarrollo no hay editor de Godot, y la demo tenía que poder jugarse y verificarse ya, sin depender de una instalación.

## Decisión
La demo se implementa en JavaScript puro (Canvas 2D, sin dependencias):

- **Simulación determinista separada del render:** `game/src/core|kits|maps|ai|world.js` no usan el DOM, así que se prueban en Node.
- **Datos de juego desde la fuente única:** `tools/build_design.py` genera `game/src/data.js` a partir de `assets/data/*.json`.
- **Distribución:** `game/dist/coronas-de-ceniza.html`, un único archivo que se juega con doble clic.

## Alternativas
- **Godot 4.7:** sigue siendo la opción para la versión completa (3D, red). No se podía ejecutar ni verificar aquí.
- **Unity:** licencia y peso innecesarios para una demo.

## Consecuencias
- **Positivas:** se juega en cualquier navegador; tiene pruebas unitarias, de integración y E2E (Playwright).
- **Negativas:** el aspecto es 2D cenital simplificado y no hay red LAN (la épica E8 queda pendiente).
- **Migración a Godot:** las fórmulas, los kits y los datos son portables. Este ADR se revisará en el hito M4.

## Revisión 2026-11-02: render 3D
Se añade three.js 0.170 (`game/src/render3d.js`) con modelos glTF y esqueletos animados. La simulación sigue siendo la misma y el render 2D queda como respaldo. Los modelos definitivos se producirán en Blender: `production/handoff/BLENDER-3D-HANDOFF.md`.
