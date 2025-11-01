#!/usr/bin/env bash
set -euo pipefail

# Crear venv si no existe
if [ ! -d ".venv" ]; then
  python -m venv .venv
fi
source .venv/bin/activate || source .venv/Scripts/activate || . .venv/Scripts/activate

pip install -U pip
pip install -r requirements.txt

# Levantar el server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

