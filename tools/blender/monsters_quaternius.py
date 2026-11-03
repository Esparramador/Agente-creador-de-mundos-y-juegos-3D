"""Construye monstruos de campamento, épicos y el cuerpo bestial de Rakhar sobre los packs animados de
Quaternius (CC0, itch.io oficial) en assets-libres/quaternius/: importa el FBX, se queda con el esqueleto
con piel, renombra los clips al contrato del juego, limita a 4 influencias, escala a la altura de
model_specs.json, pone el origen en los pies, gira (yaw) para mirar a -Y, tinta, pasa las puertas
anti-deformación y exporta a game/assets/models/final/<id>.glb. Reutiliza champs_kaykit.py.

Uso (Blender 5.2, FUERA del sandbox, siempre con --python-exit-code 1):
    B=/Applications/Blender.app/Contents/MacOS/Blender
    "$B" -b --factory-startup --python-exit-code 1 --python tools/blender/monsters_quaternius.py -- <id|all> [--sin-tira]

Receta: assets/data/model_builds.json (pack "quaternius"). Informe: production/qa/evidence/modelos/salida/<id>.json.
Clip ausente: si es obligatorio se aborta; si no, queda registrado en clips_ausentes. >80 huesos: se registra y se
aborta (ningún modelo de estos packs pasa de 39, así que la fusión de huesos no hizo falta).
"""
import bpy, os, sys, math, time, json
from mathutils import Vector, Euler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import champs_kaykit as ck


def construye_quaternius(asset_id, con_tira=True):
    receta = ck.BUILDS['assets'][asset_id]; informe = ck.informe_base(asset_id, receta); t0 = time.time()
    try:
        sc = ck.reset()
        ruta = os.path.join(ck.ruta_pack('quaternius'), receta['base'])
        if not os.path.exists(ruta): raise ck.Abort(f'no existe {ruta}')
        objs, acciones = ck.importa(ruta)
        arm = ck.armadura_de(objs); cuerpo = ck.mallas_con_piel(arm)
        if not cuerpo: raise ck.Abort('el esqueleto no tiene mallas con piel')
        # FBX: a veces hay una segunda armadura vacía o padres con transformación: la principal queda suelta con su matriz
        if arm.parent is not None:
            mw = arm.matrix_world.copy(); arm.parent = None; arm.matrix_world = mw
        for o in objs:
            if o not in cuerpo and o is not arm and o.type != 'EMPTY':
                bpy.data.objects.remove(o, do_unlink=True)
        for o in list(bpy.data.objects):
            if o.type == 'EMPTY' and not any(c for c in o.children): bpy.data.objects.remove(o, do_unlink=True)
        informe['base_fbx'] = {'canales_objeto_quitados': ck.informe_import.get('canales_objeto_quitados'), 'huesos': len(arm.data.bones), 'nombres_huesos': [b.name for b in arm.data.bones], 'acciones': sorted(acciones), 'mallas_con_piel': [m.name for m in cuerpo],
                               'fps_escena': sc.render.fps}
        # Rotación para mirar a -Y
        if receta.get('yaw'): arm.rotation_euler.z += math.radians(receta['yaw'])
        # Tinte sobre los materiales planos de Quaternius
        mats = {s.material for o in cuerpo for s in o.material_slots if s.material}; ck.sanea_materiales(mats, informe)
        informe['tinte'] = {'color': receta.get('tint'), 'mezcla': receta.get('tintMix', 0.5), 'materiales': ck.tintar(mats, receta.get('tint'), receta.get('tintMix', 0.5), receta.get('emissive', 0.0))}
        clips = ck.resuelve_clips(arm, receta, acciones, informe)
        ck.puerta_huesos(arm, informe); ck.puerta_pesos(cuerpo, informe)
        if receta.get('decimate'): ck.decimar(cuerpo, receta['decimate'], informe)
        ck.escala_y_origen(arm, cuerpo, [], ck.SPEC['assets'][asset_id]['height'], receta.get('scale', [1, 1, 1]), informe)
        # FBX: la malla lleva matrix_parent_inverse con traslación; el exportador escribe solo la base local y el nodo del glb
        # queda desplazado respecto a Blender (el validador veía la caja 5-25 cm bajo el suelo). Se hornea en la base.
        for m in cuerpo:
            m.matrix_basis = m.matrix_parent_inverse @ m.matrix_basis; m.matrix_parent_inverse = ck.Matrix.Identity(4)
        bpy.context.view_layer.update()
        ck.ajusta_caja_cruda(arm, cuerpo, informe)
        ck.clava_pies(arm, cuerpo, clips, informe, receta.get('flying', False))
        ck.puerta_clips(arm, cuerpo, clips, informe, receta.get('flying', False), receta.get('gates'))
        ck.pistas_nla(arm, clips); ck.limpia_acciones(clips)
        out = ck.exporta(asset_id, [ck.raiz_de(arm), arm] + cuerpo, informe)
        ck.comprobaciones_externas(out, asset_id, informe)
        if con_tira: ck.tira(asset_id, arm, clips, ck.SPEC['assets'][asset_id]['height'], informe)
        informe['estado'] = 'ok'
    except ck.Abort as e:
        informe['estado'] = 'abortado'; informe['motivo'] = str(e)
        glb = os.path.join(ck.FINAL, asset_id + '.glb')
        if os.path.exists(glb) and informe.get('glb'): os.remove(glb)
    informe['segundos'] = round(time.time() - t0, 1)
    ck.guarda_informe(asset_id, informe)
    print(f"[{informe['estado'].upper()}] {asset_id} {informe.get('motivo', '')} ({informe['segundos']} s)")
    return informe['estado'] == 'ok'


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if not argv: raise SystemExit(__doc__)
    ids = ck.ids_del_pack('quaternius') if argv[0] == 'all' else argv[0].split(',')
    ok = all([construye_quaternius(i, '--sin-tira' not in argv) for i in ids])
    print('RESULTADO', 'ok' if ok else 'con fallos')
    if not ok: raise SystemExit(1)
