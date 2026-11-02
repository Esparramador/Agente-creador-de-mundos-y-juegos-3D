"""Crea la escena de trabajo de un asset de Coronas de Ceniza con la configuración correcta.

Uso (Blender 4.2 LTS o superior):
    blender -b -P tools/blender/setup_scene.py -- champ_kaelith
    -> art/blender/champ_kaelith/champ_kaelith.blend

Prepara: unidades métricas (1 m = 100 u. de juego), una referencia de altura objetivo
(assets/data/model_specs.json), el suelo en y=0, la orientación (el personaje mira hacia -Y en
Blender, que es +Z en glTF), las colecciones MODEL / RIG / REF, una cámara isométrica igual a la
del juego (38°, cenital a 57°) y la iluminación de previsualización.
"""
import bpy, json, math, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SPEC = json.load(open(os.path.join(ROOT, 'assets', 'data', 'model_specs.json'), encoding='utf-8'))


def main(asset_id):
    if asset_id not in SPEC['assets']:
        raise SystemExit(f'Asset desconocido: {asset_id}. Opciones: {", ".join(SPEC["assets"])}')
    a = SPEC['assets'][asset_id]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1.0
    sc.render.fps = 30
    for name in ('MODEL', 'RIG', 'REF'):
        col = bpy.data.collections.new(name); sc.collection.children.link(col)
    ref = bpy.data.collections['REF']
    # referencia de altura (no se exporta)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=a['height'], location=(0, 0, a['height'] / 2))
    h = bpy.context.object; h.name = f'REF_altura_{a["height"]}m'; h.display_type = 'WIRE'
    for c in h.users_collection: c.objects.unlink(h)
    ref.objects.link(h)
    # flecha de "frente" (-Y en Blender = +Z en glTF)
    bpy.ops.mesh.primitive_cone_add(radius1=0.15, depth=0.4, location=(0, -0.8, 0.05), rotation=(math.radians(90), 0, 0))
    f = bpy.context.object; f.name = 'REF_frente'; f.display_type = 'WIRE'
    for c in f.users_collection: c.objects.unlink(f)
    ref.objects.link(f)
    # suelo
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0)); g = bpy.context.object; g.name = 'REF_suelo'
    for c in g.users_collection: c.objects.unlink(g)
    ref.objects.link(g)
    ref.hide_render = False
    # cámara como en el juego
    cam = bpy.data.objects.new('CAM_juego', bpy.data.cameras.new('CAM_juego')); sc.collection.objects.link(cam)
    cam.data.lens_unit = 'FOV'; cam.data.angle = math.radians(38)
    d = 6.0; cam.location = (0, -d * 0.55, d * 0.84); cam.rotation_euler = (math.radians(33), 0, 0); sc.camera = cam
    sun = bpy.data.objects.new('SUN', bpy.data.lights.new('SUN', 'SUN')); sun.data.energy = 3; sun.rotation_euler = (math.radians(50), 0, math.radians(30)); sc.collection.objects.link(sun)
    sc['ccgs_asset'] = asset_id; sc['ccgs_spec'] = json.dumps(a)
    out = os.path.join(ROOT, 'art', 'blender', asset_id); os.makedirs(out, exist_ok=True)
    path = os.path.join(out, asset_id + '.blend'); bpy.ops.wm.save_as_mainfile(filepath=path)
    print('Escena creada:', path)


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if not argv: raise SystemExit('Uso: blender -b -P tools/blender/setup_scene.py -- <asset_id>')
    main(argv[0])
