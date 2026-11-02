# AGENTS.md — Estudio de agentes (CCGS) + Coronas de Ceniza

> Generado por `tools/gen_agents_md.py` desde `.claude/`. Para cualquier asistente de IA que lea AGENTS.md. Claude Code usa `.claude/` y `CLAUDE.md` de forma nativa.

## Cómo trabajar en este repositorio
1. Lee `CLAUDE.md`: protocolo de colaboración (pregunta → opciones → decisión → borrador → aprobación), estándares de código y reglas de coordinación.
2. **Actuar como un agente:** cuando el usuario diga «usa el agente X» (o la tarea sea de su dominio), lee `.claude/agents/X.md` y sigue su rol, límites y escalado.
3. **Ejecutar una skill:** cuando el usuario escriba `/nombre` (o pida esa tarea), lee `.claude/skills/nombre/SKILL.md` y sigue sus fases en orden, incluidas sus `references/`.
4. **Equipos (`/team-*`):** la skill indica qué agentes intervienen. Si tu herramienta no puede lanzar subagentes, interpreta cada rol en secuencia y separa las salidas por agente.
5. **Reglas por ruta:** antes de editar, mira `.claude/rules/*.md`; cada regla indica en su cabecera `paths:` a qué carpetas aplica.
6. **Hooks:** en Claude Code se ejecutan solos. En otra IA, ejecuta tú las comprobaciones equivalentes antes de hacer commit: `bash .claude/hooks/validate-commit.sh` recibe JSON por stdin; en la práctica, lanza las pruebas de abajo.
7. No hagas commit sin que el usuario lo pida. Antes de escribir un archivo, pregunta «¿Puedo escribir en [ruta]?».

## Proyecto: comandos
```bash
python3 tools/build_design.py            # datos de campeones -> juego (+ --check)
node game/tools/bundle.mjs               # juego -> game/dist/coronas-de-ceniza.html
node --test game/tests/game.test.mjs     # 77 pruebas de simulación
python3 game/tests/e2e_browser.py        # 35 comprobaciones en navegador
node game/tools/validate_models.mjs --current   # modelos 3D
python3 studio-tests/run_capability_tests.py    # integridad del estudio de agentes
python3 tools/blender/build_maps.py <mapa>      # mapas en Blender (bpy 4.2)
```
Traspaso de arte 3D: `production/handoff/BLENDER-3D-HANDOFF.md` · Diseño de niveles: `design/levels/` · GDD: `design/gdd/`.

## Agentes (49) — `.claude/agents/<nombre>.md`

| Agente | Modelo | Cuándo usarlo |
|---|---|---|
| `accessibility-specialist` | inherit | Accessibility standards and assistive features — remapping, text scaling, colorblind modes, screen reader support. |
| `ai-programmer` | inherit | Implements game AI — behavior trees, state machines, pathfinding, perception, decision-making, NPC and enemy behavior, AI debugging. |
| `analytics-engineer` | inherit | Telemetry and analytics — event tracking, player behavior, A/B test frameworks, dashboard specification, data pipelines. |
| `art-director` | inherit | Owns visual identity — style guides, art bible, asset standards, color palettes, UI visual direction. |
| `audio-director` | inherit | Owns sonic identity — music direction, sound palette, audio implementation strategy, mix balance. |
| `community-manager` | sonnet | Player-facing communication — patch notes, social posts, community updates, feedback collection, player bug triage, crisis communication. |
| `creative-director` | opus | Highest creative authority — vision, tone, aesthetic direction. Use when a decision affects game identity or department leads deadlock. |
| `devops-engineer` | sonnet | Build pipelines, CI/CD configuration, version control workflow, branching strategy, automated test pipelines, deployment infrastructure. |
| `economy-designer` | inherit | Resource economies — loot tables, sink/faucet analysis, progression curve calibration, economic balance. |
| `engine-programmer` | inherit | Core engine systems — rendering pipeline, physics, memory, resource loading, scene management, performance-critical framework code. |
| `game-designer` | inherit | Mechanical and systems design — core loops, progression, combat, economy, player-facing rules. Mechanics-level questions. |
| `gameplay-programmer` | inherit | Implements designed mechanics as code — player systems, combat, interactive features, gameplay system code. |
| `godot-csharp-specialist` | sonnet | Godot 4 C# quality — .NET patterns, attribute-based exports, signal delegates, async patterns, type-safe node access. |
| `godot-gdextension-specialist` | sonnet | Native code integration with Godot — GDExtension API, godot-cpp and godot-rust bindings, custom node types, the native boundary. |
| `godot-gdscript-specialist` | sonnet | GDScript code quality — static typing enforcement, signal architecture, coroutine patterns, GDScript idioms, typed and performant. |
| `godot-shader-specialist` | sonnet | Godot rendering customization — shading language, visual shaders, material setup, particle shaders, post-processing. |
| `godot-specialist` | inherit | Authority on Godot-specific patterns and APIs — node/scene architecture, signals, resources; guides GDScript vs C# vs GDExtension. |
| `lead-programmer` | sonnet | Lead programmer — code-level architecture, coding standards, code review, API design, refactoring strategy, assigning work to specialist programmers. |
| `level-designer` | inherit | Spatial design for levels and areas — encounter layouts, pacing, difficulty, layout planning, environmental storytelling. |
| `live-ops-designer` | inherit | Post-launch content — seasonal events, battle passes, content cadence, retention, engagement analytics. Keeps the game fresh. |
| `localization-lead` | inherit | Internationalization architecture — i18n system design, string extraction workflows, locale testing, locale-specific issues, translation pipeline. |
| `narrative-director` | inherit | Story architecture, world-building, character design, dialogue strategy. Narrative structure and direction rather than writing individual lines. |
| `network-programmer` | inherit | Multiplayer networking — state replication, lag compensation, matchmaking, network protocol, netcode and bandwidth optimization. |
| `performance-analyst` | inherit | Performance analyst — profiling, bottlenecks, memory analysis, frame time investigation, recommends optimizations, tracks metrics over time. |
| `producer` | opus | Production concerns — sprint planning, milestone tracking, risk, scope, cross-department coordination when multiple departments must synchronize. |
| `prototyper` | sonnet | Throwaway builds — concept prototypes after brainstorm to test an idea is fun before GDDs; vertical slices pre-production. Speed over standards. |
| `qa-lead` | inherit | Test strategy and process — test plan creation, bug severity assessment, regression planning, release quality gates, readiness evaluation. |
| `qa-tester` | inherit | Writes test cases, bug reports, and checklists — test case generation, regression checklist creation, execution documentation. |
| `release-manager` | inherit | Release pipeline — certification checklists, store submissions and page prep, platform requirements, version numbering, release-day coordination. |
| `security-engineer` | inherit | Protects against cheating, exploits, breaches — anti-cheat measures, secure save data and network comms, player privacy compliance. |
| `sound-designer` | inherit | SFX specifications and spec sheets — audio event documentation, mixing parameters, sound category definitions. |
| `systems-designer` | inherit | Detailed subsystem mechanics — combat formulas, progression curves, crafting recipes, status effect interactions, mathematical modeling of a mechanic. |
| `technical-artist` | inherit | Technical artist bridging art and engineering — shaders, VFX, rendering optimization, art pipeline tools, art-to-engine issues. |
| `technical-director` | opus | High-level technical decisions — engine architecture, technology choices, performance strategy, technical risk, cross-system conflicts. |
| `tools-programmer` | inherit | Internal dev tools — editor extensions, content authoring tools, debug utilities, pipeline automation, editor workflow. |
| `ue-blueprint-specialist` | sonnet | Blueprint architecture and Blueprint/C++ boundary — optimization, maintainable graphs. Prevents Blueprint spaghetti, enforces clean BP patterns. |
| `ue-gas-specialist` | sonnet | Gameplay Ability System — abilities, gameplay effects, attribute sets, tags, ability tasks, prediction. Prevents common GAS anti-patterns. |
| `ue-replication-specialist` | sonnet | Unreal networking — property replication, RPCs, client prediction, relevancy, net serialization, bandwidth. Server-authoritative architecture. |
| `ue-umg-specialist` | sonnet | Unreal UI implementation — UMG widget hierarchy, data binding, CommonUI input routing, widget styling, UI optimization. |
| `ui-programmer` | inherit | Implements user interface systems — menus, HUDs, inventory screens, dialogue boxes, UI framework code, screen flow. |
| `unity-addressables-specialist` | sonnet | Unity asset management — Addressable groups, loading/unloading, content catalogs, remote delivery, asset bundle optimization, fast load times. |
| `unity-dots-specialist` | sonnet | Unity Data-Oriented Technology Stack — Entity Component System, Jobs, Burst compiler optimization, hybrid renderer, correct ECS patterns. |
| `unity-shader-specialist` | sonnet | Unity rendering — Shader Graph, custom HLSL, VFX Graph, render pipeline customization (URP/HDRP), post-processing within performance budgets. |
| `unity-specialist` | inherit | Authority on Unity-specific patterns and APIs — guides MonoBehaviour vs DOTS/ECS, Unity subsystems including Addressables and Input System. |
| `unity-ui-specialist` | sonnet | Unity UI implementation — UI Toolkit (UXML/USS), UGUI Canvas, data binding, runtime UI performance, cross-platform adaptation. |
| `unreal-specialist` | inherit | Authority on Unreal-specific patterns and APIs — guides Blueprint vs C++, UE subsystems (GAS, Enhanced Input, Niagara, etc.). |
| `ux-designer` | inherit | User experience flows, interaction design, information architecture — user flow mapping, interaction pattern design, onboarding, accessibility requirements. |
| `world-builder` | inherit | World builder for lore — factions, cultures, history, geography, ecology, world rules. Faction design, lore consistency checks. |
| `writer` | inherit | Writer of player-facing text — dialogue, lore entries, item and ability descriptions, environmental text. |

## Skills (74) — `.claude/skills/<nombre>/SKILL.md`, se invocan como `/nombre`

| Skill | Para qué |
|---|---|
| `/adopt` | Brownfield audit — do existing artifacts actually work? Numbered migration plan. Unlike /project-stage-detect, checks compliance not existence. |
| `/architecture-decision` | Create an ADR documenting a technical decision: context, alternatives considered, consequences. |
| `/architecture-review` | Traceability matrix mapping GDD requirements to ADRs. Finds gaps, cross-ADR conflicts, engine compatibility. PASS/CONCERNS/NOT ASSESSED/FAIL. |
| `/art-bible` | Author the Art Bible — visual identity gating asset production. Run before /map-systems. |
| `/asset-audit` | Audit assets against naming conventions, file size budgets, format standards. Finds orphaned assets, missing references. |
| `/asset-spec` | Per-asset visual specs plus AI generation prompts from GDDs and character profiles. After the art bible. |
| `/balance-check` | Find balance outliers, broken progressions, degenerate strategies, economy imbalances in formulas and data. 'Check game balance'. |
| `/brainstorm` | Guides the user through finding and choosing a game concept. Use when the user wants game ideas, a new concept, a game jam idea, or to explore other directions, including dropping the current idea and starting over. |
| `/bug-report` | Structured bug report from a description, or analyze code for potential bugs. Reproduction steps, severity. |
| `/bug-triage` | Re-evaluate open bugs — priority vs severity, assign to sprints, surface systemic trends. Run when the count grows. |
| `/changelog` | Auto-generate a changelog from git commits and sprint data. Internal and player-facing versions. |
| `/code-review` | Architectural code review — coding standards, SOLID, testability, performance concerns. |
| `/consistency-check` | Scan GDDs against the entity registry for cross-document conflicts. Grep-first approach targets conflicting sections, different stats. |
| `/content-audit` | Audit GDD content counts against what's implemented — planned vs built. |
| `/create-architecture` | Author the architecture blueprint before code is written. Validates decisions against the pinned engine, flags knowledge gaps. |
| `/create-control-manifest` | Builds a short list of must-do and never-do coding rules per system from accepted ADRs. Use when the user wants programmer rules or a cheat sheet from the ADRs, or needs it regenerated after ADR changes. |
| `/create-epics` | Turns the GDDs and architecture into epics, one per architectural module. Use when the user wants to break the game into epics or plan the work before writing stories. Not for splitting one epic into stories. |
| `/create-stories` | Breaks one epic into implementable stories with acceptance criteria. Use when the user wants stories for an epic or the next batch of work to build. Not for turning the whole design into epics. |
| `/day-one-patch` | Day-one launch patch — focused fix for known issues found after gold master. Mini-sprint with QA gate and rollback. |
| `/design-review` | Reviews one design document for completeness, internal consistency, implementability, and design standards. Before handing to programmers. |
| `/design-system` | Section-by-section GDD authoring for one system — walks through each required section, cross-references dependencies. |
| `/dev-story` | Implements one story in code with tests, following its ADRs. Use when the user says to build, implement or start working on a story. Not for checking readiness beforehand or closing the story after. |
| `/estimate` | Estimate task effort from complexity, dependencies, velocity, risk. Structured estimate with confidence levels. |
| `/gate-check` | Ready to advance between development phases? PASS/CONCERNS/NOT ASSESSED/FAIL with blockers and required artifacts. 'Can we move to production?' |
| `/help` | What should I do next? Use when stuck or you don't know what to do. |
| `/hotfix` | Emergency fix bypassing normal sprint process — hotfix branch, approvals tracked, backport verified, full audit trail. |
| `/launch-checklist` | Launch readiness across every department: code, content, store, marketing, community, infrastructure, legal, go/no-go sign-offs. |
| `/localize` | Localization pipeline — find hardcoded strings, extract string tables, cultural review, VO, RTL, enforce string freeze. |
| `/map-systems` | Decompose a concept into individual systems, map dependencies, prioritize design order, create the systems index. |
| `/milestone-review` | Milestone progress review — completeness, quality metrics, risk, go/no-go recommendation. At checkpoints or before a deadline. |
| `/onboard` | Onboarding doc for a new contributor or agent — project state, conventions, priorities relevant to the specified role. |
| `/patch-notes` | Player-facing patch notes from git history and changelogs. Translates developer language into player communication. |
| `/perf-profile` | Performance profiling — find bottlenecks, measure against budgets, produce ranked optimization recommendations. |
| `/playtest-report` | Structured playtest report template, or turn existing playtest notes into structured feedback. |
| `/project-stage-detect` | Analyze project state, detect stage, identify gaps, recommend next steps. 'Where are we in development?' |
| `/propagate-design-change` | Finds architecture decisions (ADRs) made stale by a changed GDD and walks through resolving each. Use when the user changed a number or rule in a GDD and asks which ADRs or architecture decisions are now out of date. |
| `/prototype` | Concept prototype before GDDs — throwaway HTML, Engine or Paper build, PROCEED/PIVOT/KILL/NOT ASSESSED. After /brainstorm and /setup-engine. |
| `/qa-plan` | QA test plan for a sprint — classifies stories by Logic/Integration/Visual/UI, covers automated tests, manual cases, smoke scope. |
| `/quick-design` | Lightweight spec for small changes — tuning adjustments, minor mechanics. Embeds directly into stories; skips full GDD. |
| `/regression-suite` | Map test coverage to GDD critical paths, find fixed bugs lacking regression tests, flag drift from new features. |
| `/release-checklist` | Pre-release checklist — build verification, certification requirements, store metadata, launch readiness. |
| `/retrospective` | Sprint or milestone retrospective from completed work, velocity, blockers. Actionable insights for the next iteration. |
| `/reverse-document` | Generate missing design or architecture docs from existing implementation — works backwards from code and prototypes. |
| `/review-all-gdds` | Holistic cross-GDD review — contradictions between systems, dominant strategies, economic imbalance, cognitive overload, pillar drift. |
| `/scope-check` | Scope creep check — current scope versus the original plan. Flags additions, quantifies bloat, recommends cuts. 'Any scope creep?' |
| `/security-audit` | Security audit — save tampering, cheat vectors, network exploits, data exposure, input validation. Before public or multiplayer release. |
| `/settings` | View or change project config — effective merged values, or set locally in project.local.yaml. |
| `/setup-engine` | Configure engine and version. Pins it in CLAUDE.md; WebSearch fills reference docs when the version is beyond LLM training data. |
| `/skill-improve` | Improve a skill via a test-fix-retest loop — static checks, targeted fixes, keep or revert on score change. |
| `/skill-test` | Validate skill files for structural compliance and behavioral correctness. Four modes: static linter, spec, category rubric, audit. |
| `/smoke-check` | Critical-path smoke gate before QA hand-off — runs the automated suite. A failed check means the build is not QA-ready. |
| `/soak-test` | Soak test protocol for extended play — what to observe and log for slow leaks, fatigue, late-appearing edge cases. |
| `/sprint-plan` | New or updated sprint plan from the current milestone, completed work, and available capacity. |
| `/sprint-status` | Fast, concise sprint snapshot — burndown and emerging risks for situational awareness. 'How is the sprint going?' |
| `/start` | Guides a first-time user through onboarding and picks the right workflow. Use when the user is new, just cloned or installed the studio, has no idea or engine yet, asks where to begin, or wants to bring in an existing game. |
| `/story-done` | Closes a finished story: verifies each acceptance criterion, checks for design or ADR deviations and updates its status. Use when the user says a story is done, finished or ready to close. |
| `/story-readiness` | Checks whether a story is ready to implement: clear acceptance criteria, no open questions, valid ADR and dependencies. Use when the user asks if a story, or the sprint's stories, are ready to start or build. |
| `/team-audio` | Orchestrate the audio team — audio-director, sound-designer, technical-artist, gameplay-programmer — direction through implementation. |
| `/team-combat` | Orchestrate the combat team — game-designer, gameplay-programmer, ai-programmer, technical-artist, sound-designer, qa-tester — design through implement and validate. |
| `/team-level` | Orchestrate the level team — level-designer, narrative-director, world-builder, art-director, systems-designer, qa-tester — for complete area creation. |
| `/team-live-ops` | Orchestrate the live-ops team — live-ops-designer, economy-designer, analytics-engineer, community-manager, writer — for a season or live event. |
| `/team-narrative` | Orchestrate the narrative team — narrative-director, writer, world-builder, level-designer — for story, world lore, narrative-driven levels. |
| `/team-polish` | Orchestrate the polish team — performance-analyst, technical-artist, sound-designer, qa-tester — to optimize and harden a feature or area. |
| `/team-qa` | Orchestrate the QA team through a full testing cycle — qa-lead strategy and test plan, qa-tester case writing, execution, sign-off. |
| `/team-release` | Orchestrate the release team — release-manager, qa-lead, devops-engineer, producer — to execute a release from candidate to deployment. |
| `/team-ui` | Orchestrate the UI team through the UX pipeline — authoring, visual design, implementation, review, polish. Uses /ux-design, /ux-review, studio templates. |
| `/tech-debt` | Track, categorize and prioritize technical debt across the codebase — scans for debt indicators, maintains a register. |
| `/test-evidence-review` | Quality review of test files and evidence — goes beyond existence, evaluates assertion coverage. ADEQUATE/INCOMPLETE/MISSING/NOT ASSESSED per story. |
| `/test-flakiness` | Find flaky tests from CI logs — aggregates pass rates, spots intermittent failures, recommends quarantine. After multiple runs. |
| `/test-helpers` | Generate engine-specific test helper libraries — assertion utilities, factory functions, mocks in the engine's test folder. Reduces boilerplate. |
| `/test-setup` | Scaffold the test framework and CI — tests/ directory, engine test runner, GitHub Actions workflow. Once, before the first sprint. |
| `/ux-design` | Section-by-section UX spec authoring for a screen, flow or HUD. Reads the player journey to provide context; also project-wide accessibility. |
| `/ux-review` | Validate a UX spec, HUD design or pattern library — accessibility, GDD alignment, readiness. APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED. |
| `/vertical-slice` | Pre-production validation — end-to-end build to confirm the full loop is achievable before committing to Production. After GDDs, architecture, UX specs. |
