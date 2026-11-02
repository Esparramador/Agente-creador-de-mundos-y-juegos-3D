"""Genera AGENTS.md (y GEMINI.md) para usar el estudio de agentes de .claude/ con cualquier IA
que lea AGENTS.md: Codex, Cursor, Gemini CLI, GitHub Copilot, Windsurf, Aider... Uso: python3 tools/gen_agents_md.py
Claude Code no lo necesita: lee .claude/ y CLAUDE.md directamente."""
import os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
def fm(path):
    t = open(path, encoding='utf-8').read(); m = re.match(r'^---\n(.*?)\n---', t, re.S); d = {}
    for l in (m.group(1).splitlines() if m else []):
        mm = re.match(r'^([\w-]+):\s*(.*)$', l)
        if mm: d[mm.group(1)] = mm.group(2).strip().strip('"')
    return d
agents = sorted(((fm(os.path.join(ROOT, '.claude/agents', f)), f) for f in os.listdir(os.path.join(ROOT, '.claude/agents')) if f.endswith('.md')), key=lambda x: x[1])
skills = sorted(((fm(os.path.join(ROOT, '.claude/skills', d, 'SKILL.md')), d) for d in os.listdir(os.path.join(ROOT, '.claude/skills')) if os.path.exists(os.path.join(ROOT, '.claude/skills', d, 'SKILL.md'))), key=lambda x: x[1])
out = ["# AGENTS.md — Estudio de agentes (CCGS) + Coronas de Ceniza", "",
 "> Generado por `tools/gen_agents_md.py` desde `.claude/`. Para cualquier asistente de IA que lea AGENTS.md. Claude Code usa `.claude/` y `CLAUDE.md` de forma nativa.", "",
 "## Cómo trabajar en este repositorio",
 "1. Lee `CLAUDE.md`: protocolo de colaboración (pregunta → opciones → decisión → borrador → aprobación), estándares de código y reglas de coordinación.",
 "2. **Actuar como un agente:** cuando el usuario diga «usa el agente X» (o la tarea sea de su dominio), lee `.claude/agents/X.md` y sigue su rol, límites y escalado.",
 "3. **Ejecutar una skill:** cuando el usuario escriba `/nombre` (o pida esa tarea), lee `.claude/skills/nombre/SKILL.md` y sigue sus fases en orden, incluidas sus `references/`.",
 "4. **Equipos (`/team-*`):** la skill indica qué agentes intervienen. Si tu herramienta no puede lanzar subagentes, interpreta cada rol en secuencia y separa las salidas por agente.",
 "5. **Reglas por ruta:** antes de editar, mira `.claude/rules/*.md`; cada regla indica en su cabecera `paths:` a qué carpetas aplica.",
 "6. **Hooks:** en Claude Code se ejecutan solos. En otra IA, ejecuta tú las comprobaciones equivalentes antes de hacer commit: `bash .claude/hooks/validate-commit.sh` recibe JSON por stdin; en la práctica, lanza las pruebas de abajo.",
 "7. No hagas commit sin que el usuario lo pida. Antes de escribir un archivo, pregunta «¿Puedo escribir en [ruta]?».", "",
 "## Proyecto: comandos", "```bash",
 "python3 tools/build_design.py            # datos de campeones -> juego (+ --check)",
 "node game/tools/bundle.mjs               # juego -> game/dist/coronas-de-ceniza.html",
 "node --test game/tests/game.test.mjs     # 77 pruebas de simulación",
 "python3 game/tests/e2e_browser.py        # 35 comprobaciones en navegador",
 "node game/tools/validate_models.mjs --current   # modelos 3D",
 "python3 studio-tests/run_capability_tests.py    # integridad del estudio de agentes",
 "python3 tools/blender/build_maps.py <mapa>      # mapas en Blender (bpy 4.2)",
 "```",
 "Traspaso de arte 3D: `production/handoff/BLENDER-3D-HANDOFF.md` · Diseño de niveles: `design/levels/` · GDD: `design/gdd/`.", "",
 f"## Agentes ({len(agents)}) — `.claude/agents/<nombre>.md`", "", "| Agente | Modelo | Cuándo usarlo |", "|---|---|---|"]
out += [f"| `{d.get('name', f[:-3])}` | {d.get('model', 'inherit')} | {d.get('description', '')} |" for d, f in agents]
out += ["", f"## Skills ({len(skills)}) — `.claude/skills/<nombre>/SKILL.md`, se invocan como `/nombre`", "", "| Skill | Para qué |", "|---|---|"]
out += [f"| `/{d.get('name', n)}` | {d.get('description', '')} |" for d, n in skills]
txt = "\n".join(out) + "\n"
for name in ('AGENTS.md', 'GEMINI.md'): open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(txt)
print(f'AGENTS.md y GEMINI.md: {len(agents)} agentes, {len(skills)} skills')
