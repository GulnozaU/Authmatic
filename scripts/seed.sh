#!/usr/bin/env bash
# scripts/seed.sh — populate the demo with 3 synthetic patients + 5 prior
# approvals (so pgvector RAG has something to retrieve in the demo).

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

: "${INSFORGE_DB_URL:?INSFORGE_DB_URL not set — copy .env.example to .env and fill in}"

echo "Seeding Authmatic demo data..."

psql "$INSFORGE_DB_URL" <<'SQL'
-- Idempotent: only seeds if patients is empty.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM patients LIMIT 1) THEN
    INSERT INTO patients (full_name, dob, plan_id, member_id) VALUES
      ('Jane Doe',     '1968-04-12', 'UHC-CHOICE-PLUS', 'UHC-000000-DEMO1'),
      ('John Sample',  '1955-11-30', 'AETNA-OAP-GOLD',  'AET-000000-DEMO2'),
      ('Mary Roe',     '1972-07-22', 'UHC-CHOICE-PLUS', 'UHC-000000-DEMO3');
  END IF;
END $$;

-- A handful of prior approvals — gives pgvector something to retrieve.
DO $$
DECLARE jane_id UUID;
BEGIN
  SELECT id INTO jane_id FROM patients WHERE full_name = 'Jane Doe';
  IF jane_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM prior_auths WHERE patient_id = jane_id
  ) THEN
    INSERT INTO prior_auths
      (patient_id, drug_name, drug_ndc, dose, diagnosis_code, status, receipt_url, rationale)
    VALUES
      (jane_id, 'Lisinopril', '00093-5050-01', '10mg daily', 'I10', 'approved',
        'https://uhcprovider.example.com/pa/DEMO-001',
        'Patient meets criteria for ACE inhibitor first-line therapy. BP 152/96 confirmed across two visits.'),
      (jane_id, 'Metformin',  '00093-1059-01', '500mg BID',  'E11.9', 'approved',
        'https://uhcprovider.example.com/pa/DEMO-002',
        'New T2DM diagnosis, A1c 8.4. First-line per ADA guidelines.');
  END IF;
END $$;

SELECT 'patients'    AS table_name, count(*) FROM patients
UNION ALL
SELECT 'prior_auths' AS table_name, count(*) FROM prior_auths;
SQL

echo "Seed complete."
