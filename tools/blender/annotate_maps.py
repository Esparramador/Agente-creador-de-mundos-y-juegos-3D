"""Dibuja el plano de diseño de cada mapa sobre su render ortográfico (design/levels/renders/<id>_top.png):
torres, inhibidores, nexos, fuentes, campamentos, objetivos épicos, altares, reliquias, matorrales,
rocas y carriles, más una leyenda. Salida: design/levels/renders/<id>_plano.png
Uso: python3 tools/blender/annotate_maps.py
"""
import json, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LAY = json.load(open(os.path.join(ROOT, 'assets', 'data', 'map_layouts.json'), encoding='utf-8'))
R = os.path.join(ROOT, 'design', 'levels', 'renders')
TEAM = [(66, 165, 245), (239, 83, 80)]
CAMP_ES = {'golem': 'Gólem (azul)', 'bestia': 'Bestia (roja)', 'lobos': 'Lobos', 'aves': 'Aves', 'roca': 'Roca', 'sapo': 'Sapo'}
EPIC_ES = {'dragon': 'DRAGÓN', 'herald': 'HERALDO / SEÑOR', 'lord': None, 'avatar': 'AVATAR'}
def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()

def plan(mid):
    m = LAY[mid]; img = Image.open(os.path.join(R, f'{mid}_top.png')).convert('RGB'); W, H = img.size
    k = W / m['W']; P = lambda x, y: (x * k, y * k)
    d = ImageDraw.Draw(img, 'RGBA'); f, fs, fb = font(max(12, W // 90)), font(max(10, W // 120)), font(max(16, W // 60))
    def label(x, y, t, col=(255, 255, 255), fnt=None, anchor='mm'):
        fnt = fnt or fs; w = d.textlength(t, font=fnt); x = min(max(x, w / 2 + 6), W - w / 2 - 6); y = min(max(y, fnt.size), H - fnt.size)
        d.text((x, y), t, fill=col, font=fnt, anchor=anchor, stroke_width=3, stroke_fill=(0, 0, 0))
    for name, lane in m['lanes'].items():
        mid_i = len(lane) // 2; (ax, ay), (bx, by) = lane[mid_i - 1] if mid_i else lane[0], lane[mid_i]
        label(*P((ax + bx) / 2, (ay + by) / 2 - 260), {'top': 'CARRIL SUPERIOR', 'mid': 'CARRIL CENTRAL', 'bot': 'CARRIL INFERIOR'}[name], (255, 235, 180), f)
    for (x, y, r) in m['brushes']: d.ellipse([*P(x - r, y - r), *P(x + r, y + r)], outline=(120, 220, 120, 230), width=2)
    for (x, y, r) in m['rocks']: d.ellipse([*P(x - r, y - r), *P(x + r, y + r)], outline=(200, 200, 200, 200), width=2)
    for t in (0, 1):
        for (x, y, lane, tier) in m['towers'][t]:
            cx, cy = P(x, y); s = max(7, W // 160); d.rectangle([cx - s, cy - s, cx + s, cy + s], fill=TEAM[t] + (255,), outline=(0, 0, 0), width=2)
            label(cx, cy - 2.4 * s, f'T{tier}' if tier < 4 else 'TN', TEAM[t])
        for (x, y, lane) in m['inhibs'][t]:
            cx, cy = P(x, y); s = max(8, W // 140); d.polygon([(cx, cy - s), (cx + s, cy), (cx, cy + s), (cx - s, cy)], fill=TEAM[t] + (255,), outline=(0, 0, 0)); label(cx, cy + 2.2 * s, 'INH', TEAM[t])
        nx, ny = P(*m['nexus'][t]); s = max(12, W // 90); d.regular_polygon((nx, ny, s), 6, fill=TEAM[t] + (255,), outline=(0, 0, 0)); label(nx, ny + 2 * s, 'NEXO', TEAM[t], f)
        fx, fy = P(*m['fountain'][t]); r = 900 * k; d.ellipse([fx - r, fy - r, fx + r, fy + r], outline=TEAM[t] + (255,), width=3)
        label(fx, fy, ['FUENTE AURORA', 'FUENTE CREPÚSCULO'][t], TEAM[t], f)
    for (typ, x, y, side) in m['camps']:
        cx, cy = P(x, y); d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(255, 210, 120), outline=(0, 0, 0)); label(cx, cy + 14, CAMP_ES[typ], (255, 220, 160))
    for key, pos in (m['epic'] or {}).items():
        if not EPIC_ES.get(key): continue
        cx, cy = P(*pos); r = 520 * k; d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(206, 147, 216, 255), width=4); label(cx, cy, EPIC_ES[key], (230, 190, 255), fb)
    for (name, x, y) in m['altars']:
        cx, cy = P(x, y); r = 300 * k; d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 215, 90), width=4); label(cx, cy, f'ALTAR {name.upper()}', (255, 225, 120), f)
    for (x, y) in m['relics']: cx, cy = P(x, y); d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=(105, 240, 174), outline=(0, 0, 0)); label(cx, cy - 16, 'Reliquia', (150, 255, 200))
    if m['bounds']:
        for yy in (m['bounds']['y0'], m['bounds']['y1']): d.line([P(0, yy), P(m['W'], yy)], fill=(255, 255, 255, 120), width=2)
    # leyenda
    lg = [('■', TEAM[0], 'Torre Aurora (T1 exterior → T3, TN nexo)'), ('■', TEAM[1], 'Torre Crepúsculo'), ('◆', (220, 220, 220), 'Inhibidor'), ('⬢', (220, 220, 220), 'Nexo'),
          ('●', (255, 210, 120), 'Campamento de jungla'), ('○', (120, 220, 120), 'Matorral (oculta)'), ('○', (200, 200, 200), 'Roca (bloquea)')]
    if m['altars']: lg.append(('○', (255, 215, 90), 'Altar (captura 6 s)'))
    if m['relics']: lg.append(('●', (105, 240, 174), 'Reliquia de vida (60 s)'))
    if m['epic']: lg.append(('○', (206, 147, 216), 'Objetivo épico'))
    lh = fs.size + 8; bw = W // 3.2; bh = lh * len(lg) + 16; x0, y0 = W - bw - 10, H - bh - 10
    if m['bounds']:  # mapa alargado: la leyenda va en una franja debajo del plano
        ext = Image.new('RGB', (W, H + bh + 20), (12, 16, 22)); ext.paste(img, (0, 0)); img = ext; d = ImageDraw.Draw(img, 'RGBA'); x0, y0 = 10, H + 10
    d.rectangle([x0, y0, x0 + bw, y0 + bh], fill=(0, 0, 0, 170))
    for i, (sym, col, txt) in enumerate(lg):
        d.text((x0 + 12, y0 + 8 + i * lh), sym, fill=col, font=fs); d.text((x0 + 34, y0 + 8 + i * lh), txt, fill=(240, 240, 240), font=fs)
    label(W // 2, 22, {'grieta_ceniza': 'LA GRIETA DE CENIZA · 5v5', 'puente_niebla': 'PUENTE DE LA NIEBLA · 5v5 ARAM', 'ruinas_eclipse': 'RUINAS DEL ECLIPSE · 3v3 DOMINIO'}[mid], (255, 230, 150), fb)
    out = os.path.join(R, f'{mid}_plano.png'); img.save(out); print('Plano:', out)

if __name__ == '__main__':
    for mid in LAY: plan(mid)
