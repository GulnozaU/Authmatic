#!/usr/bin/env bash
# scripts/smoke.sh — preflight check: every sponsor returns 200.
# Run this at H-2:00 (preflight) and again at H+5:30 (pre-pitch).

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }

fail=0

check() {
  local name="$1"; shift
  printf "%-12s " "$name"
  if "$@" >/tmp/smoke.out 2>&1; then
    green "OK"
  else
    red "FAIL"
    sed 's/^/  /' /tmp/smoke.out
    fail=$((fail + 1))
  fi
}

echo "Authmatic smoke test"
echo "===================="

check "Insforge"  bash -c '
  psql "$INSFORGE_DB_URL" -c "SELECT 1" >/dev/null
'

check "Daytona"   bash -c '
  PY="apps/agent/.venv/bin/python"
  [[ -x "$PY" ]] || PY=python3
  "$PY" -c "from daytona_sdk import Daytona, DaytonaConfig; Daytona(DaytonaConfig(api_key=\"$DAYTONA_API_KEY\"))"
'

check "Rtrvr"     bash -c '
  curl -sf -H "Authorization: Bearer $RTRVR_API_KEY" \
    https://api.rtrvr.ai/health >/dev/null
'

# Opsera is verified manually during preflight.
# The MCP endpoint uses an OAuth-via-Google handshake on first call from
# the Claude Code client, not a paste-in bearer token. Live verify (in
# apps/agent/src/tools/verify.py) is only reached when DEMO_FIXTURE_MODE
# is false AND an OPSERA_TOKEN env var has been captured from that
# handshake; for the demo path we run in fixture mode end-to-end.

check "Agent"     bash -c '
  curl -sf "${AGENT_BASE_URL:-http://localhost:8000}/healthz" >/dev/null
'

# Verifies both PDF formats (simple labeled-field + letterhead) parse to
# the right drug. Catches regressions in apps/agent/src/tools/execute.py
# or in the generated fixture PDFs. Skipped if pdfplumber not installed.
check "Parser"    bash -c '
  PY="apps/agent/.venv/bin/python"
  [[ -x "$PY" ]] || PY=python3
  "$PY" - <<PYEOF
import sys
sys.path.insert(0, "apps/agent")
try:
    from src.tools.execute import _local_parse
except ImportError as e:
    print(f"skip: {e}"); sys.exit(0)

cases = [
    ("assets/fixtures/rx-lisinopril.pdf",       "Lisinopril"),
    ("assets/fixtures/rx-metformin.pdf",        "Metformin"),
    ("assets/fixtures/rx-ozempic-martinez.pdf", "Ozempic"),
    ("assets/fixtures/rx-humira-thompson.pdf",  "Humira"),
]
fail = 0
for path, expected in cases:
    try:
        with open(path, "rb") as f:
            got = _local_parse(f.read()).get("drug_name", "")
    except FileNotFoundError:
        continue  # PDF not generated locally — non-fatal for smoke
    if expected.lower() not in got.lower():
        print(f"  {path}: expected {expected!r}, got {got!r}"); fail += 1
sys.exit(fail)
PYEOF
'

echo
if [[ $fail -eq 0 ]]; then
  green "All systems green. Cleared for build."
  exit 0
else
  red "$fail sponsor(s) red. See README.md for fixture-mode fallback."
  exit 1
fi
