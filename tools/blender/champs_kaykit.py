"""Construye los campeones y súbditos definitivos sobre los personajes KayKit (CC0) con sus armas
reales, props, tinte, escala y los clips del juego (los del propio glb + KayKit Character
Animations 1.1), pasa las puertas anti-deformación y exporta a game/assets/models/final/<id>.glb.

Uso (Blender 5.2, FUERA del sandbox, siempre con --python-exit-code 1):
    B=/Applications/Blender.app/Contents/MacOS/Blender
    "$B" -b --factory-startup --python-exit-code 1 --python tools/blender/champs_kaykit.py -- <id|all> [--sin-tira] [--solo-informe]

Receta por asset: assets/data/model_builds.json (pack "kaykit"). Altura objetivo: assets/data/model_specs.json.
Salida por modelo:
    game/assets/models/final/<id>.glb                      modelo (NLA_TRACKS, +Y arriba, origen en los pies, mira a +Z)
    production/qa/evidence/modelos/<id>.png                tira: reposo frente · reposo lado · Idle · Run · Attack · Cast · Death
    production/qa/evidence/modelos/salida/<id>.json        informe con todas las medidas y el resultado de cada puerta

Puertas (abortan el modelo y quedan registradas en el informe):
    1. 0 vértices sin peso.                 2. ≤ 4 influencias por vértice (se limita y normaliza; se registra).
    3. Caja envolvente (diagonal, malla con piel evaluada) de cada clip dentro de ±15 % de la de reposo.
    4. Suela a ±1 cm del suelo en Idle y Run (salvo voladores).   5. ≤ 80 huesos.   6. Khronos 0 errores.
Las funciones comunes (puertas, tira, export, informe) las reutilizan monsters_quaternius.py y retarget_lagarto.py.
"""
import bpy, bmesh, json, math, os, sys, time, subprocess, shutil
from mathutils import Matrix, Vector, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
BUILDS = json.load(open(os.path.join(ROOT, 'assets', 'data', 'model_builds.json'), encoding='utf-8'))
SPEC = json.load(open(os.path.join(ROOT, 'assets', 'data', 'model_specs.json'), encoding='utf-8'))
FINAL = os.path.join(ROOT, 'game', 'assets', 'models', 'final')
EVID = os.path.join(ROOT, 'production', 'qa', 'evidence', 'modelos')
SALIDA = os.path.join(EVID, 'salida')
NODE = shutil.which('node') or os.path.expanduser('~/.local/bin/node')
COMPROBAR = os.path.join(ROOT, '..', '..', 'skills', 'gamedev-blender', 'blender-pipeline-juego', 'scripts', 'comprobar_glb.mjs')
GATES = BUILDS['gates']
# validate_models.mjs solo ejecuta su bloque principal si import.meta.url == 'file://' + argv[1]; con espacios en la ruta
# (Agente J.Bond) la URL va codificada (%20) y nunca coincide: sale 0 sin validar nada. Se usan sus funciones exportadas.
ANALIZA_JS = '''import { pathToFileURL } from "node:url";
const m = await import(pathToFileURL(%r).href); console.log(m.analyze(process.argv[process.argv.length - 1]).minY);''' % os.path.abspath(os.path.join(ROOT, 'game', 'tools', 'validate_models.mjs'))
VALIDADOR_JS = '''import { pathToFileURL } from "node:url";
const [file, id] = process.argv.slice(-2);
const m = await import(pathToFileURL(%r).href);
const info = m.analyze(file), r = m.check(info, id);
console.log(`${r.errors.length ? "✗" : "✓"} ${info.file} como ${id} · ${info.tris} tris · ${info.height} m · ${info.bones} huesos · clips: ${info.clips.join(", ")}`);
for (const e of r.errors) console.log("    ERROR  " + e); for (const w of r.warnings) console.log("    aviso  " + w);
process.exit(r.errors.length ? 1 : 0);''' % os.path.abspath(os.path.join(ROOT, 'game', 'tools', 'validate_models.mjs'))
CLIP_ORDER = ['Idle', 'Run', 'Attack', 'Cast', 'Death']


def ruta_pack(nombre):
    p = BUILDS['packs'][nombre]
    return p if os.path.isabs(p) else os.path.normpath(os.path.join(ROOT, p))


class Abort(Exception):
    pass


# ---------------------------------------------------------------- utilidades de escena
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _cache_packs.clear()                      # las acciones del pack extra mueren con la escena anterior
    sc = bpy.context.scene
    sc.render.fps = 30
    return sc


informe_import = {}


def fcurves_de(act):
    if hasattr(act, 'fcurves') and len(getattr(act, 'fcurves', [])): return list(act.fcurves)
    out = []
    for capa in getattr(act, 'layers', []):
        for tira in capa.strips:
            for cb in tira.channelbags: out.extend(cb.fcurves)
    return out


def _quita_fcurve(act, fc):
    if hasattr(act, 'fcurves') and len(getattr(act, 'fcurves', [])):
        act.fcurves.remove(fc); return
    for capa in act.layers:
        for tira in capa.strips:
            for cb in tira.channelbags:
                if fc in list(cb.fcurves): cb.fcurves.remove(fc); return


def importa(path):
    """Importa un glb/gltf/fbx y devuelve (objetos nuevos, acciones nuevas {nombre_original: acción}).
    Quita de las acciones los canales que no son de huesos (ver dentro)."""
    antes_o = set(o.name for o in bpy.data.objects); antes_a = set(a.name for a in bpy.data.actions)
    if path.lower().endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=path, ignore_leaf_bones=True, automatic_bone_orientation=False, use_anim=True)
    else:
        bpy.ops.import_scene.gltf(filepath=path)
    objs = [o for o in bpy.data.objects if o.name not in antes_o]
    acts = {}; canales_objeto = 0
    for a in bpy.data.actions:
        if a.name in antes_a: continue
        # FBX: la acción trae también canales de transformación del OBJETO armature (location/rotation/scale). Al
        # exportar las pistas NLA, esos canales pisan la escala, el giro y la posición que fija el pipeline (el Trex
        # salía con scale 3 y el dragón sin escala). Solo se conservan los canales de pose.bones.
        for fc in list(fcurves_de(a)):
            if not fc.data_path.startswith('pose.bones'):
                try: (fc.id_data if False else None); _quita_fcurve(a, fc); canales_objeto += 1
                except Exception: pass
    informe_import['canales_objeto_quitados'] = canales_objeto
    for a in bpy.data.actions:
        if a.name in antes_a: continue
        nombre = a.name.split('|')[-1]                       # FBX: 'Armature|Armature|Clip'
        if nombre.endswith('.001') or nombre.endswith('.002') or nombre.endswith('.003'): nombre = nombre.rsplit('.', 1)[0]
        acts[nombre] = a
    # el importador glTF crea una icosfera por armadura (forma de hueso): fuera
    for o in list(objs):
        if o.type == 'MESH' and o.name.startswith('Icosphere'):
            bpy.data.objects.remove(o, do_unlink=True); objs.remove(o)
    return objs, acts


def armadura_de(objs):
    arms = [o for o in objs if o.type == 'ARMATURE']
    if not arms: raise Abort('el archivo no trae esqueleto')
    def pesada(a): return sum(1 for o in objs if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == a for m in o.modifiers))
    return max(arms, key=lambda a: (pesada(a), len(a.data.bones)))


def mallas_con_piel(arm):
    return [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == arm for m in o.modifiers)]


def poner_accion(arm, act):
    arm.animation_data_create()
    arm.animation_data.action = act
    if act is not None and hasattr(act, 'slots') and len(act.slots):
        arm.animation_data.action_slot = act.slots[0]


def pose_reposo(arm):
    poner_accion(arm, None)
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)


def rango(act):
    f0, f1 = act.frame_range
    return int(round(f0)), int(round(f1))


import numpy as np


def puntos_evaluados(mallas):
    """Vértices de las mallas EVALUADAS (con piel) en el mundo."""
    dg = bpy.context.evaluated_depsgraph_get(); out = []
    for m in mallas:
        ev = m.evaluated_get(dg); me = ev.to_mesh()
        if len(me.vertices):
            co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co)
            co = co.reshape(-1, 3); mw = np.array(ev.matrix_world, dtype=np.float32)
            out.append(co @ mw[:3, :3].T + mw[:3, 3])
        ev.to_mesh_clear()
    return np.concatenate(out) if out else np.zeros((0, 3), dtype=np.float32)


def caja(mallas):
    p = puntos_evaluados(mallas)
    if not len(p): return None
    return p.min(axis=0), p.max(axis=0)


def hexcolor(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def srgb_a_lineal(c):
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ---------------------------------------------------------------- materiales
def tintar(materiales, tint, mix, emissive=0.0):
    """Mezcla el color `tint` (hex) al `mix` en el color base de cada material (textura o color plano)."""
    if not tint and not emissive: return 0
    col = srgb_a_lineal(hexcolor(tint)) + (1.0,) if tint else None
    n = 0
    for mat in materiales:
        if not mat or not mat.use_nodes: continue
        bsdf = next((nd for nd in mat.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf: continue
        if col:
            entrada = bsdf.inputs['Base Color']
            if entrada.is_linked:
                origen = entrada.links[0].from_socket
                mixn = mat.node_tree.nodes.new('ShaderNodeMix'); mixn.data_type = 'RGBA'; mixn.blend_type = 'MIX'
                mixn.inputs['Factor'].default_value = mix
                mat.node_tree.links.new(origen, mixn.inputs[6])
                mixn.inputs[7].default_value = col
                for l in list(entrada.links): mat.node_tree.links.remove(l)
                mat.node_tree.links.new(mixn.outputs[2], entrada)
            else:
                base = entrada.default_value
                entrada.default_value = tuple(base[i] * (1 - mix) + col[i] * mix for i in range(3)) + (1.0,)
        if emissive:
            bsdf.inputs['Emission Color'].default_value = col or (1, 1, 1, 1)
            bsdf.inputs['Emission Strength'].default_value = emissive
        n += 1
    return n


def sanea_materiales(materiales, informe=None):
    """El importador FBX deja los materiales de Quaternius con alpha 0 y mezcla HASHED: el glb sale alphaMode MASK con
    alpha 0 y el modelo es INVISIBLE (en Blender y en el juego). Alpha 1, opaco y fuera los mapas normales sin imagen."""
    n = 0
    for mat in materiales:
        if not mat or not mat.use_nodes: continue
        bsdf = next((nd for nd in mat.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf: continue
        c = bsdf.inputs['Base Color'].default_value; bsdf.inputs['Base Color'].default_value = (c[0], c[1], c[2], 1.0)
        for l in list(bsdf.inputs['Alpha'].links): mat.node_tree.links.remove(l)
        bsdf.inputs['Alpha'].default_value = 1.0; mat.blend_method = 'OPAQUE'
        try: mat.surface_render_method = 'DITHERED'
        except Exception: pass
        for nd in [x for x in mat.node_tree.nodes if x.type == 'NORMAL_MAP' and not any(l.from_node.type == 'TEX_IMAGE' for i in x.inputs for l in i.links)]:
            mat.node_tree.nodes.remove(nd)
        n += 1
    if informe is not None: informe['materiales_saneados'] = n
    return n


def material_simple(nombre, color, metal=0.0, emissive=0.0, alpha=1.0):
    mat = bpy.data.materials.new(nombre); mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']; c = srgb_a_lineal(hexcolor(color)) + (1.0,)
    bsdf.inputs['Base Color'].default_value = c; bsdf.inputs['Metallic'].default_value = metal; bsdf.inputs['Roughness'].default_value = 0.55
    if emissive: bsdf.inputs['Emission Color'].default_value = c; bsdf.inputs['Emission Strength'].default_value = emissive
    if alpha < 1:
        bsdf.inputs['Alpha'].default_value = alpha; mat.blend_method = 'BLEND'; mat.surface_render_method = 'BLENDED'
    return mat


# ---------------------------------------------------------------- props
def construye_prop(spec, arm):
    """Una malla por prop (varias primitivas unidas), con material por pieza, en el marco del nodo `ref`
    (un prop real del glb, capturado antes de borrarlo) o de un hueso ('@hueso' = cola del hueso)."""
    partes = []
    for i, p in enumerate(spec['parts']):
        sh = p['shape']; sz = p.get('size', [1, 1, 1])
        if sh == 'box': bpy.ops.mesh.primitive_cube_add(size=1)
        elif sh == 'cylinder': bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, vertices=12)
        elif sh == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=0, depth=1, vertices=12)
        elif sh == 'sphere': bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=12, ring_count=8)
        elif sh == 'plane': bpy.ops.mesh.primitive_plane_add(size=1)
        elif sh == 'torus': bpy.ops.mesh.primitive_torus_add(major_radius=sz[0], minor_radius=sz[1], major_segments=24, minor_segments=8)
        else: raise Abort(f'forma de prop desconocida: {sh}')
        o = bpy.context.object
        if sh == 'torus':
            arc = p.get('arc', 360)
            if arc < 360:                       # arco de `arc` grados centrado en el ángulo arc_center (0 = +X, 90 = +Y)
                bm = bmesh.new(); bm.from_mesh(o.data); c = math.radians(p.get('arc_center', 0)); half = math.radians(arc / 2)
                def fuera(v):
                    a = math.atan2(v.co.y, v.co.x) - c; a = (a + math.pi) % (2 * math.pi) - math.pi; return abs(a) > half
                bmesh.ops.delete(bm, geom=[v for v in bm.verts if fuera(v)], context='VERTS'); bm.to_mesh(o.data); bm.free()
            o.scale = (1, 1, 1)
        else:
            o.scale = Vector(sz)
        o.rotation_euler = Euler([math.radians(a) for a in p.get('rot', [0, 0, 0])], 'XYZ')
        o.location = Vector(p.get('loc', [0, 0, 0]))
        o.data.materials.append(material_simple(f"{spec['name']}_{i}", p.get('color', '#888888'), p.get('metal', 0.0), p.get('emissive', 0.0), p.get('alpha', 1.0)))
        bpy.ops.object.shade_flat()
        partes.append(o)
    me = bpy.data.meshes.new(spec['name']); prop = bpy.data.objects.new(spec['name'], me); bpy.context.scene.collection.objects.link(prop)
    bpy.ops.object.select_all(action='DESELECT')
    for o in partes: o.select_set(True)
    prop.select_set(True); bpy.context.view_layer.objects.active = prop
    bpy.ops.object.join()
    return prop


def engancha(obj, arm, marco):
    """Cuelga `obj` del hueso que dice `marco` con el mismo marco que tenía el nodo de referencia."""
    obj.parent = arm; obj.parent_type = 'BONE'; obj.parent_bone = marco['bone']
    obj.matrix_parent_inverse = marco['inv'].copy()
    obj.matrix_basis = marco['basis'] @ obj.matrix_basis


def marco_de(obj):
    return {'bone': obj.parent_bone, 'inv': obj.matrix_parent_inverse.copy(), 'basis': obj.matrix_basis.copy()}


def marco_hueso(arm, hueso):
    if hueso not in arm.data.bones: raise Abort(f'el hueso {hueso} no existe')
    return {'bone': hueso, 'inv': Matrix.Identity(4), 'basis': Matrix.Identity(4)}


# ---------------------------------------------------------------- clips
def concatena(arm, acciones, nombre):
    """Nueva acción = acciones[0] seguida de acciones[1]… muestreando la pose fotograma a fotograma."""
    nueva = bpy.data.actions.new(nombre); destino = 0
    for act in acciones:
        f0, f1 = rango(act)
        for fr in range(f0, f1 + 1):
            poner_accion(arm, act); bpy.context.scene.frame_set(fr)
            pose = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in arm.pose.bones}
            poner_accion(arm, nueva)
            for pb in arm.pose.bones:
                l, q, s = pose[pb.name]; pb.location, pb.rotation_quaternion, pb.scale = l, q, s
                pb.keyframe_insert('location', frame=destino, group=pb.name); pb.keyframe_insert('rotation_quaternion', frame=destino, group=pb.name)
            destino += 1
    poner_accion(arm, None)
    return nueva


def compat_reposo(arm, arm2):
    """Máxima diferencia (grados) de dirección de hueso entre dos esqueletos para los huesos comunes."""
    peor = (0.0, None)
    for b in arm.data.bones:
        b2 = arm2.data.bones.get(b.name)
        if not b2: continue
        d1 = (arm.matrix_world.to_3x3() @ (b.tail_local - b.head_local)); d2 = (arm2.matrix_world.to_3x3() @ (b2.tail_local - b2.head_local))
        if d1.length < 1e-6 or d2.length < 1e-6: continue
        a = math.degrees(d1.angle(d2))
        if a > peor[0]: peor = (a, b.name)
    return {'grados': round(peor[0], 2), 'hueso': peor[1]}


_cache_packs = {}


def clips_extra(arm, informe):
    """Importa (una vez) los glb de KayKit Character Animations (Rig_Medium) y deja sus acciones disponibles."""
    if 'kaykit' in _cache_packs: return _cache_packs['kaykit']
    d = ruta_pack('kaykit_animations'); acciones = {}; compat = {}
    for f in sorted(os.listdir(d)):
        if not f.endswith('.glb'): continue
        objs, acts = importa(os.path.join(d, f))
        arm2 = next((o for o in objs if o.type == 'ARMATURE'), None)
        if arm2 is not None and f.endswith('CombatMelee.glb'): compat = compat_reposo(arm, arm2)
        for k, a in acts.items():
            a.use_fake_user = True
            if k not in acciones: acciones[k] = a
        nombres = [o.name for o in objs]
        for n in nombres:
            if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    informe['clips_extra'] = {'pack': 'KayKit Character Animations 1.1 (Rig_Medium)', 'acciones': len(acciones), 'reposo_vs_base': compat}
    _cache_packs['kaykit'] = acciones
    return acciones


def resuelve_clips(arm, receta, acciones_base, informe, extra=None):
    """Devuelve {clip_juego: acción} renombrando las acciones con el nombre que lee el juego."""
    hechos = {}; fuentes = {}
    for clip, origen in receta['clips'].items():
        nombres = origen if isinstance(origen, list) else [origen]
        actos = []
        for n in nombres:
            a = acciones_base.get(n)
            if a is None and extra is not None: a = extra(n)
            if a is None:
                if clip in CLIP_ORDER: raise Abort(f'clip obligatorio {clip}: no existe «{n}» en el pack')
                informe.setdefault('clips_ausentes', []).append({'clip': clip, 'pedido': n}); break
            actos.append(a)
        else:
            act = concatena(arm, actos, clip + '_concat') if len(actos) > 1 else actos[0]
            if act in hechos.values():                    # el mismo clip de origen con dos nombres (Idle/Run de voladores)
                act = act.copy()
            act.name = clip; act.use_fake_user = True; hechos[clip] = act; fuentes[clip] = ' + '.join(nombres)
    informe['clips'] = {k: {'origen': fuentes[k], 'fotogramas': list(rango(a)), 'segundos': round((rango(a)[1] - rango(a)[0]) / bpy.context.scene.render.fps, 3)} for k, a in hechos.items()}
    return hechos


# ---------------------------------------------------------------- puertas
def decimar(mallas, ratio, informe):
    """Reduce triángulos (Decimate colapso, conserva grupos de vértices) hasta el presupuesto de model_specs."""
    antes = sum(len(p.vertices) - 2 for m in mallas for p in m.data.polygons)
    for m in mallas:
        mod = m.modifiers.new('DECIMAR', 'DECIMATE'); mod.ratio = ratio; mod.use_collapse_triangulate = True
        # el Armature tiene que quedar DESPUÉS del decimado
        with bpy.context.temp_override(object=m, active_object=m, selected_objects=[m]):
            bpy.ops.object.modifier_move_to_index(modifier='DECIMAR', index=0); bpy.ops.object.modifier_apply(modifier='DECIMAR')
    despues = sum(len(p.vertices) - 2 for m in mallas for p in m.data.polygons)
    informe['decimado'] = {'ratio': ratio, 'triangulos_antes': antes, 'triangulos_despues': despues}


def aplica_transformacion_mallas(mallas, informe):
    """FBX: las mallas cuelgan del rig con su propia escala/giro. Se hornean en los vértices (misma matriz mundo) para
    que el nodo exportado sea identidad y la caja que lee el validador (sin piel) coincida con la que ve three."""
    n = 0
    for m in mallas:
        if m.matrix_basis != Matrix.Identity(4):
            with bpy.context.temp_override(object=m, active_object=m, selected_objects=[m]):
                bpy.ops.object.transform_apply(location=True, rotation=True, scale=True, properties=False)
            n += 1
    informe['mallas_transformacion_aplicada'] = n


def puerta_pesos(mallas, informe):
    sin, maxinf, corregidas, reparados = 0, 0, 0, 0
    for m in mallas:
        huerfanos = [v for v in m.data.vertices if sum(g.weight for g in v.groups) < 0.01]
        if huerfanos:
            # Vértice sin peso: se le da el grupo dominante del vértice pesado más cercano (queda registrado).
            pesados = [v for v in m.data.vertices if sum(g.weight for g in v.groups) >= 0.01]
            for v in huerfanos:
                cerca = min(pesados, key=lambda w: (w.co - v.co).length_squared)
                g = max(cerca.groups, key=lambda x: x.weight); m.vertex_groups[g.group].add([v.index], 1.0, 'REPLACE'); reparados += 1
        for v in m.data.vertices:
            s = sum(g.weight for g in v.groups); n = sum(1 for g in v.groups if g.weight > 1e-4)
            if s < 0.01: sin += 1
            maxinf = max(maxinf, n)
    if maxinf > GATES['maxInfluences']:
        for m in mallas:
            with bpy.context.temp_override(object=m, active_object=m, selected_objects=[m]):
                bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=GATES['maxInfluences'])
                bpy.ops.object.vertex_group_normalize_all(lock_active=False)
        corregidas = maxinf
        maxinf = max(sum(1 for g in v.groups if g.weight > 1e-4) for m in mallas for v in m.data.vertices)
    informe['puertas']['pesos'] = {'vertices_sin_peso': sin, 'sin_peso_reparados': reparados, 'max_influencias': maxinf, 'limitado_desde': corregidas or None, 'ok': sin == 0 and maxinf <= GATES['maxInfluences']}
    if sin: raise Abort(f'{sin} vértices sin peso')
    if maxinf > GATES['maxInfluences']: raise Abort(f'{maxinf} influencias por vértice')


def puerta_huesos(arm, informe):
    n = len(arm.data.bones); informe['puertas']['huesos'] = {'n': n, 'max': GATES['maxBones'], 'ok': n <= GATES['maxBones']}
    if n > GATES['maxBones']: raise Abort(f'{n} huesos > {GATES["maxBones"]}')


def hueso_raiz(arm):
    raices = [b for b in arm.data.bones if b.parent is None]
    return max(raices, key=lambda b: len(b.children_recursive)).name


def clava_pies(arm, cuerpo, clips, informe, volador=False):
    """Pies clavados midiendo la malla EVALUADA fotograma a fotograma: en Idle la suela se lleva a z=0;
    en el resto de clips solo se impide que entre en el suelo (la fase aérea de una zancada o un salto es legítima).
    Se corrige la z del hueso raíz y se registra el error antes/después."""
    if volador: return
    sc = bpy.context.scene; raiz = hueso_raiz(arm); pb = arm.pose.bones[raiz]; res = {}
    # dz del mundo -> espacio de armadura -> ejes locales del hueso raíz en reposo (pb.location se aplica en esos ejes,
    # antes de la rotación del propio hueso). Escribir pb.matrix en rigs FBX con escala de objeto divergía (1e29 m).
    a_local = arm.data.bones[raiz].matrix_local.to_3x3().inverted() @ arm.matrix_world.inverted().to_3x3()
    # Ganancia MEDIDA: cuánto sube la suela por cada metro que se suma a la raíz. En rigs FBX con escala de objeto
    # (dinosaurios ×3) la teoría se quedaba corta ×3 y la corrección fotograma a fotograma divergía (1e29 m).
    poner_accion(arm, clips.get('Idle') or next(iter(clips.values()))); sc.frame_set(rango(clips.get('Idle') or next(iter(clips.values())))[0])
    s0 = float(caja(cuerpo)[0][2]); pb.location = pb.location + a_local @ Vector((0, 0, 1.0)); bpy.context.view_layer.update()
    ganancia = float(caja(cuerpo)[0][2]) - s0; pb.location = pb.location - a_local @ Vector((0, 0, 1.0)); bpy.context.view_layer.update()
    if abs(ganancia) < 1e-3: raise Abort(f'la raíz {raiz} no mueve la malla (ganancia {ganancia})')
    a_local = a_local * (1.0 / ganancia)
    for nombre in clips:
        poner_accion(arm, clips[nombre]); f0, f1 = rango(clips[nombre]); antes = []
        for fr in range(f0, f1 + 1):
            sc.frame_set(fr); s = float(caja(cuerpo)[0][2]); antes.append(s)
            dz = -s if (nombre == 'Idle' or s < 0) else 0.0
            if abs(dz) > 1e-4:
                pb.location = pb.location + a_local @ Vector((0, 0, dz))
                pb.keyframe_insert('location', frame=fr, group=raiz)
        despues = []
        for fr in range(f0, f1 + 1):
            sc.frame_set(fr); despues.append(float(caja(cuerpo)[0][2]))
        res[nombre] = {'hueso': raiz, 'ganancia': round(ganancia, 4), 'antes_cm': [round(min(antes) * 100, 2), round(max(antes) * 100, 2)], 'despues_cm': [round(min(despues) * 100, 2), round(max(despues) * 100, 2)]}
    poner_accion(arm, None); informe['pies_clavados'] = res


def aristas(mallas):
    """Longitud de cada arista de las mallas EVALUADAS (con piel): la medida real de deformación.
    Una pose cambia la silueta (caja) pero no estira la malla; un vértice mal pesado sí."""
    dg = bpy.context.evaluated_depsgraph_get(); out = []
    for m in mallas:
        ev = m.evaluated_get(dg); me = ev.to_mesh()
        if len(me.edges):
            co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
            ed = np.empty(len(me.edges) * 2, dtype=np.int32); me.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
            mw = np.array(ev.matrix_world, dtype=np.float32); w = co @ mw[:3, :3].T
            out.append(np.linalg.norm(w[ed[:, 0]] - w[ed[:, 1]], axis=1))
        ev.to_mesh_clear()
    return np.concatenate(out) if out else np.zeros(0, dtype=np.float32)


def puerta_clips(arm, cuerpo, clips, informe, volador=False, ajustes=None):
    ajustes = ajustes or {}
    sc = bpy.context.scene; pose_reposo(arm); sc.frame_set(0)
    # Aristas casi degeneradas (mallas densas de Tripo: 30 k tris con aristas de 1e-4 m) disparan el cociente sin
    # que haya deformación: solo cuentan las aristas de al menos un 10 % de la mediana.
    l0 = aristas(cuerpo); validas = l0 > max(1e-5, 0.1 * float(np.median(l0))) if len(l0) else l0 > 0
    lo, hi = caja(cuerpo); diag_t = float(np.linalg.norm(hi - lo)); alt0 = float(hi[2] - lo[2])
    informe['reposo'] = {'caja_m': [[round(float(x), 3) for x in lo], [round(float(x), 3) for x in hi]], 'diagonal_m': round(diag_t, 3), 'altura_m': round(alt0, 3), 'suela_m': round(float(lo[2]), 4)}
    # Referencia de la caja: el primer fotograma de Idle (la pose que el juego enseña casi siempre). El reposo de
    # KayKit es una T con los brazos abiertos y solo con bajar los brazos la diagonal ya cae un 12-17 %: compararía
    # contra una pose que nunca se ve. Un vértice estirado dispara la diagonal mucho más que un 15 %.
    poner_accion(arm, clips['Idle']); sc.frame_set(rango(clips['Idle'])[0]); lo, hi = caja(cuerpo); diag0 = float(np.linalg.norm(hi - lo))
    informe['reposo']['diagonal_referencia_idle_m'] = round(diag0, 3)
    res = {}; fallos = []
    for nombre, act in clips.items():
        poner_accion(arm, act); f0, f1 = rango(act); frames = sorted({f0 + int((f1 - f0) * t) for t in (0, 0.25, 0.5, 0.75, 1.0)})
        diags, suelas, p99, emax = [], [], 0.0, 0.0
        for fr in frames:
            sc.frame_set(fr); l, h = caja(cuerpo); diags.append(float(np.linalg.norm(h - l))); suelas.append(float(l[2]))
            if validas.any():
                ratio = aristas(cuerpo)[validas] / l0[validas]; p99 = max(p99, float(np.percentile(ratio, 99))); emax = max(emax, float(ratio.max()))
        desv = max(abs(d - diag0) / diag0 for d in diags)
        tol = ajustes.get('bboxTolDeath', GATES['bboxTolDeath']) if nombre == 'Death' else ajustes.get('bboxTol', GATES['bboxTol'])
        aristas_ok = p99 <= ajustes.get('edgeP99', GATES['edgeP99']) and emax <= ajustes.get('edgeMax', GATES['edgeMax'])
        r = {'desviacion_diagonal_max': round(desv, 3), 'tolerancia': tol, 'aristas_p99': round(p99, 3), 'aristas_max': round(emax, 3), 'aristas_ok': aristas_ok,
             'suela_min_m': round(min(suelas), 4), 'suela_max_m': round(max(suelas), 4), 'ok': desv <= tol and aristas_ok}
        if nombre in ('Idle', 'Run') and not volador:
            # Idle: suela a ±1 cm del suelo en todo el clip; Run: nunca bajo el suelo (la zancada tiene fase aérea)
            pies_ok = (abs(min(suelas)) <= GATES['feetTolM'] and abs(max(suelas)) <= GATES['feetTolM']) if nombre == 'Idle' else (min(suelas) >= -GATES['feetTolM'])
            r['pies_ok'] = pies_ok; r['ok'] = r['ok'] and pies_ok
        if not r['ok']: fallos.append(f'{nombre}: diagonal {desv:.1%} (tol {tol:.0%}), aristas p99 ×{p99:.2f} máx ×{emax:.2f}, suela {min(suelas):.3f}…{max(suelas):.3f} m')
        res[nombre] = r
    pose_reposo(arm); sc.frame_set(0)
    informe['puertas']['clips'] = res
    if fallos: raise Abort('clip deformado o pies fuera del suelo: ' + '; '.join(fallos))


# ---------------------------------------------------------------- escala, origen, NLA, export
def raiz_de(arm):
    """Empty padre del rig: lleva la escala y la posición finales. Sobre el propio objeto armature el exportador glTF
    conserva la escala pero PIERDE la traslación (el dragón salía 12 cm bajo el suelo en el glb y bien en Blender)."""
    if arm.parent is not None and arm.parent.type == 'EMPTY' and arm.parent.name.startswith('ROOT_'): return arm.parent
    e = bpy.data.objects.new('ROOT_' + arm.name, None); bpy.context.scene.collection.objects.link(e)
    mw = arm.matrix_world.copy(); arm.parent = e; arm.matrix_parent_inverse = Matrix.Identity(4); arm.matrix_world = mw
    bpy.context.view_layer.update(); return e


def escala_y_origen(arm, cuerpo, props, altura, scale, informe):
    """Escala uniforme a la altura objetivo (× multiplicadores), suela en z=0 y centrado en X/Y, sobre el empty raíz."""
    pose_reposo(arm); bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
    raiz = raiz_de(arm)
    lo, hi = caja(cuerpo + props); alt = float(hi[2] - lo[2]); k = altura / alt
    raiz.scale = Vector((k * scale[0], k * scale[1], k * scale[2])); bpy.context.view_layer.update()
    lo, hi = caja(cuerpo + props)
    raiz.location.x -= float(lo[0] + hi[0]) / 2; raiz.location.y -= float(lo[1] + hi[1]) / 2; raiz.location.z -= float(lo[2]); bpy.context.view_layer.update()
    lo, hi = caja(cuerpo + props)
    informe['escala'] = {'altura_origen_m': round(alt, 3), 'factor': round(k, 4), 'multiplicadores': scale, 'altura_final_m': round(float(hi[2] - lo[2]), 3), 'suela_m': round(float(lo[2]), 4),
                         'centro_xy': [round(float(lo[0] + hi[0]) / 2, 4), round(float(lo[1] + hi[1]) / 2, 4)]}


def caja_cruda(mallas):
    """Caja SIN piel (vértices × matriz del objeto): es la que lee el validador y la que usa el juego (Box3.setFromObject)
    para apoyar el modelo en el suelo. En rigs FBX la pose de enlace no coincide con el reposo y puede bajar unos cm."""
    pts = [m.matrix_world @ v.co for m in mallas for v in m.data.vertices]
    return Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)])


def ajusta_caja_cruda(arm, mallas, informe):
    lo, hi = caja_cruda(mallas); dz = 0.0
    if lo.z < -0.01:
        dz = -lo.z; raiz_de(arm).location.z += dz; bpy.context.view_layer.update(); lo, hi = caja_cruda(mallas)
    informe['caja_cruda'] = {'min_z_m': round(float(lo.z), 4), 'altura_m': round(float(hi.z - lo.z), 3), 'subido_m': round(dz, 4)}


def pistas_nla(arm, clips):
    arm.animation_data_create()
    for t in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(t)
    for nombre in CLIP_ORDER + sorted(k for k in clips if k not in CLIP_ORDER):
        if nombre not in clips: continue
        act = clips[nombre]; f0, f1 = rango(act)
        pista = arm.animation_data.nla_tracks.new(); pista.name = nombre
        tira = pista.strips.new(nombre, max(0, f0), act)
        if hasattr(tira, 'action_slot') and hasattr(act, 'slots') and len(act.slots): tira.action_slot = act.slots[0]
    poner_accion(arm, None)


def limpia_acciones(clips):
    for a in list(bpy.data.actions):
        if a not in clips.values(): bpy.data.actions.remove(a)


def exporta(asset_id, objetos, informe):
    os.makedirs(FINAL, exist_ok=True); out = os.path.join(FINAL, asset_id + '.glb')
    bpy.ops.object.select_all(action='DESELECT')
    for o in objetos: o.select_set(True)
    kw = dict(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
              export_animations=True, export_animation_mode='NLA_TRACKS', export_anim_slide_to_zero=True,
              export_force_sampling=True, export_optimize_animation_size=True, export_skins=True, export_def_bones=False,
              export_all_influences=False, export_morph=False, export_cameras=False, export_lights=False,
              export_image_format='AUTO', export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT')
    bpy.ops.export_scene.gltf(**kw)
    # El juego apoya el modelo por su caja SIN piel (Box3.setFromObject) y el validador mide lo mismo: si el glb no sale
    # con esa caja en y=0 (en rigs FBX el exportador recoloca los vértices con piel), se corrige la raíz y se reexporta.
    # La ganancia se MIDE: en rigs FBX el exportador aplica la traslación de la raíz dos veces (una en el nodo y otra
    # horneada en los vértices con piel), así que un desplazamiento d mueve la caja 2d.
    minY = _min_y_glb(out); ajuste = 0.0; ganancia = 1.0
    if abs(minY) > 0.005:
        raiz = next(o for o in objetos if o.type == 'EMPTY'); raiz.location.z -= minY; ajuste = -minY; bpy.context.view_layer.update()
        bpy.ops.export_scene.gltf(**kw); minY1 = _min_y_glb(out); ganancia = (minY1 - minY) / (-minY) if abs(minY) > 1e-6 else 1.0
        if abs(minY1) > 0.005 and abs(ganancia) > 0.1:
            d = -minY1 / ganancia; raiz.location.z += d; ajuste += d; bpy.context.view_layer.update()
            bpy.ops.export_scene.gltf(**kw)
        minY = _min_y_glb(out)
    informe.setdefault('glb', {})['ganancia_raiz_glb'] = round(ganancia, 3)
    informe['glb'].update({'ruta': os.path.relpath(out, ROOT), 'bytes': os.path.getsize(out), 'min_y_sin_piel': minY, 'raiz_ajustada_m': round(ajuste, 4)})
    return out


def _min_y_glb(out):
    r = subprocess.run([NODE, '--input-type=module', '-e', ANALIZA_JS, '--', os.path.abspath(out)], capture_output=True, text=True, cwd=ROOT)
    try: return float(r.stdout.strip().splitlines()[-1])
    except Exception: raise Abort('no se pudo leer la caja del glb: ' + (r.stderr or r.stdout)[-300:])


def comprobaciones_externas(out, asset_id, informe):
    """Khronos + three (comprobar_glb.mjs de la skill) y el validador del proyecto."""
    r = subprocess.run([NODE, os.path.abspath(COMPROBAR), out], capture_output=True, text=True, cwd=ROOT)
    kh = {'exit': r.returncode}
    try:
        datos = json.loads(r.stdout[r.stdout.index('['):]) if '[' in r.stdout else json.loads(r.stdout)
        d = datos[0] if isinstance(datos, list) else datos
        kh.update({'errores': d['khronos']['errores'], 'avisos': d['khronos']['avisos'], 'mensajes': d['khronos']['mensajes'][:6],
                   'three': {k: d['three'].get(k) for k in ('huesos', 'mallasConEsqueleto', 'caja_con_piel_m', 'suelo_con_piel_y', 'animaciones', 'movimientoMaximo_m')}})
    except Exception as e:
        kh['error_lectura'] = f'{e}: {r.stdout[-400:]} {r.stderr[-400:]}'
    informe['khronos'] = kh
    v = subprocess.run([NODE, '--input-type=module', '-e', VALIDADOR_JS, '--', os.path.abspath(out), asset_id], capture_output=True, text=True, cwd=ROOT)
    informe['validador'] = {'exit': v.returncode, 'salida': (v.stdout or v.stderr).strip().splitlines()[:8]}
    informe['puertas']['khronos'] = {'errores': kh.get('errores'), 'ok': kh.get('errores') == 0}
    informe['puertas']['validador'] = {'ok': v.returncode == 0}
    if kh.get('errores') != 0: raise Abort(f'Khronos: {kh.get("errores")} errores ({kh.get("mensajes") or kh.get("error_lectura")})')
    if v.returncode != 0: raise Abort('validate_models.mjs: ' + ' | '.join(informe['validador']['salida']))


# ---------------------------------------------------------------- tira de evidencia
def tira(asset_id, arm, clips, altura, informe):
    """Reposo frente · reposo lado · Idle · Run · Attack · Cast · Death, con suelo y flecha de frente (-Y)."""
    sc = bpy.context.scene
    motores = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    sc.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in motores else 'BLENDER_EEVEE'
    try: sc.eevee.taa_render_samples = 8
    except Exception: pass
    sc.render.resolution_x = sc.render.resolution_y = 320; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.35, 0.37, 0.4, 1)
    sol = bpy.data.objects.new('SOL', bpy.data.lights.new('SOL', 'SUN')); sol.data.energy = 4; sol.rotation_euler = (math.radians(50), 0, math.radians(30)); sc.collection.objects.link(sol)
    bpy.ops.mesh.primitive_plane_add(size=max(6, altura * 4)); suelo = bpy.context.object; suelo.name = 'REF_suelo'
    suelo.data.materials.append(material_simple('suelo', '#2b2f33'))
    bpy.ops.mesh.primitive_grid_add(size=max(6, altura * 4), x_subdivisions=12, y_subdivisions=12); rej = bpy.context.object; rej.location.z = 0.002
    rej.data.materials.append(material_simple('rej', '#3c4248'))
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.35, location=(0, -altura * 0.75, 0.06), rotation=(math.radians(-90), 0, 0)); flecha = bpy.context.object
    flecha.data.materials.append(material_simple('flecha', '#ffc107', emissive=1.0))
    cam = bpy.data.objects.new('CAM', bpy.data.cameras.new('CAM')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = altura * 1.9
    temporales = [sol, suelo, rej, flecha, cam]

    def coloca(modo):
        d = altura * 6; z = altura * 0.5 if modo != 'juego' else altura * 0.35
        if modo == 'frente': cam.location = (0, -d, z); cam.rotation_euler = (math.radians(90), 0, 0)
        elif modo == 'lado': cam.location = (d, 0, z); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
        else: cam.location = (0, -d * 0.55, z + d * 0.84); cam.rotation_euler = (math.radians(33.2), 0, 0)   # cámara del juego (57° bajo la horizontal)
    tiles = []; orden = [('reposo_frente', None, 0), ('reposo_lado', None, 0)] + [(c, c, {'Idle': 0.5, 'Run': 0.5, 'Attack': 0.4, 'Cast': 0.5, 'Death': 1.0}[c]) for c in CLIP_ORDER if c in clips]
    ruta = os.path.join(EVID, f'_tmp_{asset_id}.png')
    for etiqueta, clip, t in orden:
        if clip: poner_accion(arm, clips[clip]); f0, f1 = rango(clips[clip]); sc.frame_set(f0 + int((f1 - f0) * t)); coloca('juego')
        else: pose_reposo(arm); sc.frame_set(0); coloca('frente' if etiqueta == 'reposo_frente' else 'lado')
        sc.render.filepath = ruta; bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(ruta, check_existing=False); px = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4); bpy.data.images.remove(im)
        px[:, :2, :3] = 1.0; tiles.append(px)
    pose_reposo(arm)
    hoja = np.concatenate(tiles, axis=1); img = bpy.data.images.new('tira', hoja.shape[1], hoja.shape[0]); img.pixels = hoja.ravel()
    os.makedirs(EVID, exist_ok=True); salida = os.path.join(EVID, asset_id + '.png'); img.filepath_raw = salida; img.file_format = 'PNG'; img.save()
    os.remove(ruta)
    for o in temporales: bpy.data.objects.remove(o, do_unlink=True)
    informe['tira'] = {'ruta': os.path.relpath(salida, ROOT), 'orden': [o[0] for o in orden]}


def guarda_informe(asset_id, informe):
    os.makedirs(SALIDA, exist_ok=True)
    json.dump(informe, open(os.path.join(SALIDA, asset_id + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def informe_base(asset_id, receta):
    return {'asset': asset_id, 'pack': receta['pack'], 'base': receta['base'], 'categoria': receta['category'], 'altura_objetivo_m': SPEC['assets'][asset_id]['height'],
            'fecha': time.strftime('%Y-%m-%d %H:%M'), 'puertas': {}, 'estado': 'en curso'}


# ---------------------------------------------------------------- un campeón/súbdito KayKit
def construye_kaykit(asset_id, con_tira=True):
    receta = BUILDS['assets'][asset_id]; informe = informe_base(asset_id, receta); t0 = time.time()
    try:
        sc = reset()
        objs, acciones = importa(os.path.join(ruta_pack('kaykit_src'), receta['base'] + '.glb'))
        arm = armadura_de(objs); cuerpo = mallas_con_piel(arm)
        informe['base_glb'] = {'canales_objeto_quitados': informe_import.get('canales_objeto_quitados'), 'objetos': len(objs), 'huesos': len(arm.data.bones), 'acciones': sorted(acciones), 'mallas_con_piel': [m.name for m in cuerpo]}
        # --- props del propio glb: capturar el marco de todos los nodos sueltos, conservar solo los pedidos
        sueltos = [o for o in objs if o.type == 'MESH' and o not in cuerpo]
        marcos = {o.name: marco_de(o) for o in sueltos if o.parent_type == 'BONE'}
        keep = receta.get('props', {}).get('keep', [])
        props = []
        for o in sueltos:
            if o.name in keep: props.append(o)
            else: bpy.data.objects.remove(o, do_unlink=True)
        faltan = [k for k in keep if k not in [p.name for p in props]]
        if faltan: raise Abort(f'props a conservar que no existen en {receta["base"]}: {faltan}')
        # --- props prestados de otro glb KayKit (mismo esqueleto, mismo marco de hueso)
        for b in receta.get('props', {}).get('borrow', []):
            objs2, _ = importa(os.path.join(ruta_pack('kaykit_src'), b['from'] + '.glb'))
            nodo = next((o for o in objs2 if o.name.split('.')[0] == b['node']), None)
            if nodo is None: raise Abort(f'prop prestado {b["node"]} no existe en {b["from"]}')
            marco = marco_de(nodo); me = nodo.data.copy(); nuevo = bpy.data.objects.new(b.get('as', b['node']), me); sc.collection.objects.link(nuevo)
            nuevo.matrix_basis = Matrix.Identity(4); engancha(nuevo, arm, marco); props.append(nuevo)
            for n in [o.name for o in objs2]:
                if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
            for a in list(bpy.data.actions):
                if a not in acciones.values(): bpy.data.actions.remove(a)
        # --- props construidos
        for mk in receta.get('props', {}).get('make', []):
            ref = mk['ref']
            marco = marco_hueso(arm, ref[1:]) if ref.startswith('@') else marcos.get(ref)
            if marco is None: raise Abort(f'nodo de referencia {ref} no existe en {receta["base"]}')
            p = construye_prop(mk, arm); engancha(p, arm, marco); props.append(p)
        informe['props'] = {'conservados': keep, 'prestados': [b.get('as', b['node']) for b in receta.get('props', {}).get('borrow', [])], 'construidos': [m['name'] for m in receta.get('props', {}).get('make', [])]}
        # --- tinte (solo materiales del cuerpo y de los props originales; los construidos llevan su color)
        mats = {s.material for o in cuerpo + [p for p in props if p.name in keep] for s in o.material_slots if s.material}
        informe['tinte'] = {'color': receta.get('tint'), 'mezcla': receta.get('tintMix', 0.45), 'materiales': tintar(mats, receta.get('tint'), receta.get('tintMix', 0.45), receta.get('emissive', 0.0))}
        # --- clips: los del glb y, si faltan, los de KayKit Character Animations
        extra = lambda n: clips_extra(arm, informe).get(n)
        clips = resuelve_clips(arm, receta, acciones, informe, extra)
        # --- escala, origen y puertas
        puerta_huesos(arm, informe); puerta_pesos(cuerpo, informe)
        if receta.get('decimate'): decimar(cuerpo, receta['decimate'], informe)
        escala_y_origen(arm, cuerpo, props, SPEC['assets'][asset_id]['height'], receta.get('scale', [1, 1, 1]), informe)
        ajusta_caja_cruda(arm, cuerpo, informe)
        clava_pies(arm, cuerpo, clips, informe, receta.get('flying', False))
        puerta_clips(arm, cuerpo, clips, informe, receta.get('flying', False), receta.get('gates'))
        pistas_nla(arm, clips); limpia_acciones(clips)
        out = exporta(asset_id, [raiz_de(arm), arm] + cuerpo + props, informe)
        comprobaciones_externas(out, asset_id, informe)
        if con_tira: tira(asset_id, arm, clips, SPEC['assets'][asset_id]['height'], informe)
        informe['estado'] = 'ok'
    except Abort as e:
        informe['estado'] = 'abortado'; informe['motivo'] = str(e)
        glb = os.path.join(FINAL, asset_id + '.glb')
        if os.path.exists(glb) and informe.get('glb'): os.remove(glb)
    informe['segundos'] = round(time.time() - t0, 1)
    guarda_informe(asset_id, informe)
    print(f"[{informe['estado'].upper()}] {asset_id} {informe.get('motivo', '')} ({informe['segundos']} s)")
    return informe['estado'] == 'ok'


def ids_del_pack(pack):
    return [k for k, v in BUILDS['assets'].items() if v['pack'] == pack]


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if not argv: raise SystemExit(__doc__)
    ids = ids_del_pack('kaykit') if argv[0] == 'all' else argv[0].split(',')
    ok = all([construye_kaykit(i, '--sin-tira' not in argv) for i in ids])
    print('RESULTADO', 'ok' if ok else 'con fallos')
    if not ok: raise SystemExit(1)
