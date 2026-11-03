#!/usr/bin/env python3
"""Retratos de los 15 campeones para la selección (rejilla, lista de aliados, rivales).
Recorta el fotograma frontal de las tiras de verificación de los modelos (production/qa/evidence/modelos/champ_<id>.png,
7 vistas de 320 px), quita el fondo gris plano por inundación desde los bordes y lo compone sobre un degradado del
color del campeón (champion_presentation.json). Salida: game/assets/retratos/<id>.webp y game/src/retratos.js
(data-URI incrustados, para que el dist de un solo archivo los lleve dentro).
   python3 tools/retratos.py"""
import base64, io, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "production/qa/evidence/modelos"; OUT = ROOT / "game/assets/retratos"; OUT.mkdir(parents=True, exist_ok=True)
PRES = {p["id"]: p for p in json.loads((ROOT / "assets/data/champion_presentation.json").read_text(encoding="utf-8"))}
SIZE = 112

def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def retrato(cid):
    im = Image.open(SRC / f"champ_{cid}.png").convert("RGB")
    fw = im.size[0] // 7; frame = im.crop((0, 0, fw, im.size[1]))
    # máscara: inundar el fondo plano desde las cuatro esquinas (tolerancia pequeña para no comerse armaduras grises)
    m = frame.copy(); W, H = m.size
    for xy in [(1, 1), (W - 2, 1), (1, H - 2), (W - 2, H - 2)]:
        ImageDraw.floodfill(m, xy, (255, 0, 255), thresh=18)
    px = m.load(); mask = Image.new("L", m.size, 255); mp = mask.load()
    for y in range(H):
        for x in range(W):
            if px[x, y] == (255, 0, 255): mp[x, y] = 0
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    # recorte: cabeza y torso (parte alta del modelo), cuadrado
    bbox = mask.getbbox() or (0, 0, W, H)
    x0, y0, x1, y1 = bbox; bw = x1 - x0; cx = (x0 + x1) // 2
    side = int(max(bw * 1.15, (y1 - y0) * 0.62)); top = max(0, y0 - int(side * 0.06))
    box = (max(0, cx - side // 2), top, min(W, cx + side // 2), min(H, top + side))
    fg = frame.crop(box).resize((SIZE, SIZE), Image.LANCZOS); a = mask.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
    col = hexrgb(PRES.get(cid, {}).get("color", "#c9a227"))
    bg = Image.new("RGB", (SIZE, SIZE)); bp = bg.load()
    for y in range(SIZE):
        for x in range(SIZE):
            d = ((x - SIZE * 0.5) ** 2 + (y - SIZE * 0.42) ** 2) ** 0.5 / (SIZE * 0.75)
            k = max(0.0, 1 - d); bp[x, y] = tuple(int(c * (0.18 + 0.55 * k)) for c in col)
    bg.paste(fg, (0, 0), a)
    return bg

def main():
    out = {}
    for p in sorted(SRC.glob("champ_*.png")):
        cid = p.stem[len("champ_"):]
        if cid not in PRES: continue   # aspectos (rakhar_lagarto, aurik_dragon) no hacen falta en la rejilla
        im = retrato(cid); im.save(OUT / f"{cid}.webp", "WEBP", quality=82)
        buf = io.BytesIO(); im.save(buf, "WEBP", quality=82); out[cid] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    (ROOT / "game/src/retratos.js").write_text("// GENERADO por tools/retratos.py a partir de las tiras de production/qa/evidence/modelos — no editar.\n"
        "export const RETRATOS = " + json.dumps(out) + ";\n", encoding="utf-8")
    print(f"{len(out)} retratos → game/assets/retratos/*.webp y game/src/retratos.js ({(ROOT / 'game/src/retratos.js').stat().st_size // 1024} KB)")

if __name__ == "__main__": main()
