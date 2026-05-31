import type { AdjudicationResult, PaFormPayload, PaStatus } from "./pa-types";
import { getSubmission, updateSubmission } from "./submissions";

const STEP_THERAPY_KEYWORDS = [
  "first-line",
  "metformin",
  "inadequate",
  "glycemic",
  "responding",
  "despite",
  "therapy",
  "control",
];

interface RuleCheck {
  passed: boolean;
  reason: string;
}

function checkField(value: string, label: string): RuleCheck {
  if (!value?.trim()) {
    return { passed: false, reason: `Missing required field: ${label}` };
  }
  return { passed: true, reason: `${label} documented` };
}

function checkMemberId(member_id: string): RuleCheck {
  if (!/^HF\d{8}$/i.test(member_id.trim())) {
    return {
      passed: false,
      reason: "Member ID format invalid — expected HealthFirst ID (HF########)",
    };
  }
  return { passed: true, reason: "Member eligibility verified (demo)" };
}

function checkStepTherapy(justification: string, medication: string): RuleCheck {
  const text = `${justification} ${medication}`.toLowerCase();
  const hits = STEP_THERAPY_KEYWORDS.filter((k) => text.includes(k));
  if (hits.length < 2) {
    return {
      passed: false,
      reason:
        "Step therapy documentation insufficient — prior trial and clinical rationale required",
    };
  }
  return {
    passed: true,
    reason: "Step therapy criteria met — documented failure of first-line agent",
  };
}

function checkFormulary(medication: string): RuleCheck {
  const covered = ["ozempic", "semaglutide", "mounjaro", "trulicity"];
  if (!covered.some((d) => medication.toLowerCase().includes(d))) {
    return {
      passed: false,
      reason: `${medication} not on HealthFirst PPO formulary without PA`,
    };
  }
  return { passed: true, reason: "Medication requires PA — routed to medical review" };
}

export function evaluateSubmission(payload: PaFormPayload): {
  status: PaStatus;
  decision_notes: string;
  denial_reason?: string;
  checks: RuleCheck[];
} {
  const checks: RuleCheck[] = [
    checkField(payload.patient_name, "Patient name"),
    checkField(payload.dob, "Date of birth"),
    checkMemberId(payload.member_id),
    checkField(payload.diagnosis, "Diagnosis"),
    checkField(payload.medication, "Medication"),
    checkField(payload.dosage, "Dosage"),
    checkField(payload.provider_name, "Provider"),
    checkField(payload.justification, "Clinical justification"),
    checkFormulary(payload.medication),
    checkStepTherapy(payload.justification, payload.medication),
  ];

  const failed = checks.filter((c) => !c.passed);
  if (failed.length > 0) {
    return {
      status: "denied",
      decision_notes: "Medical necessity criteria not met.",
      denial_reason: failed.map((f) => f.reason).join("; "),
      checks,
    };
  }

  return {
    status: "approved",
    decision_notes:
      "Prior authorization approved. Documented step therapy failure and clinical indication support coverage per HealthFirst PPO medical policy GLP-1-2024.",
    checks,
  };
}

export async function adjudicateReference(
  reference_id: string,
  reviewDelayMs = 0
): Promise<AdjudicationResult | null> {
  const submission = getSubmission(reference_id);
  if (!submission) return null;

  if (submission.status === "approved" || submission.status === "denied") {
    return {
      reference_id,
      status: submission.status,
      decision_notes: submission.decision_notes ?? "",
      denial_reason: submission.denial_reason,
      reviewer_id: submission.reviewer_id ?? "HF-REV-DEMO",
    };
  }

  updateSubmission(reference_id, {
    status: "under_review",
    under_review_at: new Date().toISOString(),
    reviewer_id: "HF-MCR-8842",
  });

  if (reviewDelayMs > 0) {
    await new Promise((r) => setTimeout(r, reviewDelayMs));
  }

  const evaluation = evaluateSubmission(submission);
  const decided_at = new Date().toISOString();

  updateSubmission(reference_id, {
    status: evaluation.status,
    decided_at,
    decision_notes: evaluation.decision_notes,
    denial_reason: evaluation.denial_reason,
    reviewer_id: "HF-MCR-8842",
  });

  return {
    reference_id,
    status: evaluation.status,
    decision_notes: evaluation.decision_notes,
    denial_reason: evaluation.denial_reason,
    reviewer_id: "HF-MCR-8842",
  };
}
