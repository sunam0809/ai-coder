#!/bin/bash
set -e
# Install pnpm via npm (bypass preinstall)
npm install -g pnpm --ignore-scripts 2>/dev/null || true
# If npm pnpm install failed, try npx
which pnpm || npx -y pnpm@10.26.1 install --no-frozen-lockfile && exit 0

pnpm install --no-frozen-lockfile
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/ai-coder run build

