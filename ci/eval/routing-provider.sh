#!/usr/bin/env bash
# Promptfoo exec entry. Node 22 strip-types is required to import the harness.
set -euo pipefail
dir=$(cd "$(dirname "$0")" && pwd)
exec node --experimental-strip-types "$dir/routing-provider.mjs" "$@"
