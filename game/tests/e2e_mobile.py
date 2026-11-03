"""Prueba de extremo a extremo de los controles táctiles (Chromium emulando un iPhone 13 apaisado, Playwright).

Juega con el dedo: joystick (CDP Input.dispatchTouchEvent), toque en Q (lanzamiento inteligente), arrastre desde Q
(puntería), botón de ataque, minimapa arriba-izquierda, tienda y marcador sin scroll horizontal, y guarda 5 capturas en
production/qa/evidence/2026-11-02-movil-{menu,partida,habilidad,tienda,marcador}.png.

Uso:  python3 game/tests/e2e_mobile.py [ruta/al/html]
Requiere: pip install playwright && playwright install chromium
"""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'coronas-de-ceniza.html'
EVID = ROOT.parent / 'production' / 'qa' / 'evidence'; EVID.mkdir(parents=True, exist_ok=True)
DATE = '2026-11-02'
URL = HTML.as_uri() + '?touch=1'
results, errors = [], []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail and not cond else ''))

def js(pg, code): return pg.evaluate(code)
def fast(pg, seconds): js(pg, f"() => {{ const G = __cdc.G; for (let i = 0; i < {int(seconds * 30)}; i++) G.step(); }}")
def ready(pg):
    js(pg, "() => { const G = __cdc.G, p = G.player; if (!p.alive) G.respawn(p); p.cc = []; p.channel = null; p.dash = null; p.hp = p.st.maxHp; }")
def frames(pg, n=2):
    for _ in range(n): pg.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
def rect(pg, id_):  # centro de un botón táctil (px CSS)
    return js(pg, f"() => {{ const r = __cdc.touch.rects.find(r => r.id === '{id_}'); return [r.cx, r.cy, r.w, r.h]; }}")
def shot(pg, name): pg.screenshot(path=str(EVID / f'{DATE}-movil-{name}.png'))

def touch_start(cdp, x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
def touch_move(cdp, x, y): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y}]})
def touch_end(cdp): cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    dev = {**p.devices['iPhone 13'], 'viewport': {'width': 844, 'height': 390}, 'is_mobile': True, 'has_touch': True}
    ctx = b.new_context(**dev); pg = ctx.new_page(); pg.set_default_timeout(180000)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    cdp = ctx.new_cdp_session(pg)

    # ---------- menú en una columna ----------
    pg.goto(URL); time.sleep(0.4)
    check('menú móvil: una columna, sin scroll horizontal', js(pg, "() => getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length === 1 && document.documentElement.scrollWidth <= innerWidth"))
    check('menú móvil: botón JUGAR de al menos 44 px', js(pg, "() => document.getElementById('play').getBoundingClientRect().height >= 44"))
    check('#rotate oculto en apaisado', not pg.is_visible('#rotate'))
    pg.click('[data-map="grieta_ceniza"]'); pg.click('[data-champ="kaelith"]'); shot(pg, 'menu')
    pg.click('#play')
    pg.wait_for_function("() => window.__cdc && window.__cdc.G && !document.getElementById('loading').classList.contains('on')", timeout=180000); time.sleep(1.0)

    # ---------- HUD y botones ----------
    check('modo móvil activo (S.mobile) y __cdc.touch', js(pg, "() => __cdc.S.mobile === true && !!__cdc.touch"))
    check('#touchUI visible con 15 botones', pg.is_visible('#touchUI') and pg.locator('#touchUI .tb').count() == 15)
    check('Q/W/E/R de al menos 54 px CSS', js(pg, "() => [...document.querySelectorAll('#touchUI .tb-ab')].every(b => b.getBoundingClientRect().width >= 54 && b.getBoundingClientRect().height >= 54)"))
    check('lienzo HUD con dpr (ancho = 844 × dpr, tope 2)', js(pg, "() => { const c = document.getElementById('game'), d = Math.min(devicePixelRatio, 2); return Math.abs(c.width - 844 * d) < 2 && __cdc.R.dpr === d && __cdc.R.W === 844; }"))
    mini = js(pg, "() => __cdc.R.mini")
    check('minimapa arriba-izquierda', mini and mini['x0'] < 60 and mini['y0'] < 60, str(mini))
    check('cámara bloqueada por defecto', js(pg, "() => __cdc.R.cam.locked === true"))
    check('tienda oculta fuera de la fuente / visible en la fuente', js(pg, "() => { const G = __cdc.G, p = G.player; const b = document.querySelector('#touchUI .tb-shop'); __cdc.touch.refresh(); return G.inFountain(p) ? b.style.display !== 'none' : b.style.display === 'none'; }"))
    shot(pg, 'partida')

    # ---------- joystick: arrastre con el dedo en la mitad izquierda ----------
    ready(pg); x0, y0 = js(pg, "() => [__cdc.G.player.x, __cdc.G.player.y]")
    touch_start(cdp, 200, 250); touch_move(cdp, 260, 250); time.sleep(0.25); frames(pg, 2)
    joy = js(pg, "() => { const j = __cdc.touch.joy; return j && { dx: j.dx, dy: j.dy, mag: j.mag, mv: !!__cdc.G.player.moveTo }; }")
    check('joystick: vector +x y orden de movimiento', joy and joy['dx'] > 0.99 and joy['mag'] > 0.99 and joy['mv'], str(joy))
    fast(pg, 2); frames(pg, 2)
    x1 = js(pg, "() => __cdc.G.player.x")
    check('joystick: el campeón avanza > 200 u', x1 - x0 > 200, f'{x0:.0f} → {x1:.0f}')
    touch_end(cdp); time.sleep(0.1)
    check('soltar el joystick = detenerse', js(pg, "() => !__cdc.touch.joy && !__cdc.G.player.moveTo"))

    # ---------- Q: toque = lanzamiento inteligente (tras subir rango) ----------
    ready(pg); js(pg, "() => { const G = __cdc.G, p = G.player; G.cmdLevel(p, 'Q'); p.cds.Q = 0; }")
    check('rango de Q = 1 antes del toque', js(pg, "() => __cdc.G.player.ranks.Q") == 1)
    qx, qy, qw, qh = rect(pg, 'abQ'); pg.touchscreen.tap(qx, qy); time.sleep(0.25)
    check('toque en Q lanza la habilidad', js(pg, "() => (__cdc.G.player.cds.Q || 0) > 0 || __cdc.G.player.recast.Q > __cdc.G.t"))

    # ---------- Q: arrastre desde el botón = puntería (anillo de alcance) y soltar = lanzar ----------
    ready(pg); js(pg, "() => { const p = __cdc.G.player; p.cds.Q = 0; p.recast.Q = 0; }")
    touch_start(cdp, qx, qy); touch_move(cdp, qx - 45, qy - 30); time.sleep(0.2); frames(pg, 2)
    aim = js(pg, "() => { const a = __cdc.touch.aim; return a && { cancel: a.cancel, hint: __cdc.R.rangeHint, d: Math.hypot(a.x - __cdc.G.player.x, a.y - __cdc.G.player.y) }; }")
    check('arrastre desde Q: puntería activa con anillo de alcance', aim and not aim['cancel'] and aim['hint'] > 0 and aim['d'] <= aim['hint'] + 1, str(aim))
    shot(pg, 'habilidad')
    touch_end(cdp); time.sleep(0.25)
    check('soltar = lanzar la Q apuntada', js(pg, "() => (__cdc.G.player.cds.Q || 0) > 0 || __cdc.G.player.recast.Q > __cdc.G.t") and js(pg, "() => !__cdc.touch.aim && !__cdc.R.rangeHint"))
    # volver al centro = cancelar
    ready(pg); js(pg, "() => { const p = __cdc.G.player; p.cds.Q = 0; p.recast.Q = 0; }")
    touch_start(cdp, qx, qy); touch_move(cdp, qx - 45, qy); time.sleep(0.1); touch_move(cdp, qx + 5, qy); time.sleep(0.1); touch_end(cdp); time.sleep(0.2)
    check('volver al centro cancela la habilidad', js(pg, "() => !(__cdc.G.player.cds.Q > 0) && !__cdc.touch.aim"))
    # pulsación larga = subir rango
    js(pg, "() => { const p = __cdc.G.player; p.level = 4; p.xp = 0; }")
    r0 = js(pg, "() => __cdc.G.player.ranks.Q"); touch_start(cdp, qx, qy); time.sleep(0.7); touch_end(cdp); time.sleep(0.1)
    check('pulsación larga en Q sube el rango', js(pg, "() => __cdc.G.player.ranks.Q") == r0 + 1)

    # ---------- ataque: toque fija el objetivo (campeón > súbdito > monstruo) ----------
    fast(pg, 70)
    js(pg, "() => { const G = __cdc.G, p = G.player, m = G.units.find(u => u.alive && u.kind === 'minion' && u.team === 1); p.x = m.x - 250; p.y = m.y + 250; G.updateVision(); }")
    ready(pg); frames(pg, 3)
    ax, ay, _, _ = rect(pg, 'attack'); pg.touchscreen.tap(ax, ay); time.sleep(0.2)
    check('toque en ATAQUE fija p.target', js(pg, "() => !!__cdc.G.player.target && __cdc.G.player.target.team === 1"))
    mx, my, _, _ = rect(pg, 'attackMinion'); pg.touchscreen.tap(mx, my); time.sleep(0.2)
    check('sub-botón SÚBDITO apunta a un súbdito', js(pg, "() => __cdc.G.player.target && __cdc.G.player.target.kind === 'minion'"))

    # ---------- cámara: arrastre temporal en la mitad derecha y pellizco ----------
    cx0, cy0 = js(pg, "() => [__cdc.R.cam.x, __cdc.R.cam.y]")
    touch_start(cdp, 560, 200); touch_move(cdp, 460, 200); time.sleep(0.15); frames(pg, 1)
    moved = js(pg, f"() => !__cdc.R.cam.locked && Math.hypot(__cdc.R.cam.x - {cx0}, __cdc.R.cam.y - {cy0}) > 50")
    touch_end(cdp); frames(pg, 2)
    check('arrastre en la mitad derecha desplaza la cámara y al soltar vuelve al bloqueo', moved and js(pg, "() => __cdc.R.cam.locked === true"))
    z0 = js(pg, "() => __cdc.R.cam.zoom")
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 500, 'y': 200, 'id': 0}, {'x': 600, 'y': 200, 'id': 1}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 480, 'y': 200, 'id': 0}, {'x': 660, 'y': 200, 'id': 1}]}); time.sleep(0.1)
    z1 = js(pg, "() => __cdc.R.cam.zoom"); touch_end(cdp)
    lim = js(pg, "() => __cdc.R.r3d ? [0.6, 1.6] : [0.8, 1.15]")
    check('pellizco = zoom dentro de los límites', z1 > z0 and lim[0] <= z1 <= lim[1], f'{z0} → {z1}')

    # ---------- minimapa: toque mueve la cámara ----------
    touch_start(cdp, mini['x0'] + mini['w'] * 0.8, mini['y0'] + mini['h'] * 0.2); time.sleep(0.1); touch_end(cdp); frames(pg, 1)
    check('toque en el minimapa mueve la cámara', js(pg, "() => !__cdc.R.cam.locked && __cdc.R.cam.x > __cdc.G.map.W * 0.6"))
    lx, ly, _, _ = rect(pg, 'lock'); pg.touchscreen.tap(lx, ly); time.sleep(0.1)
    check('candado vuelve a bloquear la cámara', js(pg, "() => __cdc.R.cam.locked === true"))

    # ---------- tienda y marcador sin scroll horizontal ----------
    js(pg, "() => __cdc.UI.toggleShop(true)"); time.sleep(0.3)
    fit = js(pg, "() => { const p = document.querySelector('#shop .panel').getBoundingClientRect(); return { r: p.right, w: innerWidth, sw: document.documentElement.scrollWidth, cols: getComputedStyle(document.getElementById('shopItems')).gridTemplateColumns.split(' ').length }; }")
    check('tienda: cabe en pantalla sin scroll horizontal', fit['r'] <= fit['w'] + 1 and fit['sw'] <= fit['w'] and fit['cols'] >= 4, str(fit))
    shot(pg, 'tienda'); js(pg, "() => __cdc.UI.toggleShop(false)")
    sx, sy, _, _ = rect(pg, 'score'); pg.touchscreen.tap(sx, sy); time.sleep(0.3)
    fit = js(pg, "() => { const p = document.querySelector('#score .panel').getBoundingClientRect(); return { vis: document.getElementById('score').classList.contains('on'), r: p.right, l: p.left, w: innerWidth, sw: document.documentElement.scrollWidth }; }")
    check('marcador: se abre con el botón y cabe en pantalla', fit['vis'] and fit['l'] >= -1 and fit['r'] <= fit['w'] + 1 and fit['sw'] <= fit['w'], str(fit))
    shot(pg, 'marcador'); pg.touchscreen.tap(30, 380); time.sleep(0.2)  # fuera del panel
    check('marcador: tocar fuera lo cierra', not js(pg, "() => document.getElementById('score').classList.contains('on')"))

    # ---------- pausa con opciones nuevas ----------
    px, py, _, _ = rect(pg, 'pause'); pg.touchscreen.tap(px, py); time.sleep(0.3)
    check('pausa: opciones de controles táctiles y efectos', pg.is_visible('#pause') and pg.locator('#oTouch').count() == 1 and pg.locator('#oVfx').count() == 1)
    pg.click('#resumeBtn')
    b.close()

for n in ['menu', 'partida', 'habilidad', 'tienda', 'marcador']: check(f'captura {DATE}-movil-{n}.png', (EVID / f'{DATE}-movil-{n}.png').exists())
check('sin errores de JavaScript en consola', not errors, '; '.join(errors[:5]))
ok = sum(1 for r in results if r[1]); print(f'\n{ok}/{len(results)} comprobaciones superadas · capturas en {EVID}')
sys.exit(0 if ok == len(results) else 1)
