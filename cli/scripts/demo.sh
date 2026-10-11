#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
NO_COLOR=1 bun scripts/demo.ts
