#!/usr/bin/env bash
# Usage: test/consumer/run.sh <nest-major> <package-spec>
# Installs the package into a fresh app beside one Nest major, type-checks a consumer
# against its declarations, then runs the CJS and ESM probes.
# Pass a tarball as an absolute path, since the install runs in a temp directory.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
app="$(mktemp -d)"
trap 'rm -rf "$app"' EXIT
cd "$app"

# The TypeScript release that was current for each Nest major.
case "$1" in
  10) typescript=5.1 ;;
  11) typescript=5.4 ;;
  *) typescript=5.9 ;;
esac

npm init -y >/dev/null
npm install --ignore-scripts --no-audit --no-fund \
  "@nestjs/common@$1" "@nestjs/core@$1" "@nestjs/platform-express@$1" \
  "@nestjs/websockets@$1" "@nestjs/platform-socket.io@$1" socket.io-client jest@30 \
  reflect-metadata rxjs "typescript@$typescript" @types/node@20 "$2"

copies=$(find node_modules -path '*/@nestjs/common/package.json' | wc -l | tr -d ' ')
echo "@nestjs/common copies: $copies"

cp "$here/probe.mjs" "$here/app.cjs" "$here/app.mjs" "$here/types.ts" "$here/gateway.test.cjs" .
status=0
if npx --no-install tsc --noEmit --strict --skipLibCheck false \
  --experimentalDecorators --emitDecoratorMetadata \
  --module commonjs --moduleResolution node --target es2021 types.ts; then
  echo "ok   [types] declarations compile with TypeScript $typescript"
else
  echo "FAIL [types] declarations do not compile with TypeScript $typescript"
  status=1
fi
node app.cjs || status=1
node app.mjs || status=1
# Jest's default CommonJS mode cannot load the ESM-only Nest 12, and Nest 12 apps that
# run Jest with --experimental-vm-modules can use import() anyway.
if [ "$1" -lt 12 ]; then
  npx --no-install jest --ci || status=1
fi
if [ "$copies" -ne 1 ]; then
  echo "FAIL expected a single @nestjs/common copy"
  status=1
fi
exit "$status"
