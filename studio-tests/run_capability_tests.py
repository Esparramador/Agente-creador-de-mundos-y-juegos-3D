#!/usr/bin/env python3
"""
CCGS capability test suite — verifies, by actually executing things, that the
studio (49 agents, 74 skills, hooks, rules, scripts, config) is complete and works.

Layers
  L1  Inventory & integrity     agents/skills/rules/templates parse, names match, catalog covers all
  L2  Configuration             settings.json valid, every hook command exists, @imports resolve
  L3  Scripts                   all .sh pass `bash -n`; key helpers run and emit expected rows
  L4  Hooks (behavioral)        real JSON payloads into hooks in a sandbox copy: block / allow
  L5  Permissions               deny rules really match destructive commands, not safe ones
  L6  End-to-end workflow       configure engine + stage in a sandbox, project-state reflects it
  L7  Live LLM (optional)       if `claude` CLI is installed: headless run of skills/agents

Usage:  python3 studio-tests/run_capability_tests.py [--live] [--junit FILE]
Exit 0 only if every non-skipped test passes.
"""
import argparse, fnmatch, json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CL = ROOT / ".claude"
RESULTS = []  # (layer, name, status, detail)


def record(layer, name, ok, detail=""):
    RESULTS.append((layer, name, "PASS" if ok else "FAIL", detail))


def skip(layer, name, detail):
    RESULTS.append((layer, name, "SKIP", detail))


def run(cmd, cwd=ROOT, stdin=None, env=None, timeout=120):
    e = dict(os.environ, **(env or {}))
    p = subprocess.run(cmd, cwd=cwd, input=stdin, capture_output=True, text=True,
                       env=e, timeout=timeout, shell=isinstance(cmd, str))
    return p.returncode, p.stdout, p.stderr


def frontmatter(path):
    txt = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    if not m:
        return None, txt
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r"^([A-Za-z][\w-]*):\s*(.*)$", line)
        if mm:
            fm[mm.group(1)] = mm.group(2).strip().strip('"')
    return fm, txt[m.end():]


# ---------------------------------------------------------------- L1
def l1_inventory():
    L = "L1"
    agents = sorted(CL.glob("agents/*.md"))
    record(L, "49 agents present", len(agents) == 49, f"found {len(agents)}")
    valid_models = {"opus", "sonnet", "haiku", "inherit"}
    for a in agents:
        fm, body = frontmatter(a)
        problems = []
        if fm is None:
            problems.append("no frontmatter")
        else:
            if fm.get("name") != a.stem: problems.append(f"name={fm.get('name')}")
            if len(fm.get("description", "")) < 20: problems.append("weak description")
            if fm.get("model", "inherit") not in valid_models: problems.append(f"model={fm.get('model')}")
            if "tools" not in fm: problems.append("no tools")
            if len(body.strip()) < 300: problems.append("body too short")
        record(L, f"agent:{a.stem}", not problems, ", ".join(problems))

    skills = sorted(p for p in CL.glob("skills/*") if p.is_dir())
    record(L, "74 skills present", len(skills) == 74, f"found {len(skills)}")
    for s in skills:
        f = s / "SKILL.md"
        problems = []
        if not f.exists():
            problems.append("no SKILL.md")
        else:
            fm, body = frontmatter(f)
            if fm is None: problems.append("no frontmatter")
            else:
                if fm.get("name") != s.name: problems.append(f"name={fm.get('name')}")
                if not fm.get("description"): problems.append("no description")
            # references mentioned must exist
            for ref in re.findall(r"references/([\w.-]+\.md)", f.read_text()):
                if not (s / "references" / ref).exists():
                    problems.append(f"missing ref {ref}")
        record(L, f"skill:{s.name}", not problems, ", ".join(sorted(set(problems))))

    # agents referenced by skills must exist
    names = {a.stem for a in agents}
    missing = set()
    for f in CL.glob("skills/**/*.md"):
        for m in re.findall(r'subagent_type[`"\s:=]+[`"]?([a-z][a-z0-9-]+)', f.read_text()):
            if m not in names and m not in {"general-purpose", "explore", "plan"}:
                missing.add(f"{f.parent.name}->{m}")
    record(L, "skills delegate only to existing agents", not missing, ", ".join(sorted(missing)))

    # catalog coverage
    cat = (ROOT / "studio-tests/catalog.yaml").read_text()
    cat_names = set(re.findall(r"^\s*- name:\s*([\w-]+)", cat, re.M))
    miss_s = {s.name for s in skills} - cat_names
    miss_a = names - cat_names
    record(L, "catalog covers all skills", not miss_s, ", ".join(sorted(miss_s)))
    record(L, "catalog covers all agents", not miss_a, ", ".join(sorted(miss_a)))
    specs = re.findall(r"^\s*spec:\s*(\S+)", cat, re.M)
    bad = [s for s in specs if s and not (ROOT / s).exists()]
    record(L, f"catalog spec files exist ({len(specs)})", not bad, ", ".join(bad[:10]))

    rules = list(CL.glob("rules/*.md"))
    record(L, "14 rules present", len(rules) == 14, f"found {len(rules)}")
    for r in rules:
        fm, _ = frontmatter(r)
        record(L, f"rule:{r.stem} has paths scope", fm is not None and "paths" in (fm or {}) or "paths:" in r.read_text()[:400])
    tmpl = list(CL.glob("docs/templates/*.*"))
    record(L, "templates present (>=62)", len(tmpl) >= 62, f"found {len(tmpl)}")


# ---------------------------------------------------------------- L2
def l2_config():
    L = "L2"
    try:
        s = json.loads((CL / "settings.json").read_text()); ok = True
    except Exception as e:
        s, ok = {}, False
    record(L, "settings.json is valid JSON", ok)
    cmds = []
    for ev, arr in s.get("hooks", {}).items():
        for m in arr:
            for h in m.get("hooks", []):
                cmds.append((ev, h["command"]))
    record(L, "hooks registered (15)", len(cmds) == 15, f"found {len(cmds)}")
    for ev, c in cmds:
        m = re.search(r"\.claude/hooks/[\w.-]+\.sh", c)
        record(L, f"hook file exists: {ev} {m.group(0) if m else c}", bool(m) and (ROOT / m.group(0)).exists())
    for f in ["CLAUDE.md", "docs/CLAUDE.md", "design/CLAUDE.md", "src/CLAUDE.md"]:
        p = ROOT / f
        if not p.exists(): continue
        imports = re.findall(r"^@(\S+)", p.read_text(), re.M)
        bad = [i for i in imports if not (ROOT / i).exists()]
        record(L, f"{f} @imports resolve ({len(imports)})", not bad, ", ".join(bad))
    rc, out, err = run(["awk", "-f", ".claude/scripts/yaml-get.awk", "project.yaml"])
    record(L, "project.yaml readable / schema_version", "schema_version: 1" in (ROOT / "project.yaml").read_text())


# ---------------------------------------------------------------- L3
def l3_scripts():
    L = "L3"
    shs = list(CL.glob("hooks/*.sh")) + list(CL.glob("scripts/*.sh")) + [CL / "statusline.sh"]
    for f in shs:
        rc, _, err = run(["bash", "-n", str(f)])
        record(L, f"syntax {f.relative_to(ROOT)}", rc == 0, err.strip()[:200])
    rc, out, _ = run("bash .claude/scripts/skill-lint.sh all")
    m = re.search(r"checked\s+(\d+) of (\d+)", out)
    record(L, "skill-lint all checks 74/74", bool(m) and m.group(1) == m.group(2) == "74", m.group(0) if m else out[-200:])
    nofm = [l for l in out.splitlines() if l.startswith("check1") and "frontmatter=ok" not in l]
    record(L, "skill-lint: every skill frontmatter=ok", not nofm, "; ".join(nofm[:5]))
    rc, out, _ = run("bash .claude/scripts/agent-check.sh")
    record(L, "agent-check sees 49 agents / 74 skills", "AGENTS: 49" in out and "SKILLS: 74" in out)
    badfm = re.findall(r"AGENT: (\S+) frontmatter=(?!ok)\S+", out)
    record(L, "agent-check: all agent frontmatter ok", not badfm, ", ".join(badfm))
    rc, out, _ = run("bash .claude/scripts/project-state.sh")
    record(L, "project-state.sh runs", rc == 0 and re.search(r"^engine\t", out, re.M) is not None, out[:120])
    rc, out, _ = run("bash .claude/statusline.sh", stdin='{"model":{"display_name":"test"},"workspace":{"current_dir":"%s"}}' % ROOT)
    record(L, "statusline.sh runs", rc == 0, (out + _)[:120])


# ---------------------------------------------------------------- sandbox
def make_sandbox():
    d = Path(tempfile.mkdtemp(prefix="ccgs-test-"))
    shutil.copytree(ROOT, d / "p", ignore=shutil.ignore_patterns(".git"))
    p = d / "p"
    run("git init -q -b main && git -c user.email=t@t -c user.name=t add -A && git -c user.email=t@t -c user.name=t commit -qm init", cwd=p)
    return p


def hook(p, name, payload):
    return run(["bash", f".claude/hooks/{name}.sh"], cwd=p, stdin=json.dumps(payload),
               env={"CLAUDE_PROJECT_DIR": str(p)})


# ---------------------------------------------------------------- L4
def l4_hooks(p):
    L = "L4"
    # validate-assets: invalid JSON in data dir -> block (2); valid -> 0
    (p / "assets/data").mkdir(parents=True, exist_ok=True)
    bad = p / "assets/data/enemies.json"; bad.write_text('{"hp": 10,,}')
    rc, _, err = hook(p, "validate-assets", {"tool_name": "Write", "tool_input": {"file_path": str(bad)}})
    record(L, "validate-assets blocks invalid JSON", rc == 2, f"rc={rc} {err.strip()[:120]}")
    bad.write_text('{"hp": 10}')
    rc, _, err = hook(p, "validate-assets", {"tool_name": "Write", "tool_input": {"file_path": str(bad)}})
    record(L, "validate-assets allows valid JSON", rc == 0, f"rc={rc}")
    # validate-commit: staged invalid JSON -> block
    bad.write_text('{broken'); run("git add -A", cwd=p)
    rc, _, err = hook(p, "validate-commit", {"tool_name": "Bash", "tool_input": {"command": "git commit -m 'x'"}})
    record(L, "validate-commit blocks commit with invalid staged JSON", rc == 2, f"rc={rc} {err.strip()[:120]}")
    bad.write_text('{"ok": true}'); run("git add -A", cwd=p)
    rc, _, err = hook(p, "validate-commit", {"tool_name": "Bash", "tool_input": {"command": "git commit -m 'x'"}})
    record(L, "validate-commit allows clean commit", rc == 0, f"rc={rc} {err.strip()[:120]}")
    rc, _, _ = hook(p, "validate-commit", {"tool_name": "Bash", "tool_input": {"command": "ls -la"}})
    record(L, "validate-commit ignores non-commit commands", rc == 0)
    # validate-read: huge design doc read whole -> refused; bounded -> allowed
    (p / "design/gdd").mkdir(parents=True, exist_ok=True)
    big = p / "design/gdd/combat.md"
    big.write_text("".join(f"## Section {i}\n" + ("lorem ipsum " * 60 + "\n") * 5 for i in range(150)))
    rc, _, err = hook(p, "validate-read", {"tool_name": "Read", "tool_input": {"file_path": str(big)}})
    record(L, "validate-read refuses whole read of large GDD", rc == 2 and "Read refused" in err, f"rc={rc} size={big.stat().st_size}")
    rc, _, _ = hook(p, "validate-read", {"tool_name": "Read", "tool_input": {"file_path": str(big), "offset": 1, "limit": 50}})
    record(L, "validate-read allows bounded read", rc == 0, f"rc={rc}")
    rc, _, _ = hook(p, "validate-read", {"tool_name": "Read", "tool_input": {"file_path": str(p / "README.md")}})
    record(L, "validate-read ignores non-design files", rc == 0)
    # non-blocking hooks must run cleanly
    for name, payload in [
        ("session-start", {}), ("detect-gaps", {}), ("pre-compact", {}), ("session-stop", {}),
        ("validate-push", {"tool_name": "Bash", "tool_input": {"command": "git push origin main"}}),
        ("validate-write", {"tool_name": "Write", "tool_input": {"file_path": str(p / "src/player.gd"), "content": "extends Node\n"}}),
        ("validate-registry", {"tool_name": "Write", "tool_input": {"file_path": str(p / "src/a.gd"), "content": "x"}}),
        ("validate-skill-change", {"tool_name": "Write", "tool_input": {"file_path": str(p / ".claude/skills/help/SKILL.md")}}),
        ("log-agent", {"agent_type": "gameplay-programmer", "agent_id": "t1"}),
        ("log-agent-stop", {"agent_type": "gameplay-programmer", "agent_id": "t1"}),
        ("validate-agent-artifact", {"agent_type": "gameplay-programmer", "agent_id": "t1"}),
        ("notify", {"message": "test", "notification_type": "idle_prompt"}),
    ]:
        rc, out, err = hook(p, name, payload)
        record(L, f"hook {name} runs (exit 0)", rc == 0, f"rc={rc} {err.strip()[:150]}")
    rc, out, _ = hook(p, "session-start", {})
    record(L, "session-start emits studio context", "Claude Code Game Studios" in out)


# ---------------------------------------------------------------- L5
def l5_permissions():
    L = "L5"
    s = json.loads((CL / "settings.json").read_text())
    deny = [re.match(r"Bash\((.*)\)$", d).group(1) for d in s["permissions"]["deny"] if d.startswith("Bash(")]
    def denied(c): return any(fnmatch.fnmatchcase(c, pat) for pat in deny)
    for c in ["rm -rf /", "rm -fr build", "git push --force origin main", "git push -f origin main",
              "git reset --hard HEAD~3", "git clean -fdx"]:
        record(L, f"deny: {c}", denied(c))
    for c in ["git status", "git push origin main", "rm file.txt", "git commit -m ok"]:
        record(L, f"allow: {c}", not denied(c))


# ---------------------------------------------------------------- L6
def l6_e2e(p):
    L = "L6"
    before = (p / "project.yaml").read_text()
    rc, out, err = run("bash .claude/scripts/config-set.sh engine.name godot", cwd=p)
    record(L, "config-set rejects invalid enum value", rc != 0 and (p / "project.yaml").read_text() == before, f"rc={rc}")
    rc, out, err = run("bash .claude/scripts/config-set.sh engine.name Godot", cwd=p)
    record(L, "config-set writes engine into project.yaml", rc == 0 and "Godot" in (p / "project.yaml").read_text(), (out + err)[:200])
    rc, out, err = run("bash .claude/scripts/set-stage.sh Concept", cwd=p)
    record(L, "set-stage Concept", rc == 0, (out + err)[:200])
    rc, out, _ = run("bash .claude/scripts/project-state.sh", cwd=p)
    record(L, "project-state detects configured engine", re.search(r"^engine\t.*godot", out, re.M | re.I) is not None, out[:200])
    # simulate a GDD + story and check the helpers see them
    (p / "design/gdd").mkdir(parents=True, exist_ok=True)
    (p / "design/gdd/movement.md").write_text("# Movement\n\n## Overview\nPlayer runs.\n")
    (p / "production/epics/core").mkdir(parents=True, exist_ok=True)
    (p / "production/epics/core/story-001.md").write_text("# Story 001\nStatus: Ready\n")
    rc, out, _ = run("bash .claude/scripts/project-state.sh", cwd=p)
    record(L, "project-state counts new GDD", re.search(r"^gdd_files\t[1-9]", out, re.M) is not None)
    record(L, "project-state counts new story", re.search(r"^story\t[1-9]", out, re.M) is not None)
    rc, out, err = run("bash .claude/scripts/gdd-structure-check.sh design/gdd/movement.md", cwd=p)
    record(L, "gdd-structure-check runs on a GDD", rc in (0,), (out + err)[:200])


# ---------------------------------------------------------------- L7
def l7_live(enabled):
    L = "L7"
    if not enabled:
        skip(L, "live LLM tests", "run with --live (needs `claude` CLI + ANTHROPIC_API_KEY)"); return
    if not shutil.which("claude"):
        skip(L, "live LLM tests", "`claude` CLI not installed (npm i -g @anthropic-ai/claude-code)"); return
    p = make_sandbox()
    cases = [
        ("/help responds with a next step", "/help", r"(?i)start|next"),
        ("/project-stage-detect reports a stage", "/project-stage-detect", r"(?i)stage|concept|pre-production"),
        ("agent creative-director answers in role", "Use the creative-director agent: in one sentence, what are your responsibilities?", r"(?i)vision|creative"),
        ("agent asks before writing", "Use gameplay-programmer to write src/player.gd with a jump", r"(?i)may i|approve|should i|question"),
    ]
    for name, prompt, pat in cases:
        try:
            rc, out, err = run(["claude", "-p", prompt, "--output-format", "text", "--max-turns", "6"], cwd=p, timeout=300)
            record(L, name, rc == 0 and re.search(pat, out) is not None, out.strip()[:200])
        except subprocess.TimeoutExpired:
            record(L, name, False, "timeout")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true")
    ap.add_argument("--junit")
    a = ap.parse_args()
    t0 = time.time()
    l1_inventory(); l2_config(); l3_scripts()
    sb = make_sandbox()
    try:
        l4_hooks(sb); l5_permissions(); l6_e2e(sb)
    finally:
        shutil.rmtree(sb.parent, ignore_errors=True)
    l7_live(a.live)

    by = {}
    for layer, name, st, det in RESULTS:
        by.setdefault(layer, {"PASS": 0, "FAIL": 0, "SKIP": 0})[st] += 1
        if st != "PASS":
            print(f"[{st}] {layer} {name}" + (f" — {det}" if det else ""))
    print("\nLayer  PASS  FAIL  SKIP")
    for k in sorted(by):
        print(f"{k:5} {by[k]['PASS']:5} {by[k]['FAIL']:5} {by[k]['SKIP']:5}")
    tp = sum(v["PASS"] for v in by.values()); tf = sum(v["FAIL"] for v in by.values())
    print(f"\nTOTAL {tp} passed, {tf} failed, {sum(v['SKIP'] for v in by.values())} skipped "
          f"({100*tp/max(1,tp+tf):.1f}% of executed) in {time.time()-t0:.1f}s")
    if a.junit:
        from xml.sax.saxutils import escape
        rows = "".join(f'<testcase classname="{l}" name="{escape(n)}">' +
                       ({"FAIL": f'<failure message="{escape(d)}"/>', "SKIP": "<skipped/>"}.get(s, "")) +
                       "</testcase>" for l, n, s, d in RESULTS)
        Path(a.junit).write_text(f'<testsuite name="ccgs" tests="{len(RESULTS)}" failures="{tf}">{rows}</testsuite>')
    sys.exit(1 if tf else 0)


if __name__ == "__main__":
    main()
