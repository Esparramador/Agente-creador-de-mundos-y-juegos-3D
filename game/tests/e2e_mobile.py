"""Prueba de extremo a extremo de los controles táctiles (Chromium emulando un iPhone 13 apaisado, Playwright).

Juega con el dedo: joystick (CDP Input.dispatchTouchEvent), toque en Q (lanzamiento inteligente), arrastre desde Q
(puntería), botón de ataque, minimapa arriba-izquierda, tienda y marcador sin scroll horizontal; y comprueba la disposición
Wild Rift (design/ux/wild-rift-disposicion.md): minimapa al 15 % en (7 %, 2 %), barra del objetivo al fijar, compra rápida
en la fuente (y aviso fuera), anillo de enfriamiento, definitiva encima del ataque, columna derecha. Guarda 5 capturas en
production/qa/evidence/2026-11-03-movil-{menu,partida,objetivo,habilidad,compra}.png.

Uso:  python3 game/tests/e2e_mobile.py [ruta/al/html]
Requiere: pip install playwright && playwright install chromium
"""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'coronas-de-ceniza.html'
EVID = ROOT.parent / 'production' / 'qa' / 'evidence'; EVID.mkdir(parents=True, exist_ok=True)
DATE = '2026-11-03'
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
    # La selección es ahora la de Wild Rift (aliados | rejilla | rivales) también en apaisado móvil: lo que importa es que quepa sin scroll horizontal
    check('menú móvil: selección Wild Rift de 3 columnas que cabe sin scroll horizontal', js(pg, "() => { const c = document.getElementById('selCuerpo'); return !!c && getComputedStyle(c).gridTemplateColumns.split(' ').length === 3 && document.documentElement.scrollWidth <= innerWidth && document.querySelectorAll('.rejilla [data-champ]').length === 15; }"))
    check('menú móvil: botón JUGAR de al menos 44 px', js(pg, "() => document.getElementById('play').getBoundingClientRect().height >= 44"))
    check('#rotate oculto en apaisado', not pg.is_visible('#rotate'))
    pg.click('[data-map="grieta_ceniza"]'); pg.click('[data-champ="kaelith"]'); shot(pg, 'menu')
    pg.click('#play')
    pg.wait_for_function("() => window.__cdc && window.__cdc.G && !document.getElementById('loading').classList.contains('on')", timeout=180000); time.sleep(1.0)

    # ---------- HUD y botones ----------
    check('modo móvil activo (S.mobile) y __cdc.touch', js(pg, "() => __cdc.S.mobile === true && !!__cdc.touch"))
    check('#touchUI visible con 24 botones (19 redondos + oro + 4 de compra rápida)', pg.is_visible('#touchUI') and pg.locator('#touchUI .tb').count() == 24)
    check('Q/W/E/R de al menos 44 px CSS', js(pg, "() => [...document.querySelectorAll('#touchUI .tb-ab')].every(b => b.getBoundingClientRect().width >= 44 && b.getBoundingClientRect().height >= 44)"))
    pos = js(pg, "() => Object.fromEntries(__cdc.touch.rects.map(r => [r.id, [100 * r.cx / 844, 100 * r.cy / 390]]))")
    check('ataque en (85 %, 78 %) y definitiva encima en (85 %, 51 %)', abs(pos['attack'][0] - 85) <= 2 and abs(pos['attack'][1] - 78) <= 2 and abs(pos['abR'][0] - 85) <= 2 and abs(pos['abR'][1] - 51) <= 2 and pos['abR'][1] < pos['attack'][1], str(pos))
    check('Q/W/E en arco (73,86) (74,70) (78,57) y D/F en (58,86) (64,86)', all(abs(pos[i][0] - x) <= 2 and abs(pos[i][1] - y) <= 2 for i, x, y in [('abQ', 73, 86), ('abW', 74, 70), ('abE', 78, 57), ('sum0', 58, 86), ('sum1', 64, 86)]), str(pos))
    check('columna derecha ✕ ❗ ↓ ⊙ en x 91 % y B azul en (37 %, 86 %)', all(abs(pos[i][0] - 91) <= 2 for i in ['target', 'ping', 'recall2', 'lock']) and pos['target'][1] < pos['ping'][1] < pos['recall2'][1] < pos['lock'][1] and abs(pos['recall'][0] - 37) <= 2, str(pos))
    check('lienzo HUD con dpr (ancho = 844 × dpr, tope 2)', js(pg, "() => { const c = document.getElementById('game'), d = Math.min(devicePixelRatio, 2); return Math.abs(c.width - 844 * d) < 2 && __cdc.R.dpr === d && __cdc.R.W === 844; }"))
    mini = js(pg, "() => __cdc.R.mini")
    check('minimapa cuadrado del 15 % en (7 %, 2 %)', mini and abs(mini['x0'] - 0.07 * 844) < 2 and abs(mini['y0'] - 0.02 * 390) < 2 and abs(mini['w'] - 0.15 * 844) < 2, str(mini))
    mr = js(pg, "() => __cdc.R.mobRects")
    check('retratos de 4 aliados en 23–34 %, marcador en 72–78 % y KDA en 80–88 %', len(mr['allies']) == 4 and 0.23 * 844 - 1 <= mr['allies'][0]['cx'] - mr['allies'][0]['r'] and mr['allies'][3]['cx'] + mr['allies'][3]['r'] <= 0.34 * 844 + 1 and abs(mr['score']['x'] - 0.715 * 844) < 2 and abs(mr['kda']['x'] + mr['kda']['w'] - 0.89 * 844) < 2, str(mr))
    check('CS en círculo en (85 %, 32 %) y sin barra del objetivo sin objetivo', mr['cs'] and abs(mr['cs']['cx'] - 0.85 * 844) < 2 and abs(mr['cs']['cy'] - 0.32 * 390) < 2 and mr['targetBar'] is None, str(mr['cs']))
    check('cámara bloqueada por defecto', js(pg, "() => __cdc.R.cam.locked === true"))
    check('caja de oro bajo el minimapa muestra el oro y abre la tienda', js(pg, "() => { const p = __cdc.G.player, b = document.querySelector('#touchUI .tb-shop'); __cdc.touch.refresh(); return b.textContent.includes(String(Math.floor(p.gold))) && b.getBoundingClientRect().top >= __cdc.R.mini.y0 + __cdc.R.mini.h; }"))
    gx, gy, _, _ = rect(pg, 'shop'); pg.touchscreen.tap(gx, gy); time.sleep(0.2)
    check('tocar la caja de oro abre la tienda sin comprar nada por debajo', js(pg, "() => document.getElementById('shop').classList.contains('on') && __cdc.G.player.items.length === 0")); js(pg, "() => __cdc.UI.toggleShop(false)")
    shot(pg, 'partida')

    # ---------- compra rápida: en la fuente compra; fuera, avisa ----------
    ready(pg); frames(pg, 2)
    qb = js(pg, "() => { const p = __cdc.G.player; return { fuente: __cdc.G.inFountain(p), ids: __cdc.touch.quickBuyIds(), oro: p.gold, n: p.items.length, vis: [...document.querySelectorAll('#touchUI .tb-buy')].filter(b => !b.classList.contains('empty')).length }; }")
    check('compra rápida: 4 objetos de la build con coste, en la fuente', qb['fuente'] and len(qb['ids']) == 4 and qb['vis'] == 4 and js(pg, "() => document.querySelector('#touchUI .tb-buy0 .tb-cost').textContent !== ''"), str(qb))
    shot(pg, 'compra')
    bx, by, _, _ = rect(pg, 'buy0'); pg.touchscreen.tap(bx, by); time.sleep(0.2)
    qb2 = js(pg, "() => { const p = __cdc.G.player; return { oro: p.gold, n: p.items.length, id: p.items[0] && p.items[0].id }; }")
    check('tocar el primer objeto lo compra (oro baja, objeto en el inventario)', qb2['n'] == qb['n'] + 1 and qb2['oro'] < qb['oro'] and qb2['id'] == qb['ids'][0], str(qb2))
    check('el objeto comprado se dibuja bajo el minimapa', js(pg, "() => __cdc.R.mobRects.items.length === 1 && __cdc.R.mobRects.items[0].x > __cdc.R.mini.x0"))
    js(pg, "() => { const G = __cdc.G, p = G.player; p.x = G.map.W / 2; p.y = G.map.H / 2; p.gold = 5000; __cdc.R.texts = []; }"); frames(pg, 2)
    bx, by, _, _ = rect(pg, 'buy0'); pg.touchscreen.tap(bx, by); time.sleep(0.2)
    check('fuera de la fuente no compra y muestra el aviso de la tienda', js(pg, "() => __cdc.G.player.items.length === 1 && __cdc.R.texts.some(t => t.txt.startsWith('Solo puedes comprar en tu fuente'))"))

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
    js(pg, "() => { const p = __cdc.G.player; p.recast.Q = 0; p.cds.Q = Math.max(p.cds.Q || 0, 3); __cdc.touch.refresh(); }"); frames(pg, 2)
    check('anillo azul de carga en Q mientras se enfría (con el número de segundos)', js(pg, "() => { const b = document.querySelector('#touchUI .tb-abQ'); const ring = getComputedStyle(b.querySelector('.tb-ring')); return b.classList.contains('cooling') && ring.display !== 'none' && /^\d+%$/.test(b.style.getPropertyValue('--p').trim()) && b.querySelector('.tb-cd').textContent !== ''; }"))

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
    frames(pg, 2); tb = js(pg, "() => __cdc.R.mobRects.targetBar")
    check('barra del objetivo arriba-centro (43–59 %, 2–8 %) con vida/máx al fijar', tb and abs(tb['x'] - 0.43 * 844) < 2 and abs(tb['w'] - 0.16 * 844) < 2 and tb['y'] < 0.03 * 390 and tb['hp'] > 0 and tb['max'] >= tb['hp'], str(tb))
    shot(pg, 'objetivo')
    tx, ty, _, _ = rect(pg, 'target'); pg.touchscreen.tap(tx, ty); time.sleep(0.2); frames(pg, 2)
    check('✕ de la columna derecha suelta el objetivo y la barra desaparece', js(pg, "() => !__cdc.G.player.target && __cdc.R.mobRects.targetBar === null"))
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
    js(pg, "() => __cdc.UI.toggleShop(false)")
    sx, sy, _, _ = rect(pg, 'score'); pg.touchscreen.tap(sx, sy); time.sleep(0.3)
    fit = js(pg, "() => { const p = document.querySelector('#score .panel').getBoundingClientRect(); return { vis: document.getElementById('score').classList.contains('on'), r: p.right, l: p.left, w: innerWidth, sw: document.documentElement.scrollWidth }; }")
    check('marcador: se abre con el botón y cabe en pantalla', fit['vis'] and fit['l'] >= -1 and fit['r'] <= fit['w'] + 1 and fit['sw'] <= fit['w'], str(fit))
    pg.touchscreen.tap(30, 380); time.sleep(0.2)  # fuera del panel
    check('marcador: tocar fuera lo cierra', not js(pg, "() => document.getElementById('score').classList.contains('on')"))

    # ---------- pausa con opciones nuevas ----------
    px, py, _, _ = rect(pg, 'pause'); pg.touchscreen.tap(px, py); time.sleep(0.4)
    check('pausa: opciones de controles táctiles y efectos', pg.is_visible('#pause') and pg.locator('#oTouch').count() == 1 and pg.locator('#oVfx').count() == 1)
    pg.click('#resumeBtn')
    b.close()

for n in ['menu', 'partida', 'objetivo', 'habilidad', 'compra']: check(f'captura {DATE}-movil-{n}.png', (EVID / f'{DATE}-movil-{n}.png').exists())
check('sin errores de JavaScript en consola', not errors, '; '.join(errors[:5]))
ok = sum(1 for r in results if r[1]); print(f'\n{ok}/{len(results)} comprobaciones superadas · capturas en {EVID}')
sys.exit(0 if ok == len(results) else 1)
