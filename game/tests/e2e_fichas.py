"""E2E de la ficha de campeón y los efectos GSAP (agente G), en Chromium real con Playwright.

Empaqueta su propio bundle de prueba (main.js + fichas.js + vfx.js, con los modelos incrustados igual que
game/tools/bundle.mjs) en $TMPDIR para no depender de que B haya integrado todavía los módulos en main.js.
Abre la ficha de Kaelith, Lyra y Rakhar, captura production/qa/evidence/2026-11-02-ficha-{id}.png, comprueba
que gsap va en el bundle, que una aparición cambia la escala (modo de prueba con Object3D falso) y que, con la
partida en 3D, initVfx se engancha al mundo y dibuja efectos reales (captura de una reaparición).

Uso:  python3 game/tests/e2e_fichas.py          Requiere: pip install playwright && playwright install chromium
"""
import os, re, sys, time, json, pathlib, subprocess
from playwright.sync_api import sync_playwright

GAME = pathlib.Path(__file__).resolve().parent.parent; ROOT = GAME.parent
EVID = ROOT / 'production' / 'qa' / 'evidence'; EVID.mkdir(parents=True, exist_ok=True)
TMP = pathlib.Path(os.environ.get('TMPDIR', '/tmp')) / 'cdc-fichas'; TMP.mkdir(parents=True, exist_ok=True)
FECHA = '2026-11-02'
results, errors = [], []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail and not cond else ''))

def js(pg, code): return pg.evaluate(code)

# ---------- bundle de prueba ----------
ENTRY = GAME / 'tests' / '_entry_fichas.tmp.js'
ENTRY.write_text("""import '../src/main.js';
import { montarFichas } from '../src/fichas.js';
import { initVfx } from '../src/vfx.js';
window.__fichasApi = montarFichas({ onElegir: (id, skin) => { const st = window.__cdc.state; st.champ = id; st.skin = skin; window.__cdc.renderMenu(); } });
window.__initVfx = initVfx;
""", encoding='utf-8')
BUILD = TMP / 'build.mjs'
BUILD.write_text(f"""import {{ build }} from {json.dumps(str(GAME / 'node_modules' / 'esbuild' / 'lib' / 'main.js'))};
import {{ readFileSync, writeFileSync }} from 'node:fs';
const root = {json.dumps(str(GAME))};
const res = await build({{ entryPoints: [root + '/tests/_entry_fichas.tmp.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none', absWorkingDir: root }});
const js = res.outputFiles[0].text; const html = readFileSync(root + '/index.html', 'utf8');
const tag = '<script type="module" src="src/main.js"></script>';
const modelsSrc = readFileSync(root + '/src/models.js', 'utf8');
const files = [...modelsSrc.match(/MODEL_FILES = \\[([^\\]]*)\\]/s)[1].matchAll(/'([\\w-]+)'/g)].map(x => x[1]);
files.push(...[...modelsSrc.match(/MAP_FILES = \\{{([^}}]*)\\}}/s)[1].matchAll(/: '([\\w-]+)'/g)].map(x => x[1]));
const models = Object.fromEntries(files.map(n => [n, readFileSync(root + '/assets/models/' + n + '.glb').toString('base64')]));
writeFileSync({json.dumps(str(TMP / 'juego.js'))}, js);
writeFileSync({json.dumps(str(TMP / 'fichas.html'))}, html.replace(tag, () => '<script>window.__MODELS=' + JSON.stringify(models) + ';</script>\\n<script>' + js + '</script>'));
console.log('bundle de prueba', (js.length / 1024 | 0), 'KB');
""", encoding='utf-8')
env = dict(os.environ, PATH=os.path.expanduser('~/.local/bin') + os.pathsep + os.environ.get('PATH', ''))
try:
    out = subprocess.run(['node', str(BUILD)], capture_output=True, text=True, env=env, cwd=str(GAME))
    print(out.stdout.strip()); check('bundle de prueba generado', out.returncode == 0, out.stderr[-800:])
finally:
    ENTRY.unlink(missing_ok=True)
HTML = TMP / 'fichas.html'
bundle_js = (TMP / 'juego.js').read_text(encoding='utf-8') if (TMP / 'juego.js').exists() else ''
check('gsap está en el bundle', 'gsap' in bundle_js and 'back.out' in bundle_js)
dist = GAME / 'dist' / 'web' / 'juego.js'
if dist.exists(): print(('INFO dist/web/juego.js ya lleva gsap' if 'gsap' in dist.read_text(encoding='utf-8', errors='ignore') else 'INFO dist/web/juego.js aún sin gsap (falta la integración de B en main.js)'))

def esperar_cierre(pg):  # el cierre es un tween de 0,2 s; con swiftshader un tick de rAF puede tardar más
    try: pg.wait_for_function("() => !document.getElementById('fichas').classList.contains('on')", timeout=10000); return True
    except Exception: return False

def wait_start(pg):
    pg.wait_for_function("() => window.__cdc && window.__cdc.G && !document.getElementById('loading').classList.contains('on')", timeout=180000); time.sleep(1.0)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900}); pg.set_default_timeout(120000)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.goto(HTML.as_uri()); time.sleep(0.4)
    check('fichas.js se monta solo (<div id="fichas"> y botón flotante)', js(pg, "() => !!document.getElementById('fichas') && !!document.getElementById('fichaBtn') && !!window.__fichas"))
    check('botón «Ficha» oculto sin campeón', js(pg, "() => !document.getElementById('fichaBtn').classList.contains('on')"))

    # ---------- tres fichas con captura ----------
    for cid, esperado in [('kaelith', 'melee'), ('lyra', 'ranged'), ('rakhar', 'melee')]:
        pg.click(f'[data-champ="{cid}"]'); time.sleep(0.2)
        check(f'{cid}: el botón «Ficha» aparece al seleccionar', js(pg, "() => document.getElementById('fichaBtn').classList.contains('on')"))
        pg.click('#fichaBtn'); time.sleep(0.3)
        check(f'{cid}: la ficha se abre', js(pg, "() => document.getElementById('fichas').classList.contains('on')"))
        n = js(pg, "() => document.querySelectorAll('#fichas .ab').length")
        check(f'{cid}: pasiva + 4 habilidades con números', n == 5 and js(pg, "() => [...document.querySelectorAll('#fichas .ab')].slice(1).every(e => /Valor (\\d|sin daño)/.test(e.textContent))"), str(n))
        tipo = js(pg, "() => document.querySelector('#fichas .tipo').textContent")
        check(f'{cid}: tipo de ataque en la ficha', (esperado == 'melee' and 'Cuerpo' in tipo) or (esperado == 'ranged' and 'distancia' in tipo), tipo)
        try: pg.wait_for_function("() => /modelo |retrato 2D/.test(document.getElementById('fichaModelo').textContent)", timeout=60000)
        except Exception: pass
        info = js(pg, "() => document.getElementById('fichaModelo').textContent")
        check(f'{cid}: retrato 3D cargado', info.startswith('modelo '), info)
        if cid == 'rakhar':
            check('rakhar: selector con dos aspectos', js(pg, "() => document.querySelectorAll('#fichas [data-skin]').length") == 2)
            pg.click('#fichas [data-skin="lagarto"]'); time.sleep(0.3)
            try: pg.wait_for_function("() => /modelo /.test(document.getElementById('fichaModelo').textContent)", timeout=60000)
            except Exception: pass
            check('rakhar: aspecto lagarto fijado (fichas.skins.rakhar)', js(pg, "() => window.__fichas.skins.rakhar") == 'lagarto')
            check('rakhar: el retrato cambia al modelo del lagarto', js(pg, "() => window.__fichas.retrato && window.__fichas.retrato.modelo") in ('champ_rakhar_lagarto', 'lagarto'))
        pg.click('#fichaVer'); time.sleep(1.3)
        vivos = js(pg, "() => { const r = window.__fichas.retrato; return r ? r.fx.vivos.size + r.fx.particulas.vivas : -1 }")
        check(f'{cid}: «Ver ataques» dibuja efectos en el retrato', vivos > 0, str(vivos))
        pg.screenshot(path=str(EVID / f'{FECHA}-ficha-{cid}.png'))
        check(f'{cid}: captura {FECHA}-ficha-{cid}.png', (EVID / f'{FECHA}-ficha-{cid}.png').stat().st_size > 20000)
        if cid == 'rakhar':
            pg.click('#fichaElegir'); cerrada = esperar_cierre(pg)
            check('rakhar: «Elegir» cierra la ficha y deja el aspecto en state.skin', cerrada and js(pg, "() => __cdc.state.champ === 'rakhar' && __cdc.state.skin === 'lagarto'"))
        else:
            pg.keyboard.press('Escape')
            check(f'{cid}: Esc cierra la ficha', esperar_cierre(pg))

    # responsive 844×390
    pg.set_viewport_size({'width': 844, 'height': 390}); pg.click('[data-champ="lyra"]'); pg.click('#fichaBtn'); time.sleep(0.5)
    ov = js(pg, "() => { const c = document.querySelector('#fichas .fcard').getBoundingClientRect(); return { w: c.width, h: c.height, right: c.right, bottom: c.bottom, sw: document.querySelector('#fichas .fbody').scrollHeight } }")
    check('ficha cabe en 844×390 (sin desbordar la ventana)', ov['right'] <= 845 and ov['bottom'] <= 391 and ov['w'] > 600, str(ov))
    pg.screenshot(path=str(EVID / f'{FECHA}-ficha-movil-844x390.png')); pg.keyboard.press('Escape'); pg.set_viewport_size({'width': 1600, 'height': 900})

    # ---------- vfx: modo de prueba sin D (Object3D falso) ----------
    pr = js(pg, "() => { const api = window.__initVfx(null, null, { vfx: 'alto' }); return api.probe('spawn'); }")
    check('aparición cambia la escala (Object3D falso): 0 → 1 con back.out', pr and pr['antes'] < 0.01 and abs(pr['despues'] - 1) < 1e-3, str(pr))
    check('gsap 3.x cargado dentro del bundle', bool(pr) and str(pr.get('gsap', '')).startswith('3.'), str(pr))
    pr2 = js(pg, "() => window.__initVfx(null, null, {}).probe('death')")
    check('muerte: la escala no se rompe y el modelo cae', pr2 and abs(pr2['despues'] - 1) < 1e-3, str(pr2))
    check('vfx off: initVfx no falla y queda inactivo', js(pg, "() => { const a = window.__initVfx({ scene: {} }, null, { vfx: 'off' }); return a.activo === false && a.nivel === 0 }"))

    # ---------- vfx enganchado a una partida 3D real ----------
    pg.goto(HTML.as_uri()); time.sleep(0.3)
    pg.click('[data-map="grieta_ceniza"]'); pg.click('[data-champ="kaelith"]'); pg.click('#play'); wait_start(pg)
    if js(pg, "() => !!__cdc.r3d"):
        st = js(pg, """() => { const api = window.__initVfx(__cdc.r3d, __cdc.G, __cdc.S); const G = __cdc.G;
          for (let i = 0; i < 30; i++) G.step();
          return { activo: api.activo, hooks: typeof __cdc.r3d.onUnitSpawn === 'function' && typeof __cdc.r3d.onCast === 'function', vivos: api.fx.vivos.size, part: api.fx.particulas.max } }""")
        check('initVfx se engancha al World3D (ganchos + partículas ≤ 200)', st['activo'] and st['hooks'] and st['part'] == 200, str(st))
        # reaparición forzada del jugador, lanzamiento y muerte: efectos reales en la escena
        n = js(pg, """() => new Promise(res => { const G = __cdc.G, p = G.player, R3 = __cdc.r3d, api = window.__vfx;
          const obj = R3.objs.get(p.id); api.fx.respawn(obj, 0x42a5f5); api.fx.cast(obj, 'estela', 0xffe082);
          const tower = G.units.find(u => u.kind === 'tower' && u.team === 1); if (tower) { tower.alive = false; }
          let f = 0; const tick = () => { if (++f < 6) requestAnimationFrame(tick); else res({ vivos: api.fx.vivos.size, part: api.fx.particulas.vivas, shake: api.fx.shake.amp }); }; requestAnimationFrame(tick); })""")
        check('reaparición + estela + derrumbe de torre dibujan mallas y partículas', n['vivos'] > 0 and n['part'] > 0, str(n))
        time.sleep(0.2); pg.screenshot(path=str(EVID / f'{FECHA}-vfx-reaparicion.png'))
        check('30 pasos de partida con vfx sin errores de JS', not [e for e in errors if 'vfx' in e.lower() or 'gsap' in e.lower()], '; '.join(errors[:3]))
    else:
        check('partida en 3D (WebGL) disponible para probar los vfx', False, 'sin r3d')
    b.close()

check('sin errores de JavaScript en consola', not errors, '; '.join(errors[:5]))
ok = sum(1 for r in results if r[1]); print(f'\n{ok}/{len(results)} comprobaciones superadas · capturas en {EVID}')
sys.exit(0 if ok == len(results) else 1)
