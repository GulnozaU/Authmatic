#!/usr/bin/env bash
# scripts/reset.sh — wipe agent runs + re-seed.
# Useful between practice runs so the demo always starts from a clean slate.
# Does NOT drop tables — only clears mutable rows.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

: "${INSFORGE_DB_URL:?INSFORGE_DB_URL not set}"

echo "Resetting Authmatic agent state..."

psql "$INSFORGE_DB_URL" <<'SQL'
TRUNCATE compliance_scans, agent_events, pa_embeddings, prior_auths
  RESTART IDENTITY CASCADE;
SQL

bash scripts/seed.sh
echo "Reset complete. Demo-ready."
