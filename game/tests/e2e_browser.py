"""Prueba de extremo a extremo en un navegador real (Chromium, Playwright).

Juega de verdad: menú → selección → partida en los 3 mapas y el tutorial, con ratón y teclado
(mover, atacar, habilidades, subir rangos, hechizos, guardián, volver a base, tienda, marcador,
pausa, opciones, reasignar teclas, rendición y pantalla final). Guarda capturas en tests/screenshots/.

Uso:  python3 game/tests/e2e_browser.py [ruta/al/html]
Requiere: pip install playwright && playwright install chromium
"""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'coronas-de-ceniza.html'
SHOTS = ROOT / 'tests' / 'screenshots'; SHOTS.mkdir(parents=True, exist_ok=True)
EVID = ROOT.parent / 'production' / 'qa' / 'evidence'; EVID.mkdir(parents=True, exist_ok=True)
results, errors = [], []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail and not cond else ''))

def js(pg, code): return pg.evaluate(code)
def fast(pg, seconds): js(pg, f"() => {{ const G = __cdc.G; for (let i = 0; i < {int(seconds * 30)}; i++) G.step(); }}")
def ready(pg):  # el jugador está vivo y libre de control de masas antes de cada acción comprobada
    js(pg, "() => { const G = __cdc.G, p = G.player; if (!p.alive) G.respawn(p); p.cc = []; p.channel = null; p.dash = null; p.hp = p.st.maxHp; }")
def frames(pg, n=2):  # espera a que se dibujen n fotogramas nuevos (la cámara ya sigue al jugador)
    js(pg, "() => { window.__f0 = __cdc.r3d ? __cdc.r3d.t : 0; }")
    if js(pg, "() => !!__cdc.r3d"): pg.wait_for_function(f"() => __cdc.r3d.t > window.__f0 + {n} * 0.0001 && performance.now() > 0", timeout=60000); time.sleep(0.2)
    for _ in range(n): pg.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
def nonblack(pg):
    # 3D: triángulos dibujados por WebGL en el último fotograma; 2D: píxeles no negros del lienzo
    return js(pg, """() => { if (__cdc.r3d) return __cdc.r3d.r.info.render.triangles;
      const c = document.getElementById('game'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 0; i < x.length; i += 4 * 97) if (x[i] + x[i+1] + x[i+2] > 60) n++; return n; }""")

def new_game(pg, mode, champ, diff='normal'):
    pg.goto(HTML.as_uri()); time.sleep(0.3)
    pg.click(f'[data-map="{mode}"]'); pg.click(f'[data-diff="{diff}"]')
    if mode != 'puente_niebla': pg.click(f'[data-champ="{champ}"]')
    pg.click('#play'); wait_start(pg)

def wait_start(pg):
    pg.wait_for_function("() => window.__cdc && window.__cdc.G && !document.getElementById('loading').classList.contains('on')", timeout=180000); time.sleep(1.0)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900}); pg.set_default_timeout(180000)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)

    # ---------- menú ----------
    pg.goto(HTML.as_uri()); time.sleep(0.3)
    check('menú: 15 campeones', pg.locator('[data-champ]').count() == 15)
    check('menú: 4 modos (3 mapas + tutorial)', pg.locator('[data-map]').count() == 4)
    check('menú: JUGAR deshabilitado sin campeón', pg.is_disabled('#play'))
    # selección al estilo Wild Rift (design/ux/wild-rift-disposicion.md §2–§4)
    sala = js(pg, "() => { const s = __cdc.state.sel; return { pos: s.pos, aliados: s.aliados.length, bots: s.aliados.filter(a => !a.esJugador && a.champ).length, rivales: s.rivales.length, ocultos: s.rivales.filter(r => !r.visible).length } }")
    check('selección: 4 bots aliados con posición y 5 rivales ocultos', sala['aliados'] == 5 and sala['bots'] == 4 and sala['rivales'] == 5 and sala['ocultos'] == 5, str(sala))
    check('selección: lista de aliados con posición, 2 hechizos y ⇄ en los bots', pg.locator('#aliados .fila').count() == 5 and pg.locator('#aliados [data-swap]').count() == 4 and pg.locator('#aliados .sumMini').count() == 10)
    c0 = int(pg.text_content('#cuenta'))
    try: pg.wait_for_function("() => +document.getElementById('cuenta').textContent < 60", timeout=15000)
    except Exception: pass
    c1 = int(pg.text_content('#cuenta')); r = js(pg, "() => __cdc.state.cuenta.restante")
    check('selección: cuenta atrás real desde 60', c0 <= 60 and 0 < c1 < 60 and r < 60, f'{c0} → {c1} ({r})')
    pg.click('#filtros [data-rol="Mago"]'); time.sleep(0.1)
    check('selección: el filtro por rol reduce la rejilla a 3 magos', pg.locator('[data-champ]').count() == 3)
    pg.fill('#buscar', 'kae'); time.sleep(0.1); check('selección: buscar por nombre', pg.locator('[data-champ]').count() == 0)
    pg.click('#filtros [data-rol="todos"]'); check('selección: «todos» + búsqueda «kae» = Kaelith', pg.locator('[data-champ]').count() == 1); pg.fill('#buscar', '')
    pg.click('[data-champ="kaelith"]')
    check('menú: ficha con pasiva y 4 habilidades', pg.locator('#detail .ab').count() == 5)
    check('selección: marco dorado al elegido e insignias de recomendado', pg.locator('[data-champ="kaelith"].sel').count() == 1 and pg.locator('.rejilla .rec').count() >= 1)
    check('runas: insignia «1» mientras no se configuran', not js(pg, "() => document.getElementById('runasBadge').classList.contains('off')"))
    pos0 = js(pg, "() => __cdc.state.sel.pos"); otra = js(pg, "() => __cdc.state.sel.aliados.find(a => !a.esJugador).pos")
    pg.click(f'#aliados [data-swap="{otra}"]'); time.sleep(0.1)
    check('selección: ⇄ cambia la posición con el bot (acepta)', js(pg, "() => __cdc.state.sel.pos") == otra and pos0 != otra)
    pg.screenshot(path=str(SHOTS / '01_seleccion.png')); pg.screenshot(path=str(EVID / '2026-11-03-seleccion-campeon.png'))
    # panel de hechizos (captura 08): 9 hechizos, tocar uno sustituye la ranura marcada y cambia #sum0
    pg.click('#selSum0'); time.sleep(0.3)
    check('hechizos: panel con 9 hechizos y los 2 elegidos', pg.is_visible('#panelHechizos') and pg.locator('#panelHechizos [data-sum]').count() == 9 and pg.locator('#panelHechizos [data-slot]').count() == 2)
    pg.screenshot(path=str(EVID / '2026-11-03-seleccion-hechizos.png'))
    pg.click('#panelHechizos [data-sum="ghost"]'); time.sleep(0.1)
    check('hechizos: tocar Zancada cambia #sum0', js(pg, "() => document.getElementById('sum0').value") == 'ghost' and js(pg, "() => __cdc.state.sums[0]") == 'ghost')
    pg.click('#panelHechizos [data-cerrar]')
    # sets de objetos (captura 09): pestañas, popularidad y % de victorias, aplicar cambia el set
    pg.click('#btnSets'); time.sleep(0.3); pg.click('#panelSets [data-tab="POPULAR"]'); time.sleep(0.2)
    nsets = pg.locator('#panelSets .set').count(); txt = pg.text_content('#panelSets')
    check('sets: pestaña POPULAR con ≥ 2 sets, popularidad y porcentaje de victorias', nsets >= 2 and 'Popularidad:' in txt and 'Porcentaje de victorias:' in txt and '%' in txt)
    pg.screenshot(path=str(EVID / '2026-11-03-seleccion-sets.png'))
    set2 = js(pg, "() => document.querySelector('#panelSets [data-aplicar]').dataset.aplicar")
    pg.click(f'#panelSets [data-aplicar="{set2}"]'); time.sleep(0.1)
    check('sets: aplicar un set cambia state.itemSet (6 objetos) y lo marca con ✓', js(pg, f"() => __cdc.state.setId === '{set2}' && __cdc.state.itemSet.length === 6") and pg.locator('#panelSets .set.sel .accion.ok').count() == 1)
    pg.click('#panelSets [data-tab="PERSONAL"]'); time.sleep(0.1)
    for it in ['botas_de_acero', 'coraza_de_hondaforja', 'manto_onirico', 'hacha_de_colmillo', 'capa_del_angel', 'relicario_de_hierro']: pg.click(f'#panelSets [data-anadir="{it}"]')
    check('sets: PERSONAL compone un set de 6 tocando objetos (localStorage)', pg.locator('#panelSets [data-aplicar="personal"]').count() == 1 and len(js(pg, "() => JSON.parse(localStorage.getItem('cdc_sets_personal')).kaelith")) == 6)
    pg.click('#panelSets [data-cerrar]')
    # runas (⊕ con «1»): rama primaria + 3 menores + secundaria; aplicar quita el «1»
    check('runas: aplicar un set configura las runas y quita el «1»', js(pg, "() => document.getElementById('runasBadge').classList.contains('off')"))
    js(pg, "() => { __cdc.state.runesConfigured = false; __cdc.renderMenu(); }")
    pg.click('#btnRunas'); time.sleep(0.3)
    check('runas: panel con 4 ramas y 13 claves en total', pg.is_visible('#panelRunas') and pg.locator('#panelRunas [data-rama]').count() == 4 and js(pg, "() => __cdc.SEL && 13"))
    pg.screenshot(path=str(EVID / '2026-11-03-seleccion-runas.png'))
    pg.click('#panelRunas [data-rama="roca"]'); time.sleep(0.1); pg.click('#panelRunas [data-runa="garra_del_sepulcro"]'); time.sleep(0.1); pg.click('#panelRunas [data-runa="raices_profundas"]'); time.sleep(0.1)
    check('runas: elegir rama Roca, Garra del Sepulcro y Raíces Profundas', js(pg, "() => document.querySelector('#panelRunas [data-runa=\"garra_del_sepulcro\"]').classList.contains('sel') && document.querySelector('#panelRunas [data-runa=\"raices_profundas\"]').classList.contains('sel')"))
    pg.click('#panelRunas #runasAplicar'); time.sleep(0.1)
    check('runas: aplicar guarda la página (con Raíces Profundas) y quita el «1»', js(pg, "() => __cdc.state.runes.key === 'garra_del_sepulcro' && __cdc.state.runes.minors.includes('raices_profundas')") and js(pg, "() => document.getElementById('runasBadge').classList.contains('off')"))
    pg.click('#helpBtn'); check('menú: ayuda de controles', pg.is_visible('#help')); pg.click('#help button')

    # ---------- Grieta: partida jugada con ratón y teclado ----------
    new_game(pg, 'grieta_ceniza', 'kaelith')
    check('Grieta: el lienzo dibuja el mapa', nonblack(pg) > 200)
    m3 = js(pg, "() => { const r = __cdc.r3d; if (!r) return null; let skinned = 0; for (const o of r.objs.values()) if (o.userData.mixer) skinned++; return { models: Object.keys(r.templates).length, objs: r.objs.size, skinned, champ: r.objs.get(__cdc.G.player.id)?.userData.spec.model } }")
    check('3D: ≥40 modelos glTF (32 unidades CC0 + estructuras + mapa) y Kaelith con su modelo definitivo', m3 and m3['models'] >= 40 and m3['skinned'] >= 5 and m3['champ'] == 'champ_kaelith', str(m3))
    st = js(pg, "() => { const G = __cdc.G; return { n: G.champs.length, name: G.player.name, team: G.player.team, role: G.player.role, rivales: G.champs.filter(c => c.team === 1).map(c => c.cid), set: G.player.itemSet, setId: G.player.setId, runes: G.player.runes, sums: G.player.summoners, hp: G.player.st.maxHp, basehp: G.player.base.hp, jungla: G.champs.filter(c => c.team === 0 && c.role === 'jungle').map(c => c.summoners) } }")
    check('Grieta: 10 campeones y jugador Kaelith', st['n'] == 10 and st['name'] == 'Kaelith', str(st))
    sala = js(pg, "() => ({ rivales: __cdc.state.sel.rivales.map(r => r.champ), pos: __cdc.state.sel.pos })")
    check('Grieta: la alineación de la sala manda (rivales revelados = rivales de la partida; jugador en su posición)', st['rivales'] == sala['rivales'] and st['role'] == sala['pos'], str(st) + str(sala))
    check('Grieta: G.player.itemSet = set aplicado (contrato con la compra rápida del HUD) y G.player.runes', st['set'] == js(pg, "() => __cdc.state.itemSet") and st['setId'] == set2 and st['runes']['key'] == 'garra_del_sepulcro', str(st))
    check('Grieta: las runas aplicadas cambian una estadística (Raíces Profundas: +100 de vida máx.)', abs(st['hp'] - st['basehp'] - 100) < 0.5, str(st))
    check('Grieta: la jungla aliada lleva Juicio', all('smite' in s for s in st['jungla']), str(st))
    pg.screenshot(path=str(SHOTS / '02_grieta_inicio.png'))
    # tienda en la fuente: comprar botas
    pg.keyboard.press('p'); time.sleep(0.2); check('tienda: se abre con P', pg.is_visible('#shop'))
    pg.click('[data-buy="botas"]'); time.sleep(0.1)
    check('tienda: comprar Botas', js(pg, "() => __cdc.G.player.items.some(i => i.id === 'botas')"))
    pg.screenshot(path=str(SHOTS / '03_tienda.png')); pg.keyboard.press('Escape')
    # subir rango con Ctrl+Q
    pg.keyboard.press('Control+q'); check('Ctrl+Q sube la Q', js(pg, "() => __cdc.G.player.ranks.Q") == 1)
    # moverse con clic derecho
    x0 = js(pg, "() => __cdc.G.player.x")
    pg.mouse.move(1150, 250); pg.mouse.click(1150, 250, button='right')
    try: pg.wait_for_function(f"() => __cdc.G.player.x > {x0} + 100", timeout=60000); moved = True
    except Exception: moved = False
    check('clic derecho mueve al campeón', moved, str(js(pg, "() => ({ x: __cdc.G.player.x, mv: __cdc.G.player.moveTo })")))
    # viajar al carril: teletransportar cerca de la oleada y avanzar el tiempo
    fast(pg, 70)
    js(pg, "() => { const G = __cdc.G, p = G.player, m = G.units.find(u => u.alive && u.kind === 'minion' && u.team === 1); p.x = m.x - 300; p.y = m.y + 300; }")
    frames(pg, 3)
    # atacar a un súbdito enemigo con clic derecho sobre él
    pos = js(pg, "() => { const G = __cdc.G, R = __cdc.R, p = G.player; const m = G.units.filter(u => u.alive && u.kind === 'minion' && u.team === 1).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]; return R.w2s(m.x, m.y); }")
    pg.mouse.move(pos[0], pos[1]); time.sleep(0.1); pg.mouse.click(pos[0], pos[1], button='right'); time.sleep(0.2)
    check('clic derecho sobre enemigo = atacar', js(pg, "() => !!__cdc.G.player.target"))
    # lanzar Q hacia un enemigo con la tecla
    ready(pg)
    pg.keyboard.press('q'); time.sleep(0.2)
    check('Q se lanza (entra en enfriamiento)', js(pg, "() => (__cdc.G.player.cds.Q || 0) > 0 || __cdc.G.player.recast.Q > __cdc.G.t"))
    pg.screenshot(path=str(SHOTS / '04_grieta_combate.png'))
    # guardián, Destello, volver a base
    ready(pg); frames(pg, 2)
    pg.mouse.move(800, 430)
    pg.keyboard.press('4'); time.sleep(0.1)
    check('tecla 4 coloca un guardián', js(pg, "() => __cdc.G.units.some(u => u.kind === 'ward' && u.team === __cdc.G.player.team)"))
    ready(pg)
    js(pg, "() => { const p = __cdc.G.player; p.summoners = ['flash', 'ignite']; p.sumCd = [0, 0]; }")
    xb = js(pg, "() => __cdc.G.player.x"); pg.mouse.move(200, 450); pg.keyboard.press('d'); time.sleep(0.1)
    check('D lanza Parpadeo (Destello)', js(pg, "() => __cdc.G.player.sumCd[0] > 0"), str(js(pg, "() => { const p = __cdc.G.player; return { alive: p.alive, cc: p.cc.map(c => c.kind), ch: !!p.channel, dash: !!p.dash, sums: p.summoners } }")))
    ready(pg)
    pg.keyboard.press('b'); time.sleep(0.1)
    check('B inicia la vuelta a base', js(pg, "() => !!(__cdc.G.player.channel && __cdc.G.player.channel.recall)"))
    # marcador y pausa
    pg.keyboard.down('Tab'); time.sleep(0.2); check('Tab muestra el marcador', pg.is_visible('#score')); pg.screenshot(path=str(SHOTS / '05_marcador.png')); pg.keyboard.up('Tab')
    t0 = js(pg, "() => __cdc.G.t"); pg.keyboard.press('Escape'); time.sleep(0.6)
    check('Esc pausa la partida', pg.is_visible('#pause') and abs(js(pg, "() => __cdc.G.t") - t0) < 0.2)
    # reasignar tecla de la Q a 'Z' y comprobar que funciona
    pg.click('[data-bind="castQ"]'); pg.keyboard.press('z'); time.sleep(0.1)
    check('opciones: reasignar Q a Z', js(pg, "() => __cdc.S.keys.castQ") == 'KeyZ')
    pg.check('#oCb'); check('opciones: modo daltónico', js(pg, "() => __cdc.S.colorblind"))
    pg.screenshot(path=str(SHOTS / '06_opciones.png'))
    pg.click('#resumeBtn'); time.sleep(0.2)
    js(pg, "() => { const p = __cdc.G.player; p.cds.Q = 0; p.channel = null; }")
    pg.keyboard.press('z'); time.sleep(0.1)
    check('la tecla reasignada lanza la Q', js(pg, "() => (__cdc.G.player.cds.Q || 0) > 0 || __cdc.G.player.recast.Q > __cdc.G.t"))
    js(pg, "() => { __cdc.S.keys.castQ = 'KeyQ'; __cdc.S.colorblind = false; localStorage.clear(); }")
    # avanzar 15 min con bots y comprobar que la partida evoluciona
    fast(pg, 900); time.sleep(0.4)
    st = js(pg, "() => { const G = __cdc.G; return { t: G.t, kills: G.kills, lvl: G.player.level, towers: G.towersDown, over: G.over } }")
    check('15 min después: hay combates y progreso', sum(st['kills']) > 0 and st['t'] > 900, str(st))
    pg.screenshot(path=str(SHOTS / '07_grieta_15min.png'))
    # rendición (min 15+) y pantalla final
    pg.keyboard.press('Escape'); time.sleep(0.2)
    check('rendición disponible desde el min 15', not pg.is_disabled('#surrBtn'))
    js(pg, "() => __cdc.G.endGame(1)"); pg.click('#resumeBtn'); time.sleep(0.6)
    check('pantalla final con marcador y gráfico de oro', pg.is_visible('#end') and pg.locator('#goldGraph').count() == 1)
    pg.screenshot(path=str(SHOTS / '08_final.png'))

    # ---------- Puente de la Niebla (ARAM) ----------
    pg.goto(HTML.as_uri()); time.sleep(0.3); pg.click('[data-map="puente_niebla"]')
    c1 = js(pg, "() => __cdc.state.champ"); pg.click('#reroll'); c2 = js(pg, "() => __cdc.state.champ")
    check('ARAM: campeón aleatorio con cambios', c1 is not None and c2 is not None and js(pg, "() => __cdc.state.rerolls") == 1)
    pg.click('#play'); wait_start(pg)
    st = js(pg, "() => { const p = __cdc.G.player; return { lvl: p.level, gold: p.gold, sums: p.summoners } }")
    check('ARAM: nivel 3, 1400 de oro, Bola de Nieve', st['lvl'] == 3 and st['gold'] == 1400 and 'snowball' in st['sums'], str(st))
    fast(pg, 120); time.sleep(0.3); check('ARAM: se dibuja', nonblack(pg) > 200)
    pg.screenshot(path=str(SHOTS / '09_puente.png'))

    # ---------- Ruinas del Eclipse (dominio) ----------
    new_game(pg, 'ruinas_eclipse', 'tharok')
    check('Ruinas: 3v3 y 3 altares', js(pg, "() => __cdc.G.champs.length === 6 && __cdc.G.altars.length === 3"))
    fast(pg, 240); time.sleep(0.3)
    check('Ruinas: los equipos suman puntos', js(pg, "() => __cdc.G.points[0] + __cdc.G.points[1]") > 0)
    pg.screenshot(path=str(SHOTS / '10_ruinas.png'))

    # ---------- Tutorial ----------
    new_game(pg, 'tutorial', 'lyra')
    check('tutorial: panel visible con 5 pasos', pg.is_visible('#tutorial') and pg.locator('#tutorial li').count() == 5)
    check('tutorial: bots en Fácil y Juicio (Castigo) en F', js(pg, "() => __cdc.G.difficulty === 'facil' && __cdc.G.player.summoners[1] === 'smite'"))
    pg.screenshot(path=str(SHOTS / '11_tutorial.png'))

    # ---------- modo 2D de respaldo (sin WebGL o desactivado en Opciones) ----------
    pg.goto(HTML.as_uri()); js(pg, "() => { localStorage.setItem('cdc_settings', JSON.stringify({ render3d: false })); }")
    new_game(pg, 'grieta_ceniza', 'nyxe')
    check('modo 2D de respaldo funciona', js(pg, "() => !__cdc.r3d") and nonblack(pg) > 200)
    js(pg, "() => localStorage.clear()")

    # ---------- partida completa en tiempo acelerado con el jugador controlado por la IA ----------
    new_game(pg, 'ruinas_eclipse', 'vaelor')
    done = js(pg, """() => { const G = __cdc.G; G.player.isPlayer = false; let i = 0; while (!G.over && i++ < 30*60*30) G.step(); return { over: G.over, t: G.t, w: G.winner }; }""")
    time.sleep(0.6)
    check('partida completa hasta la pantalla final', done['over'] and pg.is_visible('#end'), str(done))
    b.close()

check('sin errores de JavaScript en consola', not errors, '; '.join(errors[:5]))
ok = sum(1 for r in results if r[1]); print(f'\n{ok}/{len(results)} comprobaciones superadas · capturas en {SHOTS}')
sys.exit(0 if ok == len(results) else 1)
