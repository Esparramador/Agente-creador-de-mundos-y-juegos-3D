#!/usr/bin/env bash
# Integra un modelo final en el juego: valida -> optimiza -> copia -> reconstruye -> prueba.
# Uso: bash tools/blender/integrate_model.sh champ_kaelith
set -euo pipefail
ID="$1"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; SRC="$ROOT/game/assets/models/final/$ID.glb"
[ -f "$SRC" ] || { echo "No existe $SRC (exporta antes con export_glb.py)"; exit 1; }
node "$ROOT/game/tools/validate_models.mjs" "$SRC" --as "$ID"
cd "$ROOT/game"
npx gltf-transform optimize "$SRC" "assets/models/$ID.glb" --compress meshopt --texture-compress webp --texture-size 1024 --simplify false
echo "Optimizado: game/assets/models/$ID.glb"
echo "AHORA: en game/src/models.js añade '$ID' a MODEL_FILES y apunta MODEL_MAP/UNIT_MODELS a { model: '$ID', h: <altura>, anims: FINAL }"
echo "Después: node tools/bundle.mjs && node --test tests/game.test.mjs && python3 tests/e2e_browser.py"
