// Empaqueta el juego con esbuild (incluye three.js) y genera dos salidas:
//   dist/coronas-de-ceniza.html  -> un solo archivo con los modelos glTF incrustados (doble clic, sin servidor)
//   dist/web/                    -> index.html + juego.js + assets/models/*.glb (para alojar en un servidor o GitHub Pages)
// Uso: node game/tools/bundle.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = await build({ entryPoints: [join(root, 'src/main.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const js = res.outputFiles[0].text;
const html = readFileSync(join(root, 'index.html'), 'utf8');
const tag = '<script type="module" src="src/main.js"></script>';
if (!html.includes(tag)) throw new Error('index.html: falta la etiqueta del script principal');

// modelos usados por el juego (lista en src/models.js)
const modelsSrc = readFileSync(join(root, 'src/models.js'), 'utf8');
const files = JSON.parse(modelsSrc.match(/MODEL_FILES = (\[[^\]]*\])/s)[1].replace(/'/g, '"'));
const models = Object.fromEntries(files.map(n => [n, readFileSync(join(root, 'assets/models', n + '.glb')).toString('base64')]));

mkdirSync(join(root, 'dist/web/assets/models'), { recursive: true });
const single = html.replace(tag, () => `<script>window.__MODELS=${JSON.stringify(models)};</script>\n<script>${js}</script>`);
writeFileSync(join(root, 'dist/coronas-de-ceniza.html'), single);
writeFileSync(join(root, 'dist/web/juego.js'), js);
writeFileSync(join(root, 'dist/web/index.html'), html.replace(tag, '<script src="juego.js"></script>'));
for (const n of files) copyFileSync(join(root, 'assets/models', n + '.glb'), join(root, 'dist/web/assets/models', n + '.glb'));
console.log(`OK dist/coronas-de-ceniza.html ${(single.length / 1048576).toFixed(1)} MB · dist/web/ (${files.length} modelos, juego.js ${(js.length / 1024).toFixed(0)} KB)`);
