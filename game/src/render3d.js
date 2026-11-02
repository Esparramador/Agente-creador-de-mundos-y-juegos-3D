// Render 3D con three.js: terreno, estructuras, campeones animados (modelos glTF reales), súbditos,
// monstruos, efectos y niebla de guerra. La simulación (world.js) no cambia: aquí solo se dibuja.
// Coordenadas: 1 unidad de mundo three.js = 100 unidades de juego; el eje Y del juego es Z en three.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MODEL_MAP, UNIT_MODELS, MODEL_FILES, MAP_FILES } from './models.js';

const S = 0.01; // juego -> mundo
const TEAM = [0x42a5f5, 0xef5350, 0xbcaaa4], TEAM_CB = [0x42a5f5, 0xff9800, 0xbcaaa4];

export class World3D {
  constructor(canvas, game, settings) {
    this.g = game; this.s = settings; this.canvas = canvas;
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.outputColorSpace = THREE.SRGBColorSpace; this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x0b0f13);
    this.cam = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
    this.objs = new Map(); this.templates = {}; this.anims = {}; this.pool = { zone: [], proj: [], fx: [] }; this.used = { zone: 0, proj: 0, fx: 0 };
    this.ray = new THREE.Raycaster(); this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); this.tmpV = new THREE.Vector3();
    this.t = 0;
  }
  teamCol(t) { return (this.s.colorblind ? TEAM_CB : TEAM)[t] ?? 0xffffff; }

  // ---------- carga de modelos ----------
  async load(onProgress) {
    const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
    const mapFile = MAP_FILES[this.g.map.id]; const names = [...MODEL_FILES, ...(mapFile ? [mapFile] : [])]; let n = 0;
    await Promise.all(names.map(async name => {
      let buf;
      const emb = (typeof window !== 'undefined' && window.__MODELS) ? window.__MODELS[name] : null;
      if (emb) { const bin = atob(emb); buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); buf = buf.buffer; }
      else buf = await (await fetch(`assets/models/${name}.glb`)).arrayBuffer();
      const gltf = await new Promise((res, rej) => L.parse(buf, '', res, rej));
      const isMap = name.startsWith('map_');
      gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = !isMap || !/terreno/.test(o.name); o.receiveShadow = isMap; o.frustumCulled = isMap; } });
      this.templates[name] = gltf.scene; this.anims[name] = gltf.animations;
      onProgress && onProgress(++n, names.length, name);
    }));
    this.buildWorld();
  }

  // ---------- escenario ----------
  buildWorld() {
    const g = this.g, m = g.map, W = m.W * S, H = m.H * S;
    this.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a2e22, 1.35));
    const sun = this.sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120;
    sun.shadow.bias = -0.0005; this.scene.add(sun, sun.target);
    const mapModel = this.templates[MAP_FILES[m.id]];
    if (mapModel) {
      this.scene.add(mapModel);   // terreno, caminos, río, acantilados, rocas y matorrales modelados en Blender
      this.brushCount = g.brushes.length; this.rocks = new Map(); for (const o of g.obstacles) this.rocks.set(o, null);
      this.rockMat = new THREE.MeshStandardMaterial({ color: 0x6d675f, roughness: 1, flatShading: true });
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(W * 4, H * 4), new THREE.MeshBasicMaterial({ color: 0x07090b })); rim.rotation.x = -Math.PI / 2; rim.position.set(W / 2, m.bounds ? -9.5 : -0.3, H / 2); this.scene.add(rim);
    } else this.paintedGround(W, H);
    this.commonWorld(W, H);
  }
  paintedGround(W, H) {
    const g = this.g, m = g.map;
    // terreno pintado (respaldo si falta el .glb del mapa)
    const tc = document.createElement('canvas'); const res = 2048; tc.width = res; tc.height = Math.round(res * m.H / m.W);
    const x = tc.getContext('2d'); const k = tc.width / m.W; x.scale(k, k);
    x.fillStyle = m.bg; x.fillRect(0, 0, m.W, m.H);
    for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.025})`; const r = 20 + Math.random() * 120; x.beginPath(); x.arc(Math.random() * m.W, Math.random() * m.H, r, 0, 7); x.fill(); }
    if (m.river) { x.strokeStyle = m.riverCol; x.lineWidth = m.riverW; x.lineCap = 'round'; x.beginPath(); x.moveTo(...m.river[0]); x.lineTo(...m.river[1]); x.stroke();
      x.strokeStyle = 'rgba(120,180,255,0.15)'; x.lineWidth = m.riverW * 0.5; x.stroke(); }
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [w, col] of [[700, 'rgba(0,0,0,0.35)'], [620, m.laneCol], [380, 'rgba(255,255,255,0.05)']]) { x.strokeStyle = col; x.lineWidth = w;
      for (const lane of Object.values(m.lanes[0])) { x.beginPath(); x.moveTo(...lane[0]); for (const p of lane.slice(1)) x.lineTo(...p); x.stroke(); } }
    m.fountain.forEach(([fx, fy], t) => { x.fillStyle = t ? 'rgba(239,83,80,0.18)' : 'rgba(66,165,245,0.18)'; x.beginPath(); x.arc(fx, fy, 1300, 0, 7); x.fill(); x.fillStyle = '#5f5a52'; x.beginPath(); x.arc(fx, fy, 520, 0, 7); x.fill(); });
    for (const cp of g.camps) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(cp.x, cp.y, 300, 0, 7); x.fill(); }
    if (m.bounds) { x.fillStyle = '#05080a'; x.fillRect(0, 0, m.W, m.bounds.y0 - 80); x.fillRect(0, m.bounds.y1 + 80, m.W, m.H); }
    const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true; this.scene.add(ground);
    // borde exterior
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(W * 3, H * 3), new THREE.MeshBasicMaterial({ color: 0x07090b })); rim.rotation.x = -Math.PI / 2; rim.position.set(W / 2, -0.02, H / 2); this.scene.add(rim);
    if (m.bounds) for (const zz of [m.bounds.y0 - 70, m.bounds.y1 + 70]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(W, 0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x8a9aa4 })); rail.position.set(W / 2, 0.3, zz * S); rail.castShadow = true; this.scene.add(rail); }
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x6d675f, roughness: 1, flatShading: true }); this.rocks = new Map();
    for (const b of g.brushes) this.addBrush(b);
    this.brushCount = g.brushes.length;
    // árboles decorativos fuera de carriles (bordes del mapa)
    const rnd = mulberry(7);
    for (let i = 0; i < (m.bounds ? 0 : 70); i++) {
      const px = rnd() * m.W, py = rnd() * m.H; if (this.nearLane(px, py, 900) || g.obstacles.some(o => Math.hypot(o.x - px, o.y - py) < o.r + 200) || m.fountain.some(([a, b]) => Math.hypot(a - px, b - py) < 1800)) continue;
      const t = this.instance(rnd() < 0.6 ? 'tree' : 'cypress', 2.2 + rnd() * 1.6); t.position.set(px * S, 0, py * S); t.rotation.y = rnd() * 6; this.scene.add(t);
    }
  }
  commonWorld(W, H) {
    const g = this.g, m = g.map;
    // fuentes (modelo de Blender con el color del equipo)
    m.fountain.forEach(([fx, fy], t) => { const f = this.instance('struct_fountain', 2.9, null, t); f.position.set(fx * S, 0, fy * S); this.scene.add(f);
      const l = new THREE.PointLight(this.teamCol(t), 30, 12); l.position.set(fx * S, 2, fy * S); this.scene.add(l); });
    // altares
    for (const a of g.altars) { const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 8, 48), new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0x222222 })); ring.rotation.x = Math.PI / 2; ring.position.set(a.x * S, 0.05, a.y * S); this.scene.add(ring); a.mesh = ring;
      const ob = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 })); ob.position.set(a.x * S, 1.8, a.y * S); this.scene.add(ob); a.orb = ob; }
    this.relicMeshes = g.relics.map(r => { const mm = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({ color: 0x69f0ae, emissive: 0x2e7d32 })); mm.position.set(r.x * S, 0.6, r.y * S); this.scene.add(mm); return mm; });
    // niebla de guerra
    const fc = this.fogCanvas = document.createElement('canvas'); fc.width = 256; fc.height = Math.max(64, Math.round(256 * m.H / m.W));
    this.fogTex = new THREE.CanvasTexture(fc);
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: this.fogTex, transparent: true, depthWrite: false }));
    fog.rotation.x = -Math.PI / 2; fog.position.set(W / 2, 0.06, H / 2); fog.renderOrder = 2; this.scene.add(fog); this.fogT = 0;
    // materiales compartidos de efectos
    this.circleGeo = new THREE.CircleGeometry(1, 40); this.ringGeo = new THREE.RingGeometry(0.93, 1, 48); this.sphereGeo = new THREE.SphereGeometry(1, 10, 8);
  }
  nearLane(px, py, d) { for (const lane of Object.values(this.g.map.lanes[0])) for (let i = 0; i < lane.length - 1; i++) { const [ax, ay] = lane[i], [bx, by] = lane[i + 1]; const vx = bx - ax, vy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy))); if (Math.hypot(px - ax - t * vx, py - ay - t * vy) < d) return true; } return false; }
  addBrush(b) {
    const grp = new THREE.Group(); const n = Math.max(4, Math.round(b.r / 45)); const rnd = mulberry(Math.round(b.x + b.y));
    for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * b.r * 0.85; const o = this.instance('kk_bush', 1.0 + rnd() * 0.7); o.position.set((b.x + Math.cos(a) * d) * S, 0, (b.y + Math.sin(a) * d) * S); o.rotation.y = rnd() * 6; grp.add(o); }
    this.scene.add(grp);
  }
  instance(name, height, tint, team) {
    const tpl = this.templates[name]; if (!tpl) return new THREE.Group();
    const o = (this.anims[name] && this.anims[name].length) ? cloneSkinned(tpl) : tpl.clone();
    if (!tpl.userData.h) { const b = new THREE.Box3().setFromObject(tpl); tpl.userData.h = b.max.y - b.min.y; tpl.userData.minY = b.min.y; }
    const k = height / tpl.userData.h; const wrap = new THREE.Group(); o.scale.multiplyScalar(k); o.position.y = -tpl.userData.minY * k; wrap.add(o);
    if (tint != null) o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(tint), 0.45); } });
    if (team != null) o.traverse(m => { if (m.isMesh && m.material && m.material.name === 'Team') { const c = this.teamCol(team); m.material = m.material.clone(); m.material.color.setHex(c); m.material.emissive.setHex(c); m.material.emissiveIntensity = 0.9; m.userData.team = true; } });
    wrap.userData.inner = o; return wrap;
  }

  // ---------- unidades ----------
  makeUnitObj(u) {
    const spec = UNIT_MODELS(u);
    const grp = new THREE.Group(); let model = null, mixer = null, actions = {};
    if (spec.model) {
      model = this.instance(spec.model, spec.h, spec.tint, spec.team); if (u.kind !== 'champ' && !u.epicType) model.traverse(o => { if (o.isMesh) o.castShadow = false; }); if (spec.sx) model.scale.x = model.scale.z = spec.sx; grp.add(model);
      const clips = this.anims[spec.model] || [];
      if (clips.length) { mixer = new THREE.AnimationMixer(model.userData.inner); for (const c of clips) actions[c.name] = mixer.clipAction(c); }
    }
    if (spec.structure) this.decorateStructure(grp, u);
    else if (!spec.model) grp.add(this.structureMesh(u));
    // anillo de equipo
    if (!u.structure) { const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: u.isPlayer ? 0x66ff66 : this.teamCol(u.team), transparent: true, opacity: u.kind === 'champ' ? 0.9 : 0.5, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.scale.setScalar(u.r * S * 1.25); grp.add(ring); grp.userData.ring = ring; }
    if (u.kind === 'champ') { const l = new THREE.PointLight(this.teamCol(u.team), u.isPlayer ? 6 : 3, 4); l.position.y = 1.5; grp.add(l); }
    grp.userData = { ...grp.userData, spec, mixer, actions, cur: null, model, u };
    this.scene.add(grp); this.objs.set(u.id, grp); return grp;
  }
  decorateStructure(grp, u) {
    const col = this.teamCol(u.team);
    const light = new THREE.PointLight(col, u.kind === 'nexus' ? 25 : 8, u.kind === 'nexus' ? 12 : 7); light.position.y = u.kind === 'tower' ? 5 : 3; grp.add(light);
    if (u.kind === 'nexus') for (const side of [-1, 1]) {   // tus bustos guerreros custodian el Nexo
      const bust = this.instance(u.team === 0 ? 'guerrero' : 'guerrero_2', 1.6, u.team === 0 ? 0x90caf9 : null);
      const ang = Math.atan2(this.g.map.W / 2 - u.x, this.g.map.H / 2 - u.y);
      bust.position.set(Math.sin(ang + side * 0.6) * 2.8, 0, Math.cos(ang + side * 0.6) * 2.8); bust.rotation.y = ang; grp.add(bust);
    }
    grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  structureMesh(u) {
    const grp = new THREE.Group(), col = this.teamCol(u.team);
    const stone = new THREE.MeshStandardMaterial({ color: 0x8d8a85, roughness: 0.9 }), crystal = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.3 });
    if (u.kind === 'tower') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 0.6, 8), stone); base.position.y = 0.3;
      const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 3.2, 8), stone); col1.position.y = 2.2;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.6, 0.5, 8), stone); top.position.y = 4;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), crystal); gem.position.y = 4.9; grp.userData.gem = gem;
      grp.add(base, col1, top, gem);
      const bust = this.instance(u.team === 0 ? 'guerrero' : 'guerrero_2', 1.0, u.team === 0 ? 0x90caf9 : null); bust.position.set(0, 4.25, 0); bust.rotation.y = u.team === 0 ? -Math.PI * 0.75 : Math.PI * 0.25; grp.add(bust);
      const light = new THREE.PointLight(col, 8, 7); light.position.y = 5; grp.add(light);
    } else if (u.kind === 'inhib') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.18, 8, 24), stone); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), crystal); gem.position.y = 1.6; grp.userData.gem = gem; grp.add(ring, gem);
    } else {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.3, 0.8, 6), stone); base.position.y = 0.4;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5), crystal); gem.position.y = 2.6; gem.scale.y = 1.5; grp.userData.gem = gem;
      const light = new THREE.PointLight(col, 25, 12); light.position.y = 3; grp.add(base, gem, light);
    }
    grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return grp;
  }
  play(obj, name, once) {
    const d = obj.userData; if (!d.mixer) return false; const a = d.actions[name]; if (!a) return false;
    if (d.cur === a) return true;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!once; a.play();
    if (d.cur) d.cur.crossFadeTo(a, 0.15, false);
    d.cur = a; return true;
  }
  animate(obj, u, dt) {
    const d = obj.userData, A = d.spec.anims || {};
    const moving = u.alive && (Math.hypot((u.x - (d.px ?? u.x)), (u.y - (d.py ?? u.y))) > 1.5);
    const g = this.g;
    let st = 'idle';
    if (!u.alive) st = 'death';
    else if (u.lastCast && g.t - u.lastCast < 0.45) st = 'cast';
    else if (u.windup || (u.lastAtk && g.t - u.lastAtk < 0.3)) st = 'attack';
    else if (moving) st = 'run';
    if (d.state !== st) { d.state = st; this.play(obj, A[st] || A.idle, st === 'death' || st === 'attack' || st === 'cast'); }
    if (d.mixer) d.mixer.update(dt * (st === 'attack' ? Math.max(1, u.st.as * 1.4) : 1));
    else if (d.model) { // animación por código para modelos sin esqueleto
      const m = d.model; m.position.y = st === 'run' ? Math.abs(Math.sin(this.t * 10)) * 0.12 : Math.sin(this.t * 2) * 0.03;
      m.rotation.x = st === 'attack' ? -0.25 : st === 'death' ? -1.4 : 0;
    }
    // orientación
    const tx = u.target && u.target.alive ? u.target.x : u.x + (u.x - (d.px ?? u.x)) * 10, ty = u.target && u.target.alive ? u.target.y : u.y + (u.y - (d.py ?? u.y)) * 10;
    if (u.alive && (Math.abs(tx - u.x) + Math.abs(ty - u.y) > 2)) { const want = Math.atan2(tx - u.x, ty - u.y) + (d.spec.yaw || 0); obj.rotation.y = lerpAngle(obj.rotation.y, want, Math.min(1, dt * 12)); }
    d.px = u.x; d.py = u.y;
  }

  // ---------- fotograma ----------
  render(dt, camState, team, hover) {
    const g = this.g; this.t += dt;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (this.canvas.width !== Math.floor(w * this.r.getPixelRatio()) || this.lastH !== h) { this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.lastH = h; }
    const cx = camState.x * S, cz = camState.y * S, dist = 26 / camState.zoom;
    this.cam.position.set(cx, dist * 0.84, cz + dist * 0.55); this.cam.lookAt(cx, 0, cz);
    this.sun.position.set(cx + 18, 40, cz + 10); this.sun.target.position.set(cx, 0, cz);
    // matorrales/rocas nuevos (cambios de terreno por dragones)
    while (this.brushCount < g.brushes.length) this.addBrush(g.brushes[this.brushCount++]);
    for (const o of g.obstacles) if (!this.rocks.has(o)) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(o.r * S, 0), this.rockMat); m.scale.y = 0.75; m.position.set(o.x * S, o.r * S * 0.45, o.y * S); m.rotation.y = o.x; m.castShadow = m.receiveShadow = true; this.scene.add(m); this.rocks.set(o, m); }
    for (const [o, m] of this.rocks) if (!g.obstacles.includes(o)) { this.scene.remove(m); this.rocks.delete(o); }
    // unidades
    const seen = new Set();
    for (const u of g.units) {
      const vis = u.structure || u.team === team || g.isVisibleTo(team, u);
      if (!vis || (!u.alive && !u.structure && u.kind !== 'champ' && !u.epicType && u.kind !== 'monster')) continue;
      if (!u.alive && u.kind === 'champ' && g.t - (u.respawnAt - 1e3) < 0) continue;
      // recorte por cámara: fuera de la vista no se crea, anima ni dibuja
      const offX = Math.abs(u.x * S - cx), offZ = u.y * S - cz;
      if (offX > 26 / camState.zoom + 4 || offZ > 16 / camState.zoom || offZ < -30 / camState.zoom - 6) { const o = this.objs.get(u.id); if (o) { o.visible = false; seen.add(u.id); o.userData.px = u.x; o.userData.py = u.y; } continue; }
      let obj = this.objs.get(u.id) || this.makeUnitObj(u); seen.add(u.id);
      obj.visible = true;
      let y = 0; const air = u.cc.find(c => c.kind === 'airborne'); if (air) y = Math.min(1, air.t) * 1.2;
      obj.position.set(u.x * S, y, u.y * S);
      if (u.structure) { const mdl = obj.userData.model || obj.children[0]; if (mdl) mdl.scale.y = u.alive ? 1 : 0.22;
        obj.traverse(o => { if (o.isMesh && o.userData.team) o.visible = u.alive; }); if (obj.userData.ring) obj.userData.ring.visible = false; continue; }
      // forma dragón de Aurik
      if (u.cid === 'aurik') { const dragon = u.buffs.some(b => b.key === 'dragon'); if (dragon !== obj.userData.dragon) { obj.userData.dragon = dragon; this.swapModel(obj, u, dragon ? { model: 'mini_dragon_blue', h: 3.2, anims: {} } : UNIT_MODELS(u)); } }
      const stealth = u.buffs.some(b => b.stealth); this.setOpacity(obj, stealth ? 0.35 : 1);
      if (obj.userData.ring) obj.userData.ring.material.color.setHex(u === hover ? 0xffffff : u.isPlayer ? 0x66ff66 : this.teamCol(u.team));
      this.animate(obj, u, dt);
      if (!u.alive && obj.userData.deadAt == null) obj.userData.deadAt = this.t;
      if (u.alive) obj.userData.deadAt = null;
      if (!u.alive && u.kind !== 'champ' && this.t - obj.userData.deadAt > 1.6) obj.visible = false;
      if (!u.alive && u.kind === 'champ' && this.t - obj.userData.deadAt > 3) obj.visible = false;
    }
    for (const [id, obj] of this.objs) if (!seen.has(id)) { if (!g.units.some(u => u.id === id)) { this.scene.remove(obj); this.objs.delete(id); } else obj.visible = false; }
    // altares y reliquias
    for (const a of g.altars) { const c = a.owner == null ? 0xdddddd : this.teamCol(a.owner); a.mesh.material.color.setHex(c); a.orb.material.color.setHex(c); a.orb.material.emissive.setHex(c); a.orb.rotation.y += dt; a.orb.position.y = 1.8 + Math.sin(this.t * 2) * 0.2; }
    g.relics.forEach((r, i) => { this.relicMeshes[i].visible = r.up; this.relicMeshes[i].rotation.y += dt * 2; });
    // zonas, proyectiles y efectos
    for (const k in this.used) this.used[k] = 0;
    for (const z of g.zones) this.drawZone(z, team);
    for (const p of g.projectiles) { const m = this.get('proj', () => new THREE.Mesh(this.sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff })));
      m.material.color.set(p.color || '#fff'); m.scale.setScalar(Math.max(0.12, (p.w || 30) * S * 0.5)); m.position.set(p.x * S, 1.1, p.y * S); }
    for (const f of g.fx) this.drawFx(f, team);
    for (const k in this.pool) for (let i = this.used[k]; i < this.pool[k].length; i++) this.pool[k][i].visible = false;
    // niebla
    this.fogT -= dt; if (this.fogT <= 0) { this.fogT = 0.1; this.updateFog(team); }
    this.r.render(this.scene, this.cam);
  }
  swapModel(obj, u, spec) {
    const d = obj.userData; if (d.model) obj.remove(d.model);
    d.model = this.instance(spec.model, spec.h, spec.tint); obj.add(d.model); d.spec = { ...d.spec, ...spec, anims: spec.anims };
    const clips = this.anims[spec.model] || []; d.mixer = clips.length ? new THREE.AnimationMixer(d.model.userData.inner) : null; d.actions = {}; d.cur = null; d.state = null;
    if (d.mixer) for (const c of clips) d.actions[c.name] = d.mixer.clipAction(c);
  }
  setOpacity(obj, a) { if (obj.userData.alpha === a) return; obj.userData.alpha = a; obj.traverse(m => { if (m.isMesh && m.material) { if (!m.userData.ownMat) { m.material = m.material.clone(); m.userData.ownMat = true; } m.material.transparent = a < 1; m.material.opacity = a; } }); }
  get(kind, make) { const p = this.pool[kind]; let m = p[this.used[kind]]; if (!m) { m = make(); m.renderOrder = 3; this.scene.add(m); p.push(m); } this.used[kind]++; m.visible = true; return m; }
  flat(kind) { return this.get(kind, () => { const m = new THREE.Mesh(this.circleGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; return m; }); }
  drawZone(z, team) {
    const col = new THREE.Color(z.col || (z.team === team ? '#42a5f5' : '#ef5350'));
    if (z.kind === 'wall') { const [ax, ay, bx, by] = z.seg; const m = this.get('fx', () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true })));
      m.material.color.copy(col); m.material.opacity = 0.85; m.scale.set(Math.hypot(bx - ax, by - ay) * S, 1.2, 0.5); m.position.set((ax + bx) / 2 * S, 0.6, (ay + by) / 2 * S); m.rotation.set(0, -Math.atan2(by - ay, bx - ax), 0); return; }
    const m = this.flat('zone'); m.material.color.copy(col); m.geometry = (z.kind === 'crypt') ? this.ringGeo : this.circleGeo;
    m.material.opacity = z.kind === 'crypt' ? 0.9 : z.delay && !z.triggered ? 0.25 + 0.4 * Math.min(1, z.age / z.delay) : 0.3;
    m.scale.setScalar(z.r * S); m.position.set(z.x * S, 0.08, z.y * S);
    if (z.kind === 'crypt') { const wall = this.get('fx', () => new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })));
      wall.material.color.copy(col); wall.material.opacity = 0.35; wall.scale.set(z.r * S, 2, z.r * S); wall.position.set(z.x * S, 1, z.y * S); wall.rotation.set(0, 0, 0); }
  }
  drawFx(f, team) {
    const a = 1 - f.age / f.t, col = new THREE.Color(f.col || (f.team === team ? '#64b5f6' : '#ff5252'));
    if (f.kind === 'circle' || f.kind === 'cone') { const m = this.flat('zone'); m.geometry = this.circleGeo; m.material.color.copy(col); m.material.opacity = a * 0.6; m.scale.setScalar((f.r || 100) * S * (0.7 + 0.3 * (1 - a))); m.position.set(f.x * S, 0.1, f.y * S); return; }
    if (f.kind === 'line') { const m = this.get('fx', () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true })));
      const L = Math.hypot(f.x2 - f.x, f.y2 - f.y); m.material.color.copy(col); m.material.opacity = a * 0.7; m.scale.set(L * S, 0.15, f.w * S);
      m.position.set((f.x + f.x2) / 2 * S, 0.5, (f.y + f.y2) / 2 * S); m.rotation.set(0, -Math.atan2(f.y2 - f.y, f.x2 - f.x), 0); }
  }
  updateFog(team) {
    const g = this.g, c = this.fogCanvas, x = c.getContext('2d'), k = c.width / g.map.W;
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height); x.fillStyle = 'rgba(0,0,12,0.6)'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-out';
    const p = g.player, near = p && p.cc.some(cc => cc.kind === 'nearsight');
    for (const u of g.units) {
      if (!u.alive || u.team !== team) continue;
      let r = u.kind === 'champ' ? 1350 : u.kind === 'minion' ? 1100 : u.kind === 'ward' ? 900 : u.kind === 'pet' ? 600 : u.structure ? 1350 : 0;
      if (near) r = u === p ? 300 : 0; if (!r) continue;
      const gr = x.createRadialGradient(u.x * k, u.y * k, r * k * 0.75, u.x * k, u.y * k, r * k); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(u.x * k, u.y * k, r * k, 0, 7); x.fill();
    }
    this.fogTex.needsUpdate = true;
  }
  // proyección pantalla <-> mundo (en unidades de juego)
  project(gx, gy, hWorld = 0) { this.tmpV.set(gx * S, hWorld, gy * S).project(this.cam); return [(this.tmpV.x + 1) / 2 * this.canvas.clientWidth, (1 - this.tmpV.y) / 2 * this.canvas.clientHeight, this.tmpV.z < 1]; }
  unproject(sx, sy) {
    const nd = new THREE.Vector2(sx / this.canvas.clientWidth * 2 - 1, -(sy / this.canvas.clientHeight) * 2 + 1);
    this.ray.setFromCamera(nd, this.cam); const p = new THREE.Vector3(); if (!this.ray.ray.intersectPlane(this.plane, p)) return [this.g.player?.x || 0, this.g.player?.y || 0];
    return [p.x / S, p.z / S];
  }
  headHeight(u) { const o = this.objs.get(u.id); return u.structure ? (u.kind === 'tower' ? 5.8 : u.kind === 'nexus' ? 5 : 3) : (o?.userData.spec?.h || 1.5) + 0.35; }
}
function lerpAngle(a, b, t) { let d = ((b - a + Math.PI) % (2 * Math.PI)) - Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return a + d * t; }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
