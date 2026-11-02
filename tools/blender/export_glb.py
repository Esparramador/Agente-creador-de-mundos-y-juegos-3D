"""Exporta el .blend de un asset a glTF binario listo para el juego y lo valida.

Uso:
    blender -b art/blender/champ_kaelith/champ_kaelith.blend -P tools/blender/export_glb.py
    -> game/assets/models/final/champ_kaelith.glb (+ validación con game/tools/validate_models.mjs)

Reglas (production/handoff/BLENDER-3D-HANDOFF.md §4):
  * Solo se exportan las colecciones MODEL y RIG (REF nunca).
  * Las acciones se exportan como clips con el nombre de la acción: deben llamarse Idle, Run, Attack,
    Cast, Death (+ Attack2, Cast_Q, Cast_W, Cast_E, Cast_R, Hit, Recall, Victory, Taunt).
    Si se usan otros nombres, se renombran con ACTION_ALIASES.
  * Animaciones "in place" (sin desplazamiento de la raíz): el juego mueve la unidad.
  * Transformaciones aplicadas, origen en los pies (z=0 en Blender), mira hacia -Y.
"""
import bpy, os, sys, subprocess, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ACTION_ALIASES = {
    'idle': 'Idle', 'run': 'Run', 'running': 'Run', 'walk': 'Run', 'attack': 'Attack', 'attack1': 'Attack', 'attack_1': 'Attack',
    'attack2': 'Attack2', 'cast': 'Cast', 'spell': 'Cast', 'death': 'Death', 'die': 'Death', 'hit': 'Hit', 'recall': 'Recall',
    'victory': 'Victory', 'taunt': 'Taunt', 'cast_q': 'Cast_Q', 'cast_w': 'Cast_W', 'cast_e': 'Cast_E', 'cast_r': 'Cast_R',
    'roar': 'Roar', 'spawn': 'Spawn', 'destroy': 'Destroy',
}


def main():
    sc = bpy.context.scene
    asset_id = sc.get('ccgs_asset') or os.path.splitext(os.path.basename(bpy.data.filepath))[0]
    for act in bpy.data.actions:
        key = act.name.lower().replace(' ', '_').split('|')[-1]
        if key in ACTION_ALIASES and act.name != ACTION_ALIASES[key]: act.name = ACTION_ALIASES[key]
        act.use_fake_user = True
    # seleccionar solo MODEL y RIG
    bpy.ops.object.select_all(action='DESELECT')
    for name in ('MODEL', 'RIG'):
        col = bpy.data.collections.get(name)
        if col:
            for o in col.all_objects: o.select_set(True)
    sel = [o for o in bpy.context.selected_objects]
    if not sel: raise SystemExit('No hay objetos en las colecciones MODEL/RIG')
    # comprobar origen en los pies
    min_z = min((o.matrix_world @ v.co).z for o in sel if o.type == 'MESH' for v in o.data.vertices)
    if abs(min_z) > 0.02: print(f'AVISO: la malla empieza en z={min_z:.3f}; el origen debe estar en los pies (z=0)')
    out_dir = os.path.join(ROOT, 'game', 'assets', 'models', 'final'); os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, asset_id + '.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
                              export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True, export_frame_step=1,
                              export_skins=True, export_all_influences=False, export_morph=True, export_cameras=False, export_lights=False,
                              export_image_format='AUTO', export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT')
    print('Exportado:', out)
    r = subprocess.run(['node', os.path.join(ROOT, 'game', 'tools', 'validate_models.mjs'), out, '--as', asset_id], capture_output=True, text=True)
    print(r.stdout or r.stderr)
    if r.returncode != 0: raise SystemExit('El modelo NO cumple la especificación; corrige los ERRORES antes de integrarlo.')


if __name__ == '__main__':
    main()
