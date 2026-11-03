"""Mide los fotogramas por segundo del juego en un Chrome REAL con GPU (no SwiftShader).

Por qué existe: el e2e usa Chromium con SwiftShader (render por CPU), que sirve para
comprobar que todo funciona pero no para medir rendimiento. Y el panel del navegador
de la plataforma da 0 fps si está oculto. Esto abre Google Chrome por Playwright,
pide ANGLE/Metal, comprueba qué renderizador ha tocado de verdad y mide.

Uso (fuera del sandbox, que es donde Chrome puede usar la GPU):
    python3 game/tools/fps_probe.py                 # escritorio 1600×900
    python3 game/tools/fps_probe.py --mobile        # 844×390, táctil, ?touch=1
    python3 game/tools/fps_probe.py --visible       # con ventana (si headless no da GPU)
    python3 game/tools/fps_probe.py --min 55        # falla (exit 1) por debajo de ese umbral

Escribe el resultado en production/qa/evidence/fps-<escritorio|movil>.json.
"""
import argparse, json, pathlib, sys, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / 'dist' / 'coronas-de-ceniza.html'
EVID = ROOT.parent / 'production' / 'qa' / 'evidence'

ap = argparse.ArgumentParser()
ap.add_argument('--mobile', action='store_true')
ap.add_argument('--visible', action='store_true')
ap.add_argument('--min', type=float, default=0, help='umbral de fps; por debajo sale con 1')
ap.add_argument('--seconds', type=float, default=6)
ap.add_argument('--minute', type=float, default=5, help='minuto de partida en que se mide')
a = ap.parse_args()

GPU_ARGS = ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']


def medir(p, visible):
    b = p.chromium.launch(channel='chrome', headless=not visible, args=GPU_ARGS)
    ctx_kw = {'viewport': {'width': 844, 'height': 390}, 'is_mobile': True, 'has_touch': True,
              'device_scale_factor': 2} if a.mobile else {'viewport': {'width': 1600, 'height': 900}}
    ctx = b.new_context(**ctx_kw); pg = ctx.new_page(); pg.set_default_timeout(180000)
    errores = []; pg.on('pageerror', lambda e: errores.append(str(e)))
    url = HTML.as_uri() + ('?touch=1' if a.mobile else '')
    pg.goto(url); time.sleep(0.5)
    renderer = pg.evaluate("""() => { const c = document.createElement('canvas');
        const gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return 'sin WebGL';
        const d = gl.getExtension('WEBGL_debug_renderer_info');
        return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }""")
    pg.click('[data-map="grieta_ceniza"]'); pg.click('[data-diff="normal"]'); pg.click('[data-champ="kaelith"]'); pg.click('#play')
    pg.wait_for_function("() => window.__cdc && window.__cdc.G && !document.getElementById('loading').classList.contains('on')")
    time.sleep(1.0)
    # avanzar la simulación hasta el minuto pedido (muchas unidades en pantalla) y medir con rAF real
    pg.evaluate(f"() => {{ const G = __cdc.G; for (let i = 0; i < {int(a.minute * 60 * 30)}; i++) G.step(); }}")
    time.sleep(0.5)
    res = pg.evaluate(f"""() => new Promise(done => {{
        const t0 = performance.now(); let n = 0, worst = 0, last = t0;
        function tick(t) {{ n++; worst = Math.max(worst, t - last); last = t;
            if (t - t0 < {a.seconds * 1000}) requestAnimationFrame(tick);
            else done({{ fps: n / ((t - t0) / 1000), worstFrameMs: worst,
                         tris: __cdc.r3d ? __cdc.r3d.r.info.render.triangles : null,
                         calls: __cdc.r3d ? __cdc.r3d.r.info.render.calls : null,
                         units: __cdc.G.units.filter(u => u.alive).length, modo3d: !!__cdc.r3d }}); }}
        requestAnimationFrame(tick); }})""")
    res.update({'renderer': renderer, 'viewport': ctx_kw['viewport'], 'mobile': a.mobile, 'visible': visible,
                'minuto': a.minute, 'errores': errores[:5]})
    b.close()
    return res


with sync_playwright() as p:
    r = medir(p, a.visible)
    if 'SwiftShader' in (r['renderer'] or '') and not a.visible:
        print(f"headless ha caído en SwiftShader ({r['renderer']}); repito con ventana")
        r = medir(p, True)

EVID.mkdir(parents=True, exist_ok=True)
out = EVID / ('fps-movil.json' if a.mobile else 'fps-escritorio.json')
out.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"{r['fps']:.1f} fps · peor fotograma {r['worstFrameMs']:.0f} ms · {r['tris']} triángulos · {r['calls']} llamadas · "
      f"{r['units']} unidades · {r['renderer']} · {'3D' if r['modo3d'] else '2D'} → {out}")
if r['errores']: print('errores de página:', r['errores'])
sys.exit(1 if a.min and r['fps'] < a.min else 0)
