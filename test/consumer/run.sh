#!/usr/bin/env bash
# Usage: test/consumer/run.sh <nest-major> <package-spec>
# Installs the package into a fresh app beside one Nest major, then runs the CJS and ESM probes.
# Pass a tarball as an absolute path, since the install runs in a temp directory.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
app="$(mktemp -d)"
cd "$app"

npm init -y >/dev/null
npm install --ignore-scripts --no-audit --no-fund \
  "@nestjs/common@$1" "@nestjs/core@$1" "@nestjs/platform-express@$1" \
  reflect-metadata rxjs "$2"

copies=$(find node_modules -path '*/@nestjs/common/package.json' | wc -l | tr -d ' ')
echo "@nestjs/common copies: $copies"

cp "$here/probe.mjs" "$here/app.cjs" "$here/app.mjs" .
status=0
node app.cjs || status=1
node app.mjs || status=1
if [ "$copies" -ne 1 ]; then
  echo "FAIL expected a single @nestjs/common copy"
  status=1
fi
exit "$status"
