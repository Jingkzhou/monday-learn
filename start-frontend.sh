#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$SCRIPT_DIR/monday-learn-web"

if [ ! -d "$WEB_DIR" ]; then
  echo "Error: frontend directory not found at $WEB_DIR" >&2
  exit 1
fi

cd "$WEB_DIR"

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend dev server (http://localhost:5173)..."
npm run dev
