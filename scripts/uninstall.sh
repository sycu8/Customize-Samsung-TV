#!/usr/bin/env bash
set -euo pipefail
# Rollback: remove only this sideloaded app. Samsung Home is untouched.
source "$(cd "$(dirname "$0")" && pwd)/env.sh"
node "$CLI_DIR/sdb-helper-cli.js" --request "uninstall $PACKAGE_ID" --serial "$TV_SERIAL"
