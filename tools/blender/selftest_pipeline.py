"""Autoprueba del flujo Blender -> glTF -> validador -> juego (y ejemplo de rig + animación por script).

Construye un maniquí sencillo con esqueleto de 9 huesos, pinta un material PBR, crea los 5 clips
obligatorios (Idle, Run, Attack, Cast, Death) "in place", lo exporta con export_glb.py y lo valida.
NO es arte final: demuestra que el flujo funciona de punta a punta.

Uso:  python3 tools/blender/selftest_pipeline.py        (módulo bpy 4.2)   o
      blender -b -P tools/blender/selftest_pipeline.py
"""
import bpy, math, os, sys, runpy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ASSET = 'champ_kaelith'

sys.argv = [sys.argv[0], '--', ASSET]
runpy.run_path(os.path.join(HERE, 'setup_scene.py'), run_name='__main__')

model, rigc = bpy.data.collections['MODEL'], bpy.data.collections['RIG']
def link(o, col):
    for c in o.users_collection: c.objects.unlink(o)
    col.objects.link(o)

# --- esqueleto (Z arriba, mira hacia -Y) ---
arm_data = bpy.data.armatures.new('Rig'); rig = bpy.data.objects.new('Rig', arm_data); rigc.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
B = {}
def bone(n, h, t, parent=None):
    b = arm_data.edit_bones.new(n); b.head, b.tail = h, t
    if parent: b.parent = B[parent]
    B[n] = b
bone('Hips', (0, 0, 1.0), (0, 0, 1.25)); bone('Spine', (0, 0, 1.25), (0, 0, 1.7), 'Hips'); bone('Head', (0, 0, 1.7), (0, 0, 2.15), 'Spine')
for s, x in (('L', 1), ('R', -1)):
    bone(f'Arm.{s}', (0.25 * x, 0, 1.62), (0.75 * x, 0, 1.62), 'Spine')
    bone(f'Leg.{s}', (0.13 * x, 0, 1.0), (0.13 * x, 0, 0.05), 'Hips')
bpy.ops.object.mode_set(mode='OBJECT')

# --- malla por partes con pesos rígidos ---
mat = bpy.data.materials.new('M_Kaelith'); mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (0.95, 0.78, 0.35, 1); bsdf.inputs['Metallic'].default_value = 0.7; bsdf.inputs['Roughness'].default_value = 0.35
parts = [('Hips', 'cube', (0, 0, 1.1), (0.22, 0.14, 0.14)), ('Spine', 'cube', (0, 0, 1.45), (0.26, 0.16, 0.25)), ('Head', 'uv', (0, 0, 1.92), (0.2, 0.2, 0.22))]
for s, x in (('L', 1), ('R', -1)):
    parts += [(f'Arm.{s}', 'cyl_x', (0.5 * x, 0, 1.62), (0.07, 0.07, 0.26)), (f'Leg.{s}', 'cyl', (0.13 * x, 0, 0.48), (0.09, 0.09, 0.48))]
objs = []
for bname, kind, loc, sc in parts:
    if kind == 'uv': bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, location=loc)
    elif kind == 'cube': bpy.ops.mesh.primitive_cube_add(location=loc)
    else: bpy.ops.mesh.primitive_cylinder_add(vertices=16, location=loc, rotation=(0, math.radians(90), 0) if kind == 'cyl_x' else (0, 0, 0))
    o = bpy.context.object; o.scale = sc if kind != 'cyl_x' else (sc[2], sc[1], sc[0]) if False else sc
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    vg = o.vertex_groups.new(name=bname); vg.add([v.index for v in o.data.vertices], 1.0, 'REPLACE')
    o.data.materials.append(mat); objs.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); body = bpy.context.object; body.name = 'Body'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
link(body, model); body.parent = rig; mod = body.modifiers.new('Armature', 'ARMATURE'); mod.object = rig

# --- animaciones in place ---
rig.animation_data_create(); bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE')
def action(name, frames, keys):
    act = bpy.data.actions.new(name); rig.animation_data.action = act
    for f, poses in keys:
        for bn, (rx, ry, rz) in poses.items():
            pb = rig.pose.bones[bn]; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz)); pb.keyframe_insert('rotation_euler', frame=f)
    act.frame_range = (1, frames); act.use_fake_user = True; return act
Z = lambda: {b: (0, 0, 0) for b in ('Hips', 'Spine', 'Head', 'Arm.L', 'Arm.R', 'Leg.L', 'Leg.R')}
def P(**kw): d = Z(); d.update({k.replace('_', '.'): v for k, v in kw.items()}); return d
action('Idle', 60, [(1, P(Spine=(2, 0, 0), Arm_L=(0, 0, -70), Arm_R=(0, 0, 70))), (30, P(Spine=(-2, 0, 0), Arm_L=(0, 0, -66), Arm_R=(0, 0, 66))), (60, P(Spine=(2, 0, 0), Arm_L=(0, 0, -70), Arm_R=(0, 0, 70)))])
action('Run', 20, [(1, P(Leg_L=(35, 0, 0), Leg_R=(-35, 0, 0), Arm_L=(-30, 0, -70), Arm_R=(30, 0, 70), Spine=(10, 0, 0))), (10, P(Leg_L=(-35, 0, 0), Leg_R=(35, 0, 0), Arm_L=(30, 0, -70), Arm_R=(-30, 0, 70), Spine=(10, 0, 0))), (20, P(Leg_L=(35, 0, 0), Leg_R=(-35, 0, 0), Arm_L=(-30, 0, -70), Arm_R=(30, 0, 70), Spine=(10, 0, 0)))])
action('Attack', 18, [(1, P(Arm_R=(0, -60, 20))), (7, P(Arm_R=(0, -90, -40), Spine=(0, 0, 25))), (12, P(Arm_R=(0, 60, 40), Spine=(15, 0, -25))), (18, P(Arm_R=(0, 0, 70)))])
action('Cast', 20, [(1, P()), (8, P(Arm_L=(0, -80, 0), Arm_R=(0, 80, 0), Head=(-15, 0, 0))), (20, P())])
action('Death', 30, [(1, P()), (15, P(Hips=(30, 0, 0), Spine=(30, 0, 0))), (30, P(Hips=(85, 0, 0), Spine=(10, 0, 0), Arm_L=(0, 0, -20), Arm_R=(0, 0, 20)))])
bpy.ops.object.mode_set(mode='OBJECT')
path = bpy.data.filepath; bpy.ops.wm.save_as_mainfile(filepath=path)
print('Maniquí creado en', path)
runpy.run_path(os.path.join(HERE, 'export_glb.py'), run_name='__main__')
