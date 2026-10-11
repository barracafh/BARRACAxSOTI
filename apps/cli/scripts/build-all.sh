#!/usr/bin/env bash
# Adaptado del script MIT del origen. Solo compila; no publica nada.
set -euo pipefail
cd "$(dirname "$0")/.."
targets=(bun-linux-x64 bun-linux-arm64 bun-darwin-x64 bun-darwin-arm64 bun-windows-x64)
case "${1:-}" in
  --host) [[ $# == 1 ]] || exit 2 ;;
  --target)
    [[ $# == 2 ]] || { echo 'Falta el target de compilación.' >&2; exit 2; }
    valid=false
    for target in "${targets[@]}"; do [[ "$2" != "$target" ]] || valid=true; done
    "$valid" || { echo 'Target de compilación no admitido.' >&2; exit 2; }
    targets=("$2") ;;
  '') ;;
  *) echo 'Uso: build-all.sh [--host | --target bun-<plataforma>]' >&2; exit 2 ;;
esac
bun scripts/embed-plantilla.ts
common=(bun build --compile --minify --no-compile-autoload-dotenv --define 'HACKNIGHT_COMPILED=true' src/index.ts)
mkdir -p dist
if [[ "${1:-}" == "--host" ]]; then
  "${common[@]}" --outfile dist/hacknight
  exit 0
fi
for target in "${targets[@]}"; do
  out="dist/hacknight-${target#bun-}"
  if [[ "$target" == bun-windows-* ]]; then out="$out.exe"; fi
  "${common[@]}" --target="$target" --outfile "$out"
done
bun -e 'const files = Array.from(new Bun.Glob("hacknight-*").scanSync("dist")).sort(); const lines = await Promise.all(files.map(async f => new Bun.CryptoHasher("sha256").update(await Bun.file("dist/"+f).arrayBuffer()).digest("hex")+"  "+f)); await Bun.write("dist/SHA256SUMS",lines.join("\n")+"\n");'
