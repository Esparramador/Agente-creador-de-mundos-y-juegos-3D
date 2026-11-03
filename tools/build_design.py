#!/usr/bin/env python3
"""Genera los datos de juego y los documentos derivados de la demo «Coronas de Ceniza».
   python3 tools/build_design.py          -> escribe assets/data/*.json y design/gdd/champion-roster.md
   python3 tools/build_design.py --check  -> solo valida (código de salida 1 si hay errores)"""
import json, sys, statistics
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from champions_src import CHAMPIONS, CLASS_STATS, PRESENTATION, VFX_BY_ABILITY_TYPE

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/data"

ITEMS = [  # id, nombre, coste, stats, efecto único, extras {tier, upgradeOf, slot, since, active}
 # básicos
 ("espada_larga","Espada Larga",350,{"ad":10},None,{"tier":"basico"}),
 ("tomo_amplificador","Tomo Amplificador",435,{"ap":20},None,{"tier":"basico"}),
 ("cinturon_gigante","Cinturón de Gigante",900,{"hp":350},None,{"tier":"basico"}),
 ("capa_de_lino","Capa de Lino",300,{"armor":15},None,{"tier":"basico"}),
 ("amuleto_nulo","Amuleto Nulo",450,{"mr":25},None,{"tier":"basico"}),
 # botas (reglas 7.2: nivel 1 → nivel 2 a 1200 → nivel 3 desde el 10:00, +1000). Solo un par: slot «botas».
 ("botas","Botas",300,{"ms":25},None,{"tier":"botas","nivel":1,"slot":"botas"}),
 ("botas_de_azogue","Botas de Azogue",1200,{"ms":45,"mr":15,"tenacity":0.30},"Nivel 2. +30% de tenacidad.",{"tier":"botas","nivel":2,"slot":"botas","upgradeOf":"botas"}),
 ("botas_de_acero","Botas de Acero",1200,{"ms":45,"armor":15},"Nivel 2. Los ataques básicos te hacen un 10% menos de daño.",{"tier":"botas","nivel":2,"slot":"botas","upgradeOf":"botas","attackReduct":0.10}),
 ("grebas_del_frenesi","Grebas del Frenesí",1200,{"ms":45,"as":0.25},"Nivel 2. +25% de velocidad de ataque.",{"tier":"botas","nivel":2,"slot":"botas","upgradeOf":"botas"}),
 ("botas_de_lucidez","Botas de Lucidez",1000,{"ms":45,"ah":10,"sumHaste":0.10},"Nivel 2. +10 celeridad y hechizos de invocador un 10% más rápidos.",{"tier":"botas","nivel":2,"slot":"botas","upgradeOf":"botas"}),
 ("trituradoras_encadenadas","Trituradoras Encadenadas",2200,{"ms":55,"mr":25,"hp":150,"tenacity":0.35},"Nivel 3 (desde el 10:00). Mejora de las Botas de Azogue.",{"tier":"botas","nivel":3,"slot":"botas","upgradeOf":"botas_de_azogue","since":600}),
 ("avance_blindado","Avance Blindado",2200,{"ms":55,"armor":30,"hp":150},"Nivel 3 (desde el 10:00). Mejora de las Botas de Acero; ataques básicos −12%.",{"tier":"botas","nivel":3,"slot":"botas","upgradeOf":"botas_de_acero","since":600,"attackReduct":0.12}),
 ("lucidez_carmesi","Lucidez Carmesí",2000,{"ms":55,"ah":20,"sumHaste":0.15,"omnivamp":0.05},"Nivel 3 (desde el 10:00). Mejora de las Botas de Lucidez; +5% omnivampirismo.",{"tier":"botas","nivel":3,"slot":"botas","upgradeOf":"botas_de_lucidez","since":600}),
 # legendarios
 ("filo_del_ocaso","Filo del Ocaso",3000,{"ad":55,"crit":0.20},"Golpes críticos +35% daño.",{"tier":"legendario"}),
 ("arco_de_tormenta","Arco de Tormenta",2900,{"ad":35,"as":0.35},"Cada 3er ataque encadena un rayo (60 mágico).",{"tier":"legendario"}),
 ("baculo_de_ceniza","Báculo de Ceniza",3100,{"ap":90},"+30% de poder de habilidad total.",{"tier":"legendario"}),
 ("orbe_del_vacio","Orbe del Vacío",2800,{"ap":70,"mpen":0.30},"Penetración mágica 30%.",{"tier":"legendario"}),
 ("coraza_de_hondaforja","Coraza de Hondaforja",2900,{"hp":400,"armor":60},"Refleja 25% del daño de ataques recibidos.",{"tier":"legendario"}),
 ("manto_onirico","Manto Onírico",2800,{"hp":350,"mr":60},"+2% vida máx./s fuera de combate.",{"tier":"legendario"}),
 ("hacha_de_colmillo","Hacha de Colmillo",3200,{"ad":45,"hp":300,"ah":20},"Tras usar una habilidad, el siguiente ataque inflige +100% AD base.",{"tier":"legendario"}),
 ("incensario_dorado","Incensario Dorado",2300,{"ap":45,"heal_power":0.12},"Curar o escudar a un aliado le da +25% vel. ataque 4 s.",{"tier":"legendario"}),
 ("sed_de_sangre","Sed de Sangre",3200,{"ad":65,"ls":0.15},"Robo de vida 15%.",{"tier":"legendario"}),
 ("garra_sangrienta","Garra Sangrienta",3000,{"ad":40,"hp":300,"ah":15,"omnivamp":0.08},"Omnivampirismo 8%: todo el daño cura.",{"tier":"legendario"}),
 ("yelmo_del_abismo","Yelmo del Abismo",2800,{"hp":400,"mr":45,"ap":40,"mana":300},"Vida, resistencia mágica y maná para magos de primera línea.",{"tier":"legendario"}),
 ("cuchilla_del_verdugo","Cuchilla del Verdugo",3000,{"ad":40,"hp":200,"ah":20,"arpen":0.30},"Penetración de armadura 30%.",{"tier":"legendario"}),
 ("capa_del_angel","Capa del Ángel",3200,{"ad":45,"armor":40},"Al morir renaces con el 30% de vida (180 s de enfriamiento).",{"tier":"legendario","renacer":180}),
 ("eco_de_brasas","Eco de Brasas",2800,{"ap":100,"ah":10,"mana":500},"Daño de habilidad a un campeón: eco de 40 (+10% PH) mágico en área (9 s).",{"tier":"legendario","eco":9}),
 # objetos activos (7.2): solo UNO por campeón (slot «activo»); se usan con la tecla/botón de objeto activo
 ("reloj_de_estasis","Reloj de Estasis",3300,{"ap":110,"armor":40},"ACTIVO: estasis 2,5 s (invulnerable e inmóvil). 90 s.",{"tier":"activo","slot":"activo","active":"estasis","activeCd":90}),
 ("relicario_de_hierro","Relicario de Hierro",2600,{"hp":300,"armor":30,"mr":30,"ah":10},"ACTIVO: escudo de 120 (+15/nivel) a ti y a los aliados cercanos 2,5 s. 90 s.",{"tier":"activo","slot":"activo","active":"relicario","activeCd":90}),
 ("cinturon_cohete","Cinturón Cohete",3000,{"ap":80,"hp":300,"ah":15},"ACTIVO: impulso de 300 u y ráfaga de 100 (+25% PH) mágico. 40 s.",{"tier":"activo","slot":"activo","active":"cohete","activeCd":40}),
 ("azogue_vital","Azogue Vital",2900,{"ad":40,"mr":35,"ls":0.10},"ACTIVO: elimina todos los controles de masas. 90 s.",{"tier":"activo","slot":"activo","active":"azogue","activeCd":90}),
]

# Sets de objetos por campeón: 3 por clase (6 objetos: botas de nivel 2 + 4 legendarios + 1 activo o legendario),
# con su página de runas y sus dos hechizos según la posición. La popularidad y el % de victorias los escribe
# tools/simular_sets.mjs (partidas reales entre bots) y aquí se CONSERVAN si ya existen en item_sets.json.
SET_TEMPLATES = {
 "Tanque": [
  ("Muralla",   ["botas_de_acero","coraza_de_hondaforja","manto_onirico","relicario_de_hierro","yelmo_del_abismo","cinturon_gigante"], ("garra_del_sepulcro",["placas_de_hueso","segundo_aliento","raices_profundas"],"triunfo")),
  ("Vanguardia",["botas_de_azogue","hacha_de_colmillo","coraza_de_hondaforja","manto_onirico","capa_del_angel","cinturon_gigante"], ("senor_de_la_escarcha",["placas_de_hueso","inquebrantable","raices_profundas"],"trascendencia")),
  ("Custodio",  ["botas_de_acero","relicario_de_hierro","manto_onirico","coraza_de_hondaforja","yelmo_del_abismo","capa_del_angel"], ("custodio",["placas_de_hueso","segundo_aliento","raices_profundas"],"ardor")),
 ],
 "Luchador": [
  ("Sangría",   ["botas_de_acero","garra_sangrienta","hacha_de_colmillo","coraza_de_hondaforja","sed_de_sangre","capa_del_angel"], ("vencedor",["brutal","triunfo","golpe_de_gracia"],"segundo_aliento")),
  ("Verdugo",   ["botas_de_azogue","hacha_de_colmillo","cuchilla_del_verdugo","manto_onirico","capa_del_angel","azogue_vital"], ("asedio",["brutal","triunfo","ardor"],"inquebrantable")),
  ("Garra",     ["botas_de_acero","sed_de_sangre","hacha_de_colmillo","capa_del_angel","garra_sangrienta","manto_onirico"], ("garra_del_sepulcro",["placas_de_hueso","segundo_aliento","raices_profundas"],"brutal")),
 ],
 "Mago": [
  ("Incendio",  ["botas_de_lucidez","baculo_de_ceniza","orbe_del_vacio","eco_de_brasas","reloj_de_estasis","yelmo_del_abismo"], ("tormenta_rapida",["golpe_barato","impacto_subito","trofeos"],"caudal_de_mana")),
  ("Cometa",    ["botas_de_lucidez","eco_de_brasas","baculo_de_ceniza","yelmo_del_abismo","orbe_del_vacio","reloj_de_estasis"], ("cometa_de_ceniza",["caudal_de_mana","trascendencia","chamuscar"],"brutal")),
  ("Cohete",    ["botas_de_azogue","cinturon_cohete","baculo_de_ceniza","orbe_del_vacio","eco_de_brasas","yelmo_del_abismo"], ("luciernaga",["caudal_de_mana","trascendencia","tormenta_creciente"],"triunfo")),
 ],
 "Tirador": [
  ("Crítico",   ["grebas_del_frenesi","filo_del_ocaso","arco_de_tormenta","sed_de_sangre","cuchilla_del_verdugo","capa_del_angel"], ("compas_letal",["brutal","triunfo","golpe_de_gracia"],"cazador_incansable")),
  ("Tormenta",  ["grebas_del_frenesi","arco_de_tormenta","filo_del_ocaso","sed_de_sangre","azogue_vital","capa_del_angel"], ("pies_de_viento",["ardor","triunfo","golpe_de_gracia"],"raices_profundas")),
  ("Verdugo",   ["botas_de_azogue","cuchilla_del_verdugo","filo_del_ocaso","sed_de_sangre","arco_de_tormenta","capa_del_angel"], ("vencedor",["brutal","triunfo","ardor"],"impacto_subito")),
 ],
 "Asesino": [
  ("Sombra",    ["botas_de_acero","cuchilla_del_verdugo","hacha_de_colmillo","sed_de_sangre","capa_del_angel","filo_del_ocaso"], ("tormenta_rapida",["golpe_barato","impacto_subito","cazador_incansable"],"brutal")),
  ("Emboscada", ["botas_de_azogue","hacha_de_colmillo","cuchilla_del_verdugo","garra_sangrienta","azogue_vital","manto_onirico"], ("siega_sombria",["golpe_barato","trofeos","cazador_incansable"],"triunfo")),
  ("Primer Tajo",["botas_de_acero","cuchilla_del_verdugo","filo_del_ocaso","sed_de_sangre","capa_del_angel","coraza_de_hondaforja"], ("primer_tajo",["impacto_subito","trofeos","cazador_incansable"],"golpe_de_gracia")),
 ],
 "Soporte": [
  ("Guardián",  ["botas_de_azogue","incensario_dorado","relicario_de_hierro","manto_onirico","coraza_de_hondaforja","yelmo_del_abismo"], ("custodio",["placas_de_hueso","segundo_aliento","raices_profundas"],"caudal_de_mana")),
  ("Luciérnaga",["botas_de_lucidez","incensario_dorado","eco_de_brasas","manto_onirico","yelmo_del_abismo","relicario_de_hierro"], ("luciernaga",["caudal_de_mana","trascendencia","chamuscar"],"segundo_aliento")),
  ("Escarcha",  ["botas_de_acero","relicario_de_hierro","coraza_de_hondaforja","manto_onirico","incensario_dorado","capa_del_angel"], ("senor_de_la_escarcha",["placas_de_hueso","inquebrantable","raices_profundas"],"triunfo")),
 ],
}
SUMMONERS_BY_POSITION = {"jungle": ["flash","smite"], "top": ["flash","teleport"], "mid": ["flash","ignite"], "bot": ["flash","heal"], "support": ["flash","exhaust"]}

def position_of(c):
    """Posición principal según el rol del campeón (misma regla que ROLE_OF en world.js)."""
    r = c["role"]
    if "Jungla" in r: return "jungle"
    if c["cls"] == "Soporte": return "support"
    if c["cls"] == "Tirador": return "bot"
    if "Mid" in r: return "mid"
    return "top"

def item_sets(prev):
    """3 sets por campeón; conserva popularidad/victorias de la simulación anterior por id."""
    old = {s["id"]: s for s in prev}
    out = []
    for c in CHAMPIONS:
        pos = position_of(c)
        for i, (name, items, (key, minors, sec)) in enumerate(SET_TEMPLATES[c["cls"]]):
            sid = f"{c['id']}_{i+1}"
            o = old.get(sid, {})
            out.append(dict(id=sid, champ=c["id"], name=name, featured=(i == 0), items=items,
                            runes=dict(key=key, minors=minors, secondary=sec), summoners=SUMMONERS_BY_POSITION[pos],
                            popularity=o.get("popularity", 0), games=o.get("games", 0), wins=o.get("wins", 0), winrate=o.get("winrate", 0.0)))
    return out

MAPS = [
 dict(id="grieta_ceniza",name="La Grieta de Ceniza",mode="5v5 clásico",size=[14000,14000],lanes=3,towers_per_lane=3,
      inhibitors=0,nexus=True,objectives=["Dragón Elemental (min 6, 4:30 tras morir)","Heraldo de Forja (min 6, en el foso del Señor hasta el min 11)","Señor de la Ceniza (min 11, cada 6 min)"],
      super_minions="Al caer la torre base de un carril (reglas Wild Rift, sin inhibidores)",
      jungle_camps=12,target_minutes=[25,35],win="Destruir el Nexo enemigo"),
 dict(id="puente_niebla",name="Puente de la Niebla",mode="5v5 ARAM (un carril)",size=[12000,3200],lanes=1,towers_per_lane=4,
      inhibitors=1,nexus=True,objectives=["Reliquias de vida cada 60 s"],jungle_camps=0,target_minutes=[15,22],
      win="Destruir el Nexo enemigo; selección aleatoria; sin regreso a base"),
 dict(id="ruinas_eclipse",name="Ruinas del Eclipse",mode="3v3 dominio",size=[9000,9000],lanes=2,towers_per_lane=2,
      inhibitors=0,nexus=True,objectives=["3 altares de captura (puntos)","Avatar del Eclipse (min 10)"],jungle_camps=6,
      target_minutes=[12,18],win="Llegar a 500 puntos o destruir el Nexo"),
]

def stats_for(c):
    s = dict(CLASS_STATS[c["cls"]])
    for k, v in c["stats"].items():
        s["as_" if k == "as" else k] = s["as_" if k == "as" else k] + v
    s["attack_speed"] = s.pop("as_"); s["attack_speed_growth_pct"] = s.pop("as_g")
    return s

def at_level(s, lvl):
    g = lambda base, gr: round(base + gr * (lvl - 1) * (0.7025 + 0.0175 * (lvl - 1)), 1)  # curva tipo MOBA
    return dict(hp=g(s["hp"], s["hp_g"]), ad=g(s["ad"], s["ad_g"]), armor=g(s["armor"], s["armor_g"]), mr=g(s["mr"], s["mr_g"]))

def validate(champs):
    err = []
    ids = [c["id"] for c in champs]
    if len(champs) != 15: err.append(f"se esperan 15 campeones, hay {len(champs)}")
    if len(set(ids)) != len(ids): err.append("ids duplicados")
    for c in champs:
        keys = [a["key"] for a in c["abilities"]]
        if keys != ["Q","W","E","R"]: err.append(f"{c['id']}: habilidades {keys}")
        for a in c["abilities"]:
            n = 3 if a["key"] == "R" else 5
            if len(a["cooldown"]) != n or len(a["base"]) != n: err.append(f"{c['id']} {a['key']}: rangos != {n}")
            if any(x < y for x, y in zip(a["cooldown"], a["cooldown"][1:])): err.append(f"{c['id']} {a['key']}: el CD sube con el rango")
        for f in ("race","faction","cls","role","damage","resource","lore"):
            if not c.get(f): err.append(f"{c['id']}: falta {f}")
    for c in champs:
        p = PRESENTATION.get(c["id"])
        if not p: err.append(f"{c['id']}: falta PRESENTATION"); continue
        for f in ("arma", "cuerpo", "color", "aspectos"):
            if not p.get(f): err.append(f"{c['id']}: presentación sin {f}")
    classes = {c["cls"] for c in champs}
    if classes != set(CLASS_STATS): err.append(f"clases sin cubrir: {set(CLASS_STATS)-classes}")
    # equilibrio: daño bruto de la combinación completa a nivel 9 (rango 3 de QWE, R rango 2) sin objetos
    burst = {}
    for c in champs:
        s = at_level(stats_for(c), 9); tot = 0
        for a in c["abilities"]:
            r = 1 if a["key"] == "R" else 2
            tot += a["base"][r] + a["ratio"].get("ad", 0) * s["ad"] + a["ratio"].get("ad_bonus", 0) * 0
        burst[c["id"]] = round(tot)
    m = statistics.mean(burst.values())
    for k, v in burst.items():
        if not 0.4 * m <= v <= 1.9 * m: err.append(f"desequilibrio: {k} combo={v} (media {m:.0f})")
    return err, burst

# Contrato de clips de los modelos definitivos (model_specs.json): Idle, Run, Attack, Cast, Death (+ Cast_Q..R opcionales)
ANIMS = dict(Idle="Idle", Run="Run", Attack="Attack", Cast="Cast", Death="Death", Cast_Q="Cast_Q", Cast_W="Cast_W", Cast_E="Cast_E", Cast_R="Cast_R")
OPTIONAL_ANIMS = ("Cast_Q", "Cast_W", "Cast_E", "Cast_R")

def attack_type(c):
    """melee < 200 u. de alcance; a distancia: 'magic' si el daño es mágico, si no 'ranged'."""
    r = stats_for(c)["range"]
    if r < 200: return "melee"
    return "magic" if c["damage"] == "Mágico" else "ranged"

def presentation_for(c):
    p = PRESENTATION[c["id"]]; ta = attack_type(c)
    cast = {}
    for a in c["abilities"]:
        k = VFX_BY_ABILITY_TYPE.get(a["type"], "auto")
        if k == "auto": k = {"melee": "estela", "ranged": "proyectil", "magic": "glifo"}[ta]
        cast[a["key"]] = dict(kind=k, color=p["color"], name=a["name"])
    return dict(id=c["id"], name=c["name"], title=c["title"], tipoAtaque=ta, arma=p["arma"], cuerpo=p["cuerpo"], color=p["color"],
                clase=c["cls"], raza=c["race"], rol=c["role"], faccion=c["faction"], recurso=c["resource"], dificultad=c["difficulty"],
                anims=dict(ANIMS), animsOpcionales=list(OPTIONAL_ANIMS),
                vfx=dict(spawn=dict(kind="columna", color="equipo"), cast=cast, death=dict(kind="fragmentos", color=p["color"])),
                aspectos=[dict(id=i, nombre=n, modelo=m) for i, n, m in p["aspectos"]],
                lore=c["lore"], pasiva=dict(c["passive"]),
                **{a["key"]: dict(name=a["name"], type=a["type"], desc=a["desc"], cooldown=a["cooldown"], cost=a["cost"], base=a["base"], ratio=a["ratio"], range=a["range"]) for a in c["abilities"]})

def presentation_md(champs):
    L = ["", "## Ficha y presentación", "",
         "> Sección GENERADA (agente G) desde `PRESENTATION` en `tools/champions_src.py`. Datos vivos en `assets/data/champion_presentation.json`; la ficha de selección es `game/src/fichas.js` y los efectos `game/src/vfx.js`.", "",
         "Tipo de ataque: **cuerpo a cuerpo** si el alcance base es < 200 u.; a distancia **físico** o **mágico** según el daño. Clips obligatorios del modelo definitivo: `Idle, Run, Attack, Cast, Death` (`Cast_Q..R` opcionales).", "",
         "| Campeón | Tipo de ataque | Arma | Cuerpo | Aspectos | Color FX | Efectos Q / W / E / R |", "|---|---|---|---|---|---|---|"]
    T = {"melee": "Cuerpo a cuerpo", "ranged": "A distancia (físico)", "magic": "A distancia (mágico)"}
    for c in champs:
        p = presentation_for(c)
        L.append(f"| **{p['name']}** | {T[p['tipoAtaque']]} | {p['arma']} | {p['cuerpo']} | {', '.join(a['nombre'] + ' (`' + a['modelo'] + '`)' for a in p['aspectos'])} | `{p['color']}` | " + " / ".join(p['vfx']['cast'][k]['kind'] for k in "QWER") + " |")
    L += ["", "Efectos de `vfx.js`: aparición = columna de luz del color del equipo + escala desde 0 (`back.out`); reaparición = anillo expansivo; muerte = caída + desvanecido + fragmentos del color del campeón; lanzamiento = estela (cuerpo a cuerpo), proyectil con cola (distancia) o glifo bajo los pies (mágico); épicos = rugido con sacudida de cámara; torre = derrumbe; dragón = tinte por elemento."]
    return L

def roster_md(champs, burst):
    L = ["# Plantel de campeones — Coronas de Ceniza (demo)", "",
         "> Documento GENERADO por `tools/build_design.py` a partir de `tools/champions_src.py`. No lo edites a mano.", "",
         "## Overview", "15 campeones originales que cubren las 6 clases, 10 razas y 9 facciones. Cada uno tiene una pasiva, 4 habilidades (Q/W/E con 5 rangos, R con 3), estadísticas de nivel 1 y crecimiento por nivel.", "",
         "## Player Fantasy", "Que cada jugador encuentre su campeón: el muro inamovible, la asesina en la sombra, el arquero preciso o la curandera que salva la pelea.", "", "## Resumen", "", "| # | Campeón | Título | Raza | Facción | Clase | Rol | Daño | Recurso | Dif. | Vida N1/N18 | AD N1 | Alcance | Combo N9* |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for i, c in enumerate(champs, 1):
        s = stats_for(c); l18 = at_level(s, 18)
        L.append(f"| {i} | **{c['name']}** | {c['title']} | {c['race']} | {c['faction']} | {c['cls']} | {c['role']} | {c['damage']} | {c['resource']} | {'★'*c['difficulty']} | {s['hp']:.0f}/{l18['hp']:.0f} | {s['ad']:.0f} | {s['range']} | {burst[c['id']]} |")
    L += ["", "*Daño base de las 4 habilidades a nivel 9 sin objetos; es un indicador de equilibrio, no de DPS.", "", "## Detailed Rules"]
    for c in champs:
        s = stats_for(c)
        L += ["", f"### {c['name']}, {c['title']}", f"*{c['race']} · {c['faction']} · {c['cls']} · {c['role']}*", "", f"> {c['lore']}", "",
              f"**Estadísticas N1:** Vida {s['hp']} (+{s['hp_g']}) · AD {s['ad']} (+{s['ad_g']}) · Armadura {s['armor']} (+{s['armor_g']}) · RM {s['mr']} (+{s['mr_g']}) · Vel. ataque {s['attack_speed']} (+{s['attack_speed_growth_pct']}%) · Vel. mov. {s['ms']} · Alcance {s['range']}", "",
              f"**Pasiva — {c['passive']['name']}:** {c['passive']['desc']}", "", "| Tecla | Habilidad | Tipo | Efecto | Daño/valor | Escalado | CD (s) | Coste | Alcance |", "|---|---|---|---|---|---|---|---|---|"]
        for a in c["abilities"]:
            ratio = ", ".join(f"{int(v*100)}% {k.upper()}" for k, v in a["ratio"].items()) or "—"
            L.append(f"| {a['key']} | {a['name']} | {a['type']} | {a['desc']} | {'/'.join(str(x) for x in a['base'])} | {ratio} | {'/'.join(str(x) for x in a['cooldown'])} | {a['cost'] or '—'} | {'Global' if a['range']>20000 else a['range']} |")
    L += ["", "## Formulas", "- Estadística a nivel n = base + crecimiento × (n−1) × (0,7025 + 0,0175 × (n−1)).",
          "- Daño de habilidad = base[rango] + Σ(ratio × estadística).",
          "- Mitigación = 100 / (100 + resistencia) (física con armadura, mágica con RM).", "",
          "## Edge Cases", "- Zerath no puede lanzar habilidades si el coste (5% de vida actual) le dejaría por debajo de 1 punto de vida.",
          "- La R de Tharok (vida mínima 1) no impide la muerte por daño verdadero de torre de Nexo.",
          "- La R de Ossuar (Cripta) no bloquea las habilidades globales (R de Lyra).", "",
          "## Dependencies", "- `design/gdd/combat-core.md` (fórmulas de daño, control de masas)", "- `design/gdd/progression-economy.md` (niveles, oro, objetos)", "",
          "## Tuning Knobs", "- `CLASS_STATS` (plantilla por clase) y `stats` (desviaciones por campeón) en `tools/champions_src.py`.", "- Banda de equilibrio del combo: 40%–190% de la media (validada por `--check`).", "",
          "## Acceptance Criteria", "- `python3 tools/build_design.py --check` termina sin errores.", "- Las 6 clases están cubiertas, cada campeón tiene Q/W/E/R y una pasiva, y los CD nunca suben con el rango."]
    L += presentation_md(champs)
    return "\n".join(L) + "\n"

def main():
    err, burst = validate(CHAMPIONS)
    for e in err: print("ERROR:", e)
    if "--check" in sys.argv:
        print(f"{len(CHAMPIONS)} campeones, {len(ITEMS)} objetos, {len(MAPS)} mapas — {'OK' if not err else 'FALLOS'}")
        sys.exit(1 if err else 0)
    if err: sys.exit(1)
    DATA.mkdir(parents=True, exist_ok=True)
    out = [dict({k: v for k, v in c.items() if k != "stats"}, class_=c["cls"], base_stats=stats_for(c),
                level18=at_level(stats_for(c), 18)) for c in CHAMPIONS]
    for o in out: o.pop("cls"); o["class"] = o.pop("class_")
    (DATA / "champions.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "items.json").write_text(json.dumps([dict(id=i, name=n, cost=c, stats=s, unique=u, **x) for i, n, c, s, u, x in ITEMS], ensure_ascii=False, indent=2), encoding="utf-8")
    sets_path = DATA / "item_sets.json"
    prev_sets = json.loads(sets_path.read_text(encoding="utf-8")) if sets_path.exists() else []
    if isinstance(prev_sets, dict): prev_sets = prev_sets.get("sets", [])
    (sets_path).write_text(json.dumps(item_sets(prev_sets), ensure_ascii=False, indent=1), encoding="utf-8")
    runes = (DATA / "runes.json").read_text(encoding="utf-8")
    (DATA / "maps.json").write_text(json.dumps(MAPS, ensure_ascii=False, indent=2), encoding="utf-8")
    pres = [presentation_for(c) for c in CHAMPIONS]
    (DATA / "champion_presentation.json").write_text(json.dumps(pres, ensure_ascii=False, indent=2), encoding="utf-8")
    gs = ROOT / "game/src"; gs.mkdir(parents=True, exist_ok=True)
    (gs / "data.js").write_text("// GENERADO por tools/build_design.py — no editar.\n"
        + "export const CHAMPIONS = " + json.dumps(out, ensure_ascii=False) + ";\n"
        + "export const ITEMS = " + (DATA / "items.json").read_text(encoding="utf-8") + ";\n"
        + "export const MAPS = " + (DATA / "maps.json").read_text(encoding="utf-8") + ";\n"
        + "export const ITEM_SETS = " + sets_path.read_text(encoding="utf-8") + ";\n"
        + "export const RUNES = " + runes + ";\n"
        + "export const PRESENTATION = " + json.dumps(pres, ensure_ascii=False) + ";\n", encoding="utf-8")
    (ROOT / "design/gdd").mkdir(parents=True, exist_ok=True)
    (ROOT / "design/gdd/champion-roster.md").write_text(roster_md(CHAMPIONS, burst), encoding="utf-8")
    print("Generado: assets/data/champions.json, items.json, maps.json, champion_presentation.json, game/src/data.js, design/gdd/champion-roster.md")
    print("Combo N9:", burst)

if __name__ == "__main__": main()
