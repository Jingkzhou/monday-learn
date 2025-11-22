#!/usr/bin/env bash
set -euo pipefail

# Start Monday Learn API in production (or APP_ENV override).
# Usage: APP_ENV=prod HOST=0.0.0.0 PORT=8000 ./start-api.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ENV="${APP_ENV:-prod}"
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

cd "$SCRIPT_DIR"

ENV_FILE=".env.${APP_ENV}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: ${ENV_FILE} not found. Ensure required env vars are set."
fi

# Prepare virtual environment
if [ -d "venv" ]; then
  # shellcheck disable=SC1091
  source "venv/bin/activate"
elif [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
else
  echo "Creating virtual environment..."
  python3 -m venv venv
  # shellcheck disable=SC1091
  source "venv/bin/activate"
fi

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting API on ${HOST}:${PORT} (APP_ENV=${APP_ENV})"
APP_ENV="$APP_ENV" HOST="$HOST" PORT="$PORT" \
  exec uvicorn main:app --host "$HOST" --port "$PORT"
