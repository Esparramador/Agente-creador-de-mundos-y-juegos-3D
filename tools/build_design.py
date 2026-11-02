#!/usr/bin/env python3
"""Genera los datos de juego y los documentos derivados de la demo «Coronas de Ceniza».
   python3 tools/build_design.py          -> escribe assets/data/*.json y design/gdd/champion-roster.md
   python3 tools/build_design.py --check  -> solo valida (código de salida 1 si hay errores)"""
import json, sys, statistics
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from champions_src import CHAMPIONS, CLASS_STATS

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "assets/data"

ITEMS = [  # id, nombre, coste, stats, efecto único
 ("espada_larga","Espada Larga",350,{"ad":10},None),
 ("tomo_amplificador","Tomo Amplificador",435,{"ap":20},None),
 ("cinturon_gigante","Cinturón de Gigante",900,{"hp":350},None),
 ("botas","Botas",300,{"ms":25},None),
 ("filo_del_ocaso","Filo del Ocaso",3000,{"ad":55,"crit":0.20},"Golpes críticos +35% daño."),
 ("arco_de_tormenta","Arco de Tormenta",2900,{"ad":35,"as":0.35},"Cada 3er ataque encadena un rayo (60 mágico)."),
 ("baculo_de_ceniza","Báculo de Ceniza",3100,{"ap":90},"+30% de poder de habilidad total."),
 ("orbe_del_vacio","Orbe del Vacío",2800,{"ap":70,"mpen":0.30},"Penetración mágica 30%."),
 ("coraza_de_hondaforja","Coraza de Hondaforja",2900,{"hp":400,"armor":60},"Refleja 25% del daño de ataques recibidos."),
 ("manto_onirico","Manto Onírico",2800,{"hp":350,"mr":60},"+2% vida máx./s fuera de combate."),
 ("hacha_de_colmillo","Hacha de Colmillo",3200,{"ad":45,"hp":300,"ah":20},"Tras usar una habilidad, el siguiente ataque inflige +100% AD base."),
 ("incensario_dorado","Incensario Dorado",2300,{"ap":45,"heal_power":0.12},"Curar o escudar a un aliado le da +25% vel. ataque 4 s."),
]

MAPS = [
 dict(id="grieta_ceniza",name="La Grieta de Ceniza",mode="5v5 clásico",size=[14000,14000],lanes=3,towers_per_lane=3,
      inhibitors=3,nexus=True,objectives=["Dragón Elemental (min 5, cada 5 min)","Heraldo de Forja (min 8)","Señor de la Ceniza (min 20)"],
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
    (DATA / "items.json").write_text(json.dumps([dict(id=i, name=n, cost=c, stats=s, unique=u) for i, n, c, s, u in ITEMS], ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "maps.json").write_text(json.dumps(MAPS, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "design/gdd").mkdir(parents=True, exist_ok=True)
    (ROOT / "design/gdd/champion-roster.md").write_text(roster_md(CHAMPIONS, burst), encoding="utf-8")
    print("Generado: assets/data/champions.json, items.json, maps.json, design/gdd/champion-roster.md")
    print("Combo N9:", burst)

if __name__ == "__main__": main()
