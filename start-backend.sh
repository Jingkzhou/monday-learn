#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/monday-learn-api"

if [ ! -d "$API_DIR" ]; then
  echo "Error: backend directory not found at $API_DIR" >&2
  exit 1
fi

# Allow APP_ENV to be set via argument or environment; default to dev
if [ $# -gt 0 ]; then
  export APP_ENV="$1"
else
  export APP_ENV="${APP_ENV:-dev}"
fi

cd "$API_DIR"

if [ -d "venv" ]; then
  # Prefer project-specific virtual environment if present
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

echo "Installing backend dependencies..."
pip install -r requirements.txt

ENV_FILE=".env.${APP_ENV}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Warning: $ENV_FILE not found. Default values from the code/config will be used."
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

if [ "$APP_ENV" = "prod" ]; then
  echo "Starting uvicorn in prod mode on ${HOST}:${PORT}..."
  exec uvicorn main:app --host "$HOST" --port "$PORT"
else
  echo "Starting uvicorn in ${APP_ENV} mode with reload on ${HOST}:${PORT}..."
  exec uvicorn main:app --reload --host "$HOST" --port "$PORT"
fi
