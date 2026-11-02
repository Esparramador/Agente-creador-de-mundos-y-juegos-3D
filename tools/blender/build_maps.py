"""Construye en Blender los 3 mapas de Coronas de Ceniza a partir de assets/data/map_layouts.json
(la misma geometría que usa la simulación) y los exporta a glTF para el juego, con renders de diseño.

Uso:
    python3 tools/blender/build_maps.py [grieta_ceniza|puente_niebla|ruinas_eclipse|all] [--no-render]
    (o: blender -b -P tools/blender/build_maps.py -- all)

Salida por mapa:
    art/blender/maps/<id>.blend                 escena editable
    game/assets/models/src/map_<id>.glb         glTF sin optimizar (el juego usa la versión optimizada)
    design/levels/renders/<id>_top.png          planta ortográfica (Cycles)
    design/levels/renders/<id>_persp.png        vista en perspectiva
Coordenadas: juego (x, y) -> Blender (x*0.01, -y*0.01, z). Al exportar con +Y arriba queda three.js (x, z=y).
Todo lo jugable está a z=0. El relieve (acantilados, abismos, río) es decorativo y queda fuera de las zonas
donde la simulación deja caminar, salvo el lecho del río, que baja solo unos centímetros.
"""
import bpy, bmesh, json, math, os, sys, random
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
LAY = json.load(open(os.path.join(ROOT, 'assets', 'data', 'map_layouts.json'), encoding='utf-8'))
S = 0.01

def lin(c): return tuple((v / 255) ** 2.2 if v > 1 else v ** 2.2 for v in c)
PAL = {
    'grieta_ceniza': dict(ground=(58, 52, 44), ground2=(74, 64, 50), lane=(118, 102, 80), lane_edge=(70, 60, 48), river=(40, 33, 30), cliff=(70, 64, 60), cliff_top=(46, 42, 38),
                          base=(120, 116, 108), foliage=[(60, 92, 48), (84, 104, 52), (98, 82, 46)], trunk=(60, 44, 32), rock=(96, 90, 82), glow=(255, 110, 30), water=None),
    'puente_niebla': dict(ground=(196, 206, 216), ground2=(170, 184, 198), lane=(116, 128, 140), lane_edge=(88, 98, 110), river=None, cliff=(150, 170, 190), cliff_top=(220, 230, 240),
                          base=(150, 158, 168), foliage=[(52, 86, 76), (70, 104, 92)], trunk=(70, 56, 46), rock=(140, 150, 162), glow=(120, 200, 255), water=None, abyss=(10, 16, 24)),
    'ruinas_eclipse': dict(ground=(44, 36, 58), ground2=(58, 50, 66), lane=(92, 80, 110), lane_edge=(60, 52, 76), river=(34, 28, 50), cliff=(64, 56, 78), cliff_top=(48, 70, 52),
                           base=(120, 112, 130), foliage=[(56, 96, 64), (76, 110, 70), (90, 70, 110)], trunk=(58, 44, 40), rock=(100, 92, 112), glow=(255, 205, 90), water=(60, 50, 110)),
}

# ---------------------------------------------------------------- utilidades
def poly_dist(px, py, polys):
    d = np.full(px.shape, 1e9)
    for poly in polys:
        for (ax, ay), (bx, by) in zip(poly[:-1], poly[1:]):
            vx, vy = bx - ax, by - ay; L = vx * vx + vy * vy
            t = np.clip(((px - ax) * vx + (py - ay) * vy) / L, 0, 1)
            d = np.minimum(d, np.hypot(px - ax - t * vx, py - ay - t * vy))
    return d

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def value_noise(shape, cells, seed):
    rng = np.random.default_rng(seed); g = rng.random((cells + 2, cells + 2))
    ys = np.linspace(0, cells, shape[0]); xs = np.linspace(0, cells, shape[1])
    yi = ys.astype(int); xi = xs.astype(int); fy = (ys - yi)[:, None]; fx = (xs - xi)[None, :]
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[yi][:, xi]; b = g[yi][:, xi + 1]; c = g[yi + 1][:, xi]; d = g[yi + 1][:, xi + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

def fbm(shape, seed): return sum(value_noise(shape, c, seed + i) * w for i, (c, w) in enumerate([(6, 0.5), (14, 0.3), (34, 0.2)]))

def mat_vc(name, rough=0.9, metal=0.0, alpha=1.0, emission=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Color'; nt.links.new(ca.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if alpha < 1: bs.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    if emission: bs.inputs['Emission Color'].default_value = (*lin(emission), 1); bs.inputs['Emission Strength'].default_value = 3.0
    return m

def mat_flat(name, col, rough=0.5, metal=0.0, emission=None, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*lin(col), 1); bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if emission: bs.inputs['Emission Color'].default_value = (*lin(emission), 1); bs.inputs['Emission Strength'].default_value = 4.0
    if alpha < 1: bs.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m

class Builder:
    """Acumula geometría con color por vértice en un bmesh y la vuelca a un objeto (1 material = 1 llamada de dibujo)."""
    def __init__(self, name): self.name = name; self.bm = bmesh.new(); self.col = self.bm.loops.layers.color.new('Color'); self.rng = random.Random(__import__('zlib').crc32(name.encode()))
    def _paint(self, faces, c, jitter=0.06):
        for f in faces:
            k = 1 + self.rng.uniform(-jitter, jitter)
            for l in f.loops: l[self.col] = (min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), 1)
    def add(self, fn, color, loc=(0, 0, 0), scale=(1, 1, 1), rot=0.0, jitter=0.06, displace=0.0, **kw):
        tmp = bmesh.new(); fn(tmp, **kw)
        if displace:
            for v in tmp.verts: v.co += v.normal * self.rng.uniform(-displace, displace)
        M = (__import__('mathutils').Matrix.Translation(loc) @ __import__('mathutils').Matrix.Rotation(rot, 4, 'Z') @ __import__('mathutils').Matrix.Diagonal((*scale, 1)))
        bmesh.ops.transform(tmp, matrix=M, verts=tmp.verts)
        me = bpy.data.meshes.new('tmp'); tmp.to_mesh(me); tmp.free()
        start = len(self.bm.faces); self.bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bm.faces.ensure_lookup_table(); self._paint(self.bm.faces[start:], lin(color) if max(color) > 1 else color, jitter)
    def obj(self, mat, coll):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me); self.bm.free()
        # pasar el color de las esquinas a un atributo de color (glTF COLOR_0)
        o = bpy.data.objects.new(self.name, me); coll.objects.link(o); me.materials.append(mat)
        me.color_attributes.active_color = me.color_attributes['Color']
        for p in me.polygons: p.use_smooth = False
        return o

def ico(bm, subdiv=1, r=1.0): bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
def cyl(bm, seg=8, r1=1.0, r2=1.0, h=1.0):
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
def box(bm, sx=1, sy=1, sz=1):
    bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0, sz / 2), verts=bm.verts)

# ---------------------------------------------------------------- terreno
def build_terrain(mid, m, P, coll, mat):
    W, H = m['W'], m['H']; margin = 1500; cell = 100 if W >= 12000 else 75
    xs = np.arange(-margin, W + margin + 1, cell); ys = np.arange(-margin, H + margin + 1, cell)
    gx, gy = np.meshgrid(xs, ys)
    lanes = list(m['lanes'].values())
    dl = poly_dist(gx, gy, lanes)
    n = fbm(gx.shape, 7); n2 = fbm(gx.shape, 99)
    outside = np.maximum(np.maximum(-gx, gx - W), np.maximum(-gy, gy - H)); outside = np.maximum(outside, 0)
    inside = outside <= 0
    col = np.zeros(gx.shape + (3,)); z = np.zeros(gx.shape)
    g1, g2 = np.array(lin(P['ground'])), np.array(lin(P['ground2']))
    col[:] = g1 * (1 - n[..., None]) + g2 * n[..., None]
    # caminos (carriles): borde oscuro + losas
    edge = 1 - smooth(300, 360, dl); lane = 1 - smooth(250, 300, dl)
    col = col * (1 - edge[..., None]) + np.array(lin(P['lane_edge'])) * edge[..., None]
    tiles = ((np.floor(gx / 160) + np.floor(gy / 160)) % 2) * 0.08 + n2 * 0.12
    col = col * (1 - lane[..., None]) + (np.array(lin(P['lane'])) * (0.92 + tiles[..., None])) * lane[..., None]
    # río
    if m['river']:
        (ax, ay), (bx, by) = m['river']; dr = poly_dist(gx, gy, [[(ax, ay), (bx, by)]])
        rv = (1 - smooth(m['riverW'] / 2 - 120, m['riverW'] / 2, dr)) * inside
        col = col * (1 - rv[..., None]) + np.array(lin(P['river'])) * rv[..., None]
        z -= 0.12 * rv * (1 - lane)  # lecho del río (los carriles cruzan a nivel)
    # bases
    for t, (fx, fy) in enumerate(m['fountain']):
        db = np.hypot(gx - fx, gy - fy); pav = 1 - smooth(1250, 1350, db)
        rings = (np.sin(db / 55) > 0.85) * 0.08
        col = col * (1 - pav[..., None]) + (np.array(lin(P['base'])) * (0.9 + rings[..., None])) * pav[..., None]
        tint = (1 - smooth(500, 700, db)) * 0.25; tc = np.array(lin((66, 165, 245) if t == 0 else (239, 83, 80)))
        col = col * (1 - tint[..., None]) + tc * tint[..., None]
    # campamentos de jungla: claros de tierra
    for c in m['camps']:
        dc = np.hypot(gx - c[1], gy - c[2]); cl = (1 - smooth(260, 380, dc)) * 0.6
        col = col * (1 - cl[..., None]) + np.array(lin(P['lane_edge'])) * cl[..., None]
    # relieve exterior: acantilados (o abismo en el Puente)
    rise = smooth(80, 700, outside)
    if m['bounds']:
        y0, y1 = m['bounds']['y0'], m['bounds']['y1']
        off_bridge = np.maximum(y0 - 60 - gy, gy - y1 - 60); off_bridge = np.maximum(off_bridge, 0)
        drop = smooth(0, 120, off_bridge) * (1 - smooth(0, 1, outside))
        land = (gx < 900) | (gx > W - 900)  # acantilados en los extremos (bases)
        z += np.where(land, 0, -9 * drop)
        col = np.where((drop[..., None] > 0.3) & ~land[..., None], np.array(lin(P['abyss'])) * (0.7 + 0.6 * n[..., None]), col)
        rise = rise * 1
    z += rise * (1.6 + 3.2 * n2)
    cliff = smooth(0.2, 1.2, z)
    col = col * (1 - cliff[..., None]) + (np.array(lin(P['cliff'])) * (0.75 + 0.5 * n[..., None])) * cliff[..., None]
    top = smooth(2.5, 4.0, z); col = col * (1 - top[..., None]) + np.array(lin(P['cliff_top'])) * top[..., None]
    col *= (0.88 + 0.24 * n2)[..., None]
    # malla
    ny, nx = gx.shape
    verts = np.stack([gx.ravel() * S, -gy.ravel() * S, z.ravel()], 1)
    idx = np.arange(nx * ny).reshape(ny, nx)
    a, b, c, d = idx[:-1, :-1].ravel(), idx[:-1, 1:].ravel(), idx[1:, 1:].ravel(), idx[1:, :-1].ravel()
    faces = np.stack([a, d, c, b], 1)
    me = bpy.data.meshes.new(f'{mid}_terreno'); me.from_pydata(verts.tolist(), [], faces.tolist())
    ca = me.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT')
    rgba = np.concatenate([np.clip(col.reshape(-1, 3), 0, 1), np.ones((nx * ny, 1))], 1)
    ca.data.foreach_set('color', rgba.ravel().astype(np.float32)); me.color_attributes.active_color = ca
    me.update(); o = bpy.data.objects.new(f'{mid}_terreno', me); coll.objects.link(o); me.materials.append(mat)
    return o, (gx, gy, z, outside)

# ---------------------------------------------------------------- decorado
def scatter_border(m, rng, n, inner=150, outer=1300):
    W, H = m['W'], m['H']; pts = []
    while len(pts) < n:
        side = rng.random()
        if m['bounds'] and side < 0.85:  # el Puente: solo extremos en tierra
            x = rng.uniform(-outer, 800) if rng.random() < 0.5 else rng.uniform(W - 800, W + outer); y = rng.uniform(-outer, H + outer)
            if 0 < x < W and m['bounds']['y0'] - 200 < y < m['bounds']['y1'] + 200: continue
        else:
            x, y = rng.uniform(-outer, W + outer), rng.uniform(-outer, H + outer)
            o = max(-x, x - W, -y, y - H)
            if not (inner < o < outer): continue
        pts.append((x, y))
    return pts

def build_decor(mid, m, P, coll, mat_vc_decor, mat_glow, mat_water):
    rng = random.Random(42); D = Builder(f'{mid}_decorado'); G = Builder(f'{mid}_brillo')
    fol = [lin(c) for c in P['foliage']]
    # rocas de la simulación (obstáculos reales): misma posición y radio
    for (x, y, r) in m['rocks']:
        D.add(ico, P['rock'], loc=(x * S, -y * S, r * S * 0.35), scale=(r * S, r * S, r * S * 0.75), rot=rng.random() * 6, displace=0.18, subdiv=2)
        for k in range(3):
            a = rng.random() * 6.28; rr = r * S * rng.uniform(0.2, 0.35)
            D.add(ico, P['rock'], loc=(x * S + math.cos(a) * r * S * 1.05, -y * S + math.sin(a) * r * S * 1.05, rr * 0.4), scale=(rr, rr, rr * 0.7), displace=0.15, subdiv=1)
    # matorrales (ocultan en la simulación): grupos de arbustos
    for (x, y, r) in m['brushes']:
        n = max(6, int(r / 32))
        for i in range(n):
            a = rng.random() * 6.28; d = math.sqrt(rng.random()) * r * 0.9 * S; s = rng.uniform(0.35, 0.6)
            D.add(ico, rng.choice(fol), loc=(x * S + math.cos(a) * d, -y * S + math.sin(a) * d, s * 0.55), scale=(s, s, s * 0.85), displace=0.12, subdiv=1, jitter=0.12)
    # bordes: árboles y rocas fuera de la zona jugable
    for (x, y) in scatter_border(m, rng, 260 if mid == 'grieta_ceniza' else 160 if mid == 'ruinas_eclipse' else 120):
        k = rng.random(); s = rng.uniform(0.8, 1.5)
        hz = 1.6 if not m['bounds'] else 0.0
        if mid == 'puente_niebla' or (mid == 'grieta_ceniza' and k < 0.35):  # pinos / árboles muertos
            if mid == 'grieta_ceniza':
                D.add(cyl, P['trunk'], loc=(x * S, -y * S, 0), scale=(s, s, s), seg=5, r1=0.18, r2=0.05, h=2.6)
                for b in range(3): D.add(cyl, P['trunk'], loc=(x * S, -y * S, s * (1.2 + b * 0.4)), rot=rng.random() * 6, scale=(s * 0.6, s * 0.6, s * 0.6), seg=4, r1=0.06, r2=0.02, h=1.2)
            else:
                D.add(cyl, P['trunk'], loc=(x * S, -y * S, 0), scale=(s, s, s), seg=5, r1=0.15, r2=0.1, h=0.8)
                for b, (rr, hh) in enumerate([(1.0, 1.4), (0.75, 1.2), (0.5, 1.0)]): D.add(cyl, fol[0], loc=(x * S, -y * S, s * (0.6 + b * 0.7)), scale=(s, s, s), seg=7, r1=rr, r2=0.02, h=hh)
                D.add(cyl, P['cliff_top'], loc=(x * S, -y * S, s * 2.3), scale=(s, s, s), seg=7, r1=0.3, r2=0.0, h=0.5)
        elif mid == 'ruinas_eclipse' and k < 0.35:  # columnas en ruinas
            h = rng.uniform(1.0, 4.0); D.add(cyl, P['rock'], loc=(x * S, -y * S, 0), seg=8, r1=0.4, r2=0.36, h=h)
            D.add(box, P['rock'], loc=(x * S, -y * S, h), sx=1.0, sy=1.0, sz=0.25)
        else:  # árbol frondoso
            D.add(cyl, P['trunk'], loc=(x * S, -y * S, 0), scale=(s, s, s), seg=6, r1=0.2, r2=0.14, h=1.6)
            for b in range(3): D.add(ico, rng.choice(fol), loc=(x * S + rng.uniform(-0.4, 0.4) * s, -y * S + rng.uniform(-0.4, 0.4) * s, s * (1.9 + b * 0.35)), scale=(s * 1.1, s * 1.1, s * 0.9), displace=0.15, subdiv=1, jitter=0.1)
    # campamentos: anillo de piedras planas
    for c in m['camps']:
        for i in range(9):
            a = i / 9 * 6.28; D.add(box, P['lane_edge'], loc=((c[1] + math.cos(a) * 330) * S, -(c[2] + math.sin(a) * 330) * S, 0), rot=a, sx=0.5, sy=0.3, sz=0.12)
    # fosos de objetivos épicos: círculo de runas brillantes
    for k, pos in (m['epic'] or {}).items():
        x, y = pos
        for i in range(16):
            a = i / 16 * 6.28; G.add(box, P['glow'], loc=((x + math.cos(a) * 520) * S, -(y + math.sin(a) * 520) * S, 0.0), rot=a, sx=0.35, sy=0.12, sz=0.04)
        for i in range(8):
            a = i / 8 * 6.28 + 0.2; D.add(cyl, P['rock'], loc=((x + math.cos(a) * 650) * S, -(y + math.sin(a) * 650) * S, 0), seg=6, r1=0.3, r2=0.22, h=rng.uniform(0.6, 1.4))
    # altares (Ruinas): plataforma de losas + runas
    for (name, x, y) in m['altars']:
        D.add(cyl, P['lane'], loc=(x * S, -y * S, 0), seg=24, r1=3.2, r2=3.0, h=0.03)
        for i in range(24): a = i / 24 * 6.28; G.add(box, P['glow'], loc=((x + math.cos(a) * 270) * S, -(y + math.sin(a) * 270) * S, 0.03), rot=a, sx=0.25, sy=0.08, sz=0.03)
    # bases: estandartes con el color del equipo
    for t, (fx, fy) in enumerate(m['fountain']):
        tc = (66, 165, 245) if t == 0 else (239, 83, 80)
        for i in range(10):
            a = i / 10 * 6.28; px, py = fx + math.cos(a) * 1250, fy + math.sin(a) * 1250
            if not (0 < px < m['W'] and 0 < py < m['H']): continue
            D.add(cyl, P['rock'], loc=(px * S, -py * S, 0), seg=6, r1=0.12, r2=0.1, h=2.4)
            D.add(box, tc, loc=(px * S, -py * S, 1.2), rot=a + 1.57, sx=0.05, sy=0.6, sz=1.0)
    # detalles por mapa
    if mid == 'grieta_ceniza':
        for (x, y) in scatter_border(m, rng, 12, 300, 1000):  # charcas de lava fuera del área de juego
            G.add(cyl, P['glow'], loc=(x * S, -y * S, 0.9), seg=12, r1=rng.uniform(1.5, 3), r2=1.4, h=0.05)
        for i in range(40):  # grietas de lava a lo largo del río
            t = rng.random(); x, y = t * m['W'], t * m['H']; off = rng.choice((-1, 1)) * m['riverW'] * 0.48
            G.add(box, P['glow'], loc=((x + off * 0.7) * S, -(y - off * 0.7) * S, -0.01), rot=-0.785 + rng.uniform(-0.4, 0.4), sx=rng.uniform(0.8, 2.2), sy=0.07, sz=0.03)
    if mid == 'puente_niebla':
        y0, y1 = m['bounds']['y0'], m['bounds']['y1']
        for x in range(600, m['W'] - 500, 600):  # pilares y barandillas del puente
            for yy in (y0 - 60, y1 + 60):
                D.add(cyl, P['lane_edge'], loc=(x * S, -yy * S, 0), seg=6, r1=0.3, r2=0.25, h=1.4)
                D.add(cyl, P['cliff_top'], loc=(x * S, -yy * S, 1.4), seg=6, r1=0.35, r2=0.0, h=0.4)
            for yy in (y0 - 60, y1 + 60): D.add(box, P['lane_edge'], loc=((x + 300) * S, -yy * S, 0.8), sx=6.0, sy=0.18, sz=0.18)
        for x in range(800, m['W'] - 600, 1400):  # arcos bajo el puente (visibles desde el abismo)
            for yy in (y0 - 160, y1 + 160): D.add(box, P['cliff'], loc=(x * S, -yy * S, -8), sx=1.2, sy=1.2, sz=8)
        for (x, y) in scatter_border(m, rng, 30, 200, 1200):
            G.add(cyl, P['glow'], loc=(x * S, -y * S, 0), seg=4, r1=0.35, r2=0.0, h=rng.uniform(1.0, 2.6))
    if mid == 'ruinas_eclipse':
        for i in range(24):  # columnata alrededor del templo
            a = i / 24 * 6.28; x, y = m['W'] / 2 + math.cos(a) * m['W'] * 0.62, m['H'] / 2 + math.sin(a) * m['H'] * 0.62
            if 0 < x < m['W'] and 0 < y < m['H']: continue
            D.add(cyl, P['rock'], loc=(x * S, -y * S, 0), seg=8, r1=0.5, r2=0.45, h=4.5); D.add(box, P['rock'], loc=(x * S, -y * S, 4.5), sx=1.3, sy=1.3, sz=0.3)
    D.obj(mat_vc_decor, coll); G.obj(mat_glow, coll)
    if P.get('water') and m['river']:
        (ax, ay), (bx, by) = m['river']; L = math.hypot(bx - ax, by - ay)
        bpy.ops.mesh.primitive_plane_add(size=1, location=((ax + bx) / 2 * S, -(ay + by) / 2 * S, -0.03))
        w = bpy.context.object; w.name = f'{mid}_agua'; w.scale = (L * S, m['riverW'] * S * 0.9, 1); w.rotation_euler[2] = -math.atan2(by - ay, bx - ax)
        for c in w.users_collection: c.objects.unlink(w)
        coll.objects.link(w); w.data.materials.append(mat_water)

# ---------------------------------------------------------------- render de diseño
def render(mid, m, coll, out_dir):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
    try: sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: sc.cycles.use_denoising = False
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    world = bpy.data.worlds.new('W'); world.use_nodes = True; world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.25, 0.28, 0.33, 1); world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8; sc.world = world
    sun = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN')); sun.data.energy = 3.5; sun.data.angle = math.radians(8); sun.rotation_euler = (math.radians(40), math.radians(10), math.radians(30)); sc.collection.objects.link(sun)
    W, H = m['W'] * S, m['H'] * S
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(W, H); cam.location = (W / 2, -H / 2, 60); cam.rotation_euler = (0, 0, 0); cam.data.clip_end = 200
    sc.render.resolution_x = 1600; sc.render.resolution_y = int(1600 * H / W) if W >= H else 1600; sc.render.resolution_percentage = 100
    sc.render.filepath = os.path.join(out_dir, f'{mid}_top.png'); bpy.ops.render.render(write_still=True)
    cam.data.type = 'PERSP'; cam.data.lens = 28; sc.render.resolution_x, sc.render.resolution_y = 1600, 900
    d = max(W, H) * 0.62; cam.location = (W * 0.5, -H * 0.5 - d * 0.75, d * 0.62)
    tgt = bpy.data.objects.new('Centro', None); tgt.location = (W * 0.5, -H * 0.5, 0); sc.collection.objects.link(tgt)
    tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    sc.render.filepath = os.path.join(out_dir, f'{mid}_persp.png'); bpy.ops.render.render(write_still=True)

# ---------------------------------------------------------------- principal
def build(mid, do_render=True):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    m, P = LAY[mid], PAL[mid]
    coll = bpy.data.collections.new('MODEL'); bpy.context.scene.collection.children.link(coll)
    terrain_mat = mat_vc('Terreno', rough=0.95); decor_mat = mat_vc('Decorado', rough=0.85)
    glow_mat = mat_flat('Brillo', P['glow'], rough=0.4, emission=P['glow'])
    water_mat = mat_flat('Agua', P['water'] or (60, 90, 140), rough=0.1, metal=0.1, alpha=0.7)
    build_terrain(mid, m, P, coll, terrain_mat)
    build_decor(mid, m, P, coll, decor_mat, glow_mat, water_mat)
    blend_dir = os.path.join(ROOT, 'art', 'blender', 'maps'); os.makedirs(blend_dir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, f'{mid}.blend'))
    out = os.path.join(ROOT, 'game', 'assets', 'models', 'src', f'map_{mid}.glb')
    bpy.ops.object.select_all(action='DESELECT')
    for o in coll.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_animations=False,
                              export_vertex_color='ACTIVE', export_cameras=False, export_lights=False, export_materials='EXPORT')
    tris = sum(len(p.vertices) - 2 for o in coll.objects for p in o.data.polygons)
    print(f'{mid}: {len(coll.objects)} objetos, {tris} triángulos -> {out}')
    if do_render: render(mid, m, coll, os.path.join(ROOT, 'design', 'levels', 'renders'))

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    which = [a for a in argv if not a.startswith('--')] or ['all']
    ids = list(LAY) if which[0] == 'all' else which
    os.makedirs(os.path.join(ROOT, 'design', 'levels', 'renders'), exist_ok=True)
    for mid in ids: build(mid, do_render='--no-render' not in argv)
