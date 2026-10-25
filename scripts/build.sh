#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/env.sh"
node "$CLI_DIR/project-manager-cli.js" build --project "$PROJECT" --build-type Release --sign-profile "$PROFILE_NAME"
