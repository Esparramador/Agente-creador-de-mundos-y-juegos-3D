"""Aspecto alternativo de Rakhar: el lagarto de Joan (lagarto.glb, 60 huesos Tripo, sin clips de combate) con
Idle/Run/Attack/Cast/Death retargeteados desde la Universal Animation Library (Quaternius, CC0) con
f_retarget_ual.py de la skill blender-personaje-rig-animacion, y después el mismo pipeline que el resto
(tinte, escala, pies clavados, puertas anti-deformación, export NLA_TRACKS, Khronos, validador, tira).

Uso (Blender 5.2, FUERA del sandbox, siempre con --python-exit-code 1):
    B=/Applications/Blender.app/Contents/MacOS/Blender
    "$B" -b --factory-startup --python-exit-code 1 --python tools/blender/retarget_lagarto.py -- [champ_rakhar_lagarto] [--sin-tira]

Receta (mapa de huesos lagarto -> UAL y clips): assets/data/model_builds.json, pack "ual_retarget".
Salida intermedia del retarget: production/qa/evidence/modelos/salida/retarget_<id>/ (informe.json, hoja de control).
"""
import bpy, os, sys, json, time, runpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import champs_kaykit as ck

F_RETARGET = os.path.join(ck.ROOT, '..', '..', 'skills', 'gamedev-blender', 'blender-personaje-rig-animacion', 'scripts', 'f_retarget_ual.py')


def construye_retarget(asset_id, con_tira=True):
    receta = ck.BUILDS['assets'][asset_id]; informe = ck.informe_base(asset_id, receta); t0 = time.time()
    try:
        sal = os.path.join(ck.SALIDA, 'retarget_' + asset_id); os.makedirs(sal, exist_ok=True)
        mapa = os.path.join(sal, 'mapa.json'); json.dump(receta['mapa'], open(mapa, 'w'), indent=1)
        fuente = ck.ruta_pack('ual'); destino = os.path.join(ck.ROOT, receta['base'])
        pedidos = sorted({v for v in receta['clips'].values()})
        # --- 1) retarget con el script verificado de la skill (misma sesión de Blender, argv propio)
        sys.argv = ['blender', '--', fuente, destino, sal, '--clips', ','.join(pedidos), '--mapa', mapa, '--nombre', asset_id, '--render'] + (['--alinear-reposo'] if receta.get('alinear', True) else [])
        runpy.run_path(os.path.abspath(F_RETARGET), run_name='__main__')
        inf_r = json.load(open(os.path.join(sal, 'informe.json'), encoding='utf-8'))
        informe['retarget'] = {k: inf_r.get(k) for k in ('huesos', 'reposos_distintos_grados_top', 'raiz_movimiento', 'reposo_alineado_grados', 'pies_clavados', 'malla_vs_rig_desvio_m', 'hoja_control', 'errores_resueltos')}
        # --- 2) pipeline común sobre el .blend que dejó el retarget
        bpy.ops.wm.open_mainfile(filepath=os.path.join(sal, asset_id + '.blend'))
        ck._cache_packs.clear(); sc = bpy.context.scene; sc.render.fps = sc.render.fps or 30
        arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE'); cuerpo = ck.mallas_con_piel(arm)
        # f_retarget desemparenta la malla; para escalar y mover todo junto vuelve a colgar del rig (misma matriz mundo)
        for m in cuerpo:
            mw = m.matrix_world.copy(); m.parent = arm; m.matrix_parent_inverse = arm.matrix_world.inverted(); m.matrix_world = mw
        bpy.context.view_layer.update()
        acciones = {}
        for t in arm.animation_data.nla_tracks:
            for st in t.strips: acciones[t.name] = st.action
        for t in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(t)
        informe['base_glb'] = {'huesos': len(arm.data.bones), 'mallas_con_piel': [m.name for m in cuerpo], 'acciones_retarget': sorted(acciones)}
        mats = {s.material for o in cuerpo for s in o.material_slots if s.material}; ck.sanea_materiales(mats, informe)
        informe['tinte'] = {'color': receta.get('tint'), 'mezcla': receta.get('tintMix', 0.3), 'materiales': ck.tintar(mats, receta.get('tint'), receta.get('tintMix', 0.3))}
        clips = ck.resuelve_clips(arm, receta, acciones, informe)
        ck.puerta_huesos(arm, informe); ck.puerta_pesos(cuerpo, informe)
        if receta.get('decimate'): ck.decimar(cuerpo, receta['decimate'], informe)
        ck.escala_y_origen(arm, cuerpo, [], ck.SPEC['assets'][asset_id]['height'], receta.get('scale', [1, 1, 1]), informe)
        ck.ajusta_caja_cruda(arm, cuerpo, informe)
        ck.clava_pies(arm, cuerpo, clips, informe)
        ck.puerta_clips(arm, cuerpo, clips, informe, False, receta.get('gates'))
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
    ids = [a for a in argv if not a.startswith('--')] or ck.ids_del_pack('ual_retarget')
    ok = all([construye_retarget(i, '--sin-tira' not in argv) for i in ids])
    print('RESULTADO', 'ok' if ok else 'con fallos')
    if not ok: raise SystemExit(1)
