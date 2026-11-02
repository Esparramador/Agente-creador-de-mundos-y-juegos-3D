"""Renderiza una hoja de previsualización (4 vistas + fotogramas clave de cada clip) como evidencia de QA.

Uso:
    blender -b art/blender/champ_kaelith/champ_kaelith.blend -P tools/blender/render_preview.py
    -> production/qa/evidence/models/champ_kaelith_<vista|clip>.png
"""
import bpy, os, math

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def main():
    sc = bpy.context.scene; asset = sc.get('ccgs_asset') or os.path.splitext(os.path.basename(bpy.data.filepath))[0]
    out = os.path.join(ROOT, 'production', 'qa', 'evidence', 'models'); os.makedirs(out, exist_ok=True)
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 768, 768; sc.render.film_transparent = True
    ref = bpy.data.collections.get('REF')
    if ref: ref.hide_render = True
    cam = sc.camera
    rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
    for name, ang in (('frente', 0), ('lado', 90), ('espalda', 180), ('juego', None)):
        if ang is None: cam.location = (0, -3.3, 5.0); cam.rotation_euler = (math.radians(33), 0, 0)
        else:
            r = 4.5; a = math.radians(ang); cam.location = (math.sin(a) * r, -math.cos(a) * r, 1.3); cam.rotation_euler = (math.radians(85), 0, a)
        sc.render.filepath = os.path.join(out, f'{asset}_{name}.png'); bpy.ops.render.render(write_still=True)
    if rig and rig.animation_data is not None:
        for act in bpy.data.actions:
            rig.animation_data.action = act; s, e = map(int, act.frame_range)
            for i, f in enumerate((s, (s + e) // 2, e)):
                sc.frame_set(f); sc.render.filepath = os.path.join(out, f'{asset}_{act.name}_{i}.png'); bpy.ops.render.render(write_still=True)
    print('Previsualizaciones en', out)


if __name__ == '__main__':
    main()
