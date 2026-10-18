#!/bin/sh
# Instala la última release de hacknight; se sirve en build.barraca.house/instalar.sh.
set -eu
release_repo=${HACKNIGHT_RELEASES:-barracafh/build-comite}
case "$release_repo" in *[!a-zA-Z0-9_./-]*|/*|*/|*..*) echo 'Repositorio inválido.' >&2; exit 2;; esac
if ! printf '%s\n' "$release_repo" | awk -F/ 'NF==2 && length($1)>0 && length($2)>0 {ok=1} END {exit !ok}'; then exit 2; fi
case "$(uname -s)" in Darwin) os=darwin;; Linux) os=linux;; *) echo 'Descarga el .exe de la release para Windows.' >&2; exit 2;; esac
case "$(uname -m)" in arm64|aarch64) cpu=arm64;; x86_64|amd64) cpu=x64;; *) echo 'Arquitectura no soportada.' >&2; exit 2;; esac
asset="hacknight-$os-$cpu"
install_dir=${HACKNIGHT_INSTALL_DIR:-"$HOME/.local/bin"}
mkdir -p "$install_dir"
stage=$(mktemp -d "$install_dir/.hacknight-install.XXXXXX")
trap 'rm -rf "$stage"' EXIT
base="https://github.com/$release_repo/releases/latest/download"
curl --fail --silent --show-error --location --proto '=https' --max-time 120 "$base/$asset" -o "$stage/$asset"
curl --fail --silent --show-error --location --proto '=https' --max-time 30 "$base/SHA256SUMS" -o "$stage/SHA256SUMS"
expected=$(awk -v name="$asset" '$2==name {print $1; count++} END {if(count!=1) exit 1}' "$stage/SHA256SUMS")
if command -v sha256sum >/dev/null 2>&1; then actual=$(sha256sum "$stage/$asset" | awk '{print $1}'); else actual=$(shasum -a 256 "$stage/$asset" | awk '{print $1}'); fi
if [ "$expected" != "$actual" ]; then echo 'SHA256 no coincide. No se ha instalado.' >&2; exit 2; fi
chmod 755 "$stage/$asset"
mv "$stage/$asset" "$install_dir/hacknight"
echo "Instalado en $install_dir/hacknight. Añade ese directorio a PATH si hace falta."
