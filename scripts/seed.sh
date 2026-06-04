#!/usr/bin/env bash
# scripts/seed.sh — populate Postgres with demo patients + past approvals.
#
# Thin shell wrapper around scripts/seed.py (which does the real work,
# pulling rows from assets/fixtures/mock_data.json). Idempotent.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

: "${INSFORGE_DB_URL:?INSFORGE_DB_URL not set — copy .env.example to .env and fill in}"

# Prefer the agent venv (has asyncpg + python-dotenv); fall back to system python.
PY="apps/agent/.venv/bin/python"
if [[ ! -x "$PY" ]]; then
  PY=$(command -v python3 || command -v python)
fi

echo "Seeding Authmatic demo data via $PY..."
"$PY" scripts/seed.py
