#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../worker"
npm ci
npm run typecheck
npm test
node --check ../frontend/app.js
node --check ../frontend/cloudBridge.js
node --check ../frontend/config.js
printf '\nAll local checks passed.\n'
