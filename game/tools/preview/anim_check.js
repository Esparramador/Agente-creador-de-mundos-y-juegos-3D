// Comprueba en navegador que un .glb final carga con three.js y que sus 5 clips se reproducen y mueven huesos.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const name = new URLSearchParams(location.search).get('m') || 'champ_kaelith';
const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder);
const r = new THREE.WebGLRenderer(); r.setSize(800, 450); document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color(0x334455); sc.add(new THREE.HemisphereLight(0xffffff, 0x444444, 3));
const cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 50); cam.position.set(0, 1.6, 5); cam.lookAt(0, 1, 0);
L.load(`models/${name}.glb`, g => {
  sc.add(g.scene); const mixer = new THREE.AnimationMixer(g.scene); const res = {};
  let bone = null; g.scene.traverse(o => { if (o.isBone && !bone && o.name.startsWith('Arm')) bone = o; });
  for (const c of g.animations) { const a = mixer.clipAction(c); mixer.stopAllAction(); a.play(); const q0 = bone.quaternion.clone(); mixer.update(c.duration * 0.45); res[c.name] = +(bone.quaternion.angleTo(q0)).toFixed(3) + (Math.abs(g.scene.position.y) < 1e-6 ? 0 : 0); }
  mixer.stopAllAction(); mixer.clipAction(g.animations.find(c => c.name === 'Attack')).play(); mixer.update(0.25); r.render(sc, cam);
  window.result = { clips: g.animations.map(c => c.name), moved: res }; });
