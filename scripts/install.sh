#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/env.sh"
WGT=$(ls -1 "$PROJECT"/*.wgt "$PROJECT"/Release/*.wgt "$PROJECT"/.buildResult/*.wgt 2>/dev/null | head -1 || true)
if [[ -z "${WGT}" ]]; then
  echo "No .wgt found. Run scripts/build.sh first." >&2
  exit 1
fi
node "$CLI_DIR/remote-device-cli.js" connect "$TV_SERIAL"
node "$CLI_DIR/project-manager-cli.js" install --package "$WGT" --serial "$TV_SERIAL" --run
