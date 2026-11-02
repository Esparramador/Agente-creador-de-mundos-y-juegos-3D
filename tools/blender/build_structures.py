"""Construye en Blender las estructuras del juego (torre, inhibidor, nexo, fuente) y el guardián.

Uso:  python3 tools/blender/build_structures.py      (o blender -b -P tools/blender/build_structures.py)
Salida: game/assets/models/src/struct_*.glb, prop_ward.glb y art/blender/structures.blend
Material «Team»: el juego lo recolorea con el color del equipo (render3d.js), así que basta un modelo
para ambos equipos. Origen en la base (z=0); medidas en metros (1 m = 100 u. de juego).
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from build_maps import Builder, cyl, box, ico, mat_vc, mat_flat, lin

def team_mat():
    m = mat_flat('Team', (255, 255, 255), rough=0.25, metal=0.2, emission=(255, 255, 255)); m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 1.5; return m

STONE, STONE2, DARK, GOLD = (150, 146, 138), (118, 114, 108), (70, 66, 62), (200, 160, 70)

def tower(B, T):
    B.add(cyl, STONE2, seg=8, r1=1.2, r2=1.05, h=0.5)                      # zócalo
    for i in range(8): a = i / 8 * 6.283; B.add(box, DARK, loc=(math.cos(a) * 1.15, math.sin(a) * 1.15, 0), rot=a, sx=0.25, sy=0.45, sz=0.65)
    B.add(cyl, STONE, loc=(0, 0, 0.5), seg=8, r1=0.8, r2=0.6, h=2.9)       # fuste
    for k in range(4): B.add(cyl, STONE2, loc=(0, 0, 0.9 + k * 0.7), seg=8, r1=0.8 - k * 0.05, r2=0.78 - k * 0.05, h=0.08)
    B.add(cyl, STONE2, loc=(0, 0, 3.4), seg=8, r1=0.7, r2=1.05, h=0.45)    # capitel
    for i in range(8): a = i / 8 * 6.283; B.add(box, STONE, loc=(math.cos(a) * 0.95, math.sin(a) * 0.95, 3.85), rot=a, sx=0.32, sy=0.25, sz=0.35)
    B.add(cyl, GOLD, loc=(0, 0, 3.85), seg=8, r1=0.55, r2=0.3, h=0.25)
    for i in range(4): a = i / 4 * 6.283 + 0.4; B.add(cyl, GOLD, loc=(math.cos(a) * 0.45, math.sin(a) * 0.45, 4.0), seg=4, r1=0.06, r2=0.0, h=0.7)
    T.add(ico, (255, 255, 255), loc=(0, 0, 4.9), scale=(0.45, 0.45, 0.75), subdiv=0, jitter=0)

def inhib(B, T):
    B.add(cyl, STONE2, seg=10, r1=1.25, r2=1.15, h=0.25)
    for i in range(4): a = i / 4 * 6.283 + 0.785; B.add(box, STONE, loc=(math.cos(a) * 1.0, math.sin(a) * 1.0, 0.25), rot=a, sx=0.35, sy=0.35, sz=1.4); B.add(cyl, GOLD, loc=(math.cos(a) * 1.0, math.sin(a) * 1.0, 1.65), seg=4, r1=0.22, r2=0, h=0.4)
    T.add(ico, (255, 255, 255), loc=(0, 0, 1.6), scale=(0.75, 0.75, 1.0), subdiv=0, jitter=0)
    T.add(cyl, (255, 255, 255), loc=(0, 0, 0.25), seg=16, r1=0.75, r2=0.75, h=0.04, jitter=0)

def nexus(B, T):
    B.add(cyl, STONE2, seg=6, r1=2.4, r2=2.2, h=0.4); B.add(cyl, STONE, loc=(0, 0, 0.4), seg=6, r1=2.0, r2=1.8, h=0.4)
    for i in range(3): a = i / 3 * 6.283; B.add(cyl, STONE, loc=(math.cos(a) * 1.6, math.sin(a) * 1.6, 0.8), seg=6, r1=0.3, r2=0.18, h=3.2); B.add(cyl, GOLD, loc=(math.cos(a) * 1.6, math.sin(a) * 1.6, 4.0), seg=6, r1=0.25, r2=0, h=0.5)
    T.add(ico, (255, 255, 255), loc=(0, 0, 2.7), scale=(1.2, 1.2, 1.9), subdiv=0, jitter=0)
    for i in range(6): a = i / 6 * 6.283; T.add(ico, (255, 255, 255), loc=(math.cos(a) * 1.0, math.sin(a) * 1.0, 1.0), scale=(0.25, 0.25, 0.5), subdiv=0, jitter=0)

def fountain(B, T):
    B.add(cyl, STONE2, seg=24, r1=2.6, r2=2.5, h=0.3)
    for i in range(12): a = i / 12 * 6.283; B.add(box, STONE, loc=(math.cos(a) * 2.35, math.sin(a) * 2.35, 0.3), rot=a, sx=0.3, sy=1.2, sz=0.35)
    B.add(cyl, STONE, loc=(0, 0, 0.3), seg=8, r1=0.5, r2=0.3, h=2.2)
    T.add(cyl, (255, 255, 255), loc=(0, 0, 0.3), seg=24, r1=2.0, r2=2.0, h=0.05, jitter=0)
    T.add(ico, (255, 255, 255), loc=(0, 0, 2.9), scale=(0.4, 0.4, 0.6), subdiv=0, jitter=0)

def ward(B, T):
    B.add(cyl, DARK, seg=6, r1=0.05, r2=0.04, h=0.75); B.add(cyl, GOLD, loc=(0, 0, 0.7), seg=6, r1=0.12, r2=0.16, h=0.08)
    T.add(ico, (255, 255, 255), loc=(0, 0, 0.88), scale=(0.11, 0.11, 0.14), subdiv=1, jitter=0)

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    stone = mat_vc('Piedra', rough=0.8); tm = team_mat()
    for i, (name, fn) in enumerate([('struct_tower', tower), ('struct_inhib', inhib), ('struct_nexus', nexus), ('struct_fountain', fountain), ('prop_ward', ward)]):
        coll = bpy.data.collections.new(name); bpy.context.scene.collection.children.link(coll)
        B, T = Builder(name + '_piedra'), Builder(name + '_equipo'); fn(B, T)
        a, b = B.obj(stone, coll), T.obj(tm, coll)
        bpy.ops.object.select_all(action='DESELECT'); a.select_set(True); b.select_set(True)
        out = os.path.join(ROOT, 'game', 'assets', 'models', 'src', name + '.glb')
        bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_vertex_color='ACTIVE', export_animations=False)
        for o in (a, b): o.location.x += i * 6  # separadas en la escena de trabajo
        print('Exportado', out)
    os.makedirs(os.path.join(ROOT, 'art', 'blender'), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'art', 'blender', 'structures.blend'))

if __name__ == '__main__':
    main()
