#!/usr/bin/env bash
# Runs all checks: the unit checks (normalizer, game) and the API walk-through against a real
# server on a spare port with a temporary DATA_DIR. Exits non-zero on the first failing part.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== unit checks =="
node test/unit-test.js

echo
echo "== API walk-through =="
node test/api-test.js

echo
echo "All checks passed."
