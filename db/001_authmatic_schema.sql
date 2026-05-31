-- Authmatic data model — all app data lives in InsForge (Postgres + Storage)

CREATE TABLE IF NOT EXISTS pa_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  member_id TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  under_review_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  denial_reason TEXT,
  reviewer_id TEXT
);

CREATE TABLE IF NOT EXISTS prior_auths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_id TEXT,
  receipt_url TEXT,
  chart_storage_key TEXT,
  chart_storage_url TEXT,
  prescription_storage_key TEXT,
  prescription_storage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pa_id UUID REFERENCES prior_auths(id) ON DELETE CASCADE,
  step_no INT NOT NULL,
  verb TEXT NOT NULL,
  plan TEXT,
  tool_input JSONB,
  tool_output JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demo_cases (
  id TEXT PRIMARY KEY,
  case_json JSONB NOT NULL,
  chart_storage_key TEXT,
  chart_storage_url TEXT,
  prescription_storage_key TEXT,
  prescription_storage_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pa_submissions_reference ON pa_submissions(reference_id);
CREATE INDEX IF NOT EXISTS idx_pa_submissions_status ON pa_submissions(status);
CREATE INDEX IF NOT EXISTS idx_prior_auths_reference ON prior_auths(reference_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_pa_id ON agent_events(pa_id);
