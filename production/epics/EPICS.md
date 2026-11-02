# Épicas e historias iniciales

## E1 Combate base (M1)
- S1.1 Estadísticas y fórmula de mitigación (`combat-core.md` §Formulas). **Aceptación:** prueba unitaria 100 de daño contra 100 de armadura = 50.
- S1.2 Ataque básico con preparación (windup) y cancelación por movimiento.
- S1.3 Sistema de CC con tenacidad y regla de no acumulación.
- S1.4 Muerte, reaparición y recompensas.
- S1.5 Carga de `assets/data/champions.json` y creación de habilidades a partir de los datos.

## E2 Campeones (M1→M3)
- S2.1-S2.15 Un campeón por historia. **Aceptación:** su kit coincide con `champion-roster.md` y supera `tools/build_design.py --check`.

## E3 Mapa Grieta de Ceniza (M1→M2)
- S3.1 Blockout y malla de navegación.
- S3.2 Torres, inhibidores y Nexo.
- S3.3 Oleadas de súbditos.
- S3.4 Campamentos de jungla y bonus.
- S3.5 Dragones con cambio de terreno.
- S3.6 Heraldo y Señor.

## E4 Economía (M2)
- S4.1 XP y niveles.
- S4.2 Oro y recompensas.
- S4.3 Tienda e inventario.
- S4.4 12 objetos desde `items.json`.

## E5 Interfaz y controles (M2→M4)
- S5.1 HUD.
- S5.2 Minimapa y señales.
- S5.3 Tienda.
- S5.4 Pantalla final.
- S5.5 Reasignación de teclas.
- S5.6 Accesibilidad.

## E6 IA de bots (M1→M3)
- S6.1 Capa táctica.
- S6.2 Capa estratégica.
- S6.3 Dificultades.
- S6.4 Guiones por campeón.

## E7 Mapas extra (M3)
- S7.1 Puente de la Niebla con las reglas ARAM.
- S7.2 Ruinas del Eclipse con altares y puntos.

## E8 Red LAN (M4)
- S8.1 ADR de la arquitectura autoritativa.
- S8.2 Sincronización de estado.
- S8.3 Reconexión.
