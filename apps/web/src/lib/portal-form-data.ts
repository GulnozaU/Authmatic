import { getDemoCase, type DemoCaseId } from "./demo-cases";
import { getDemoFormPayload as basePayload } from "./demo-cases";
import type { PaFormPayload } from "./pa-types";

/** All portal field IDs the agent fills (matches real PA request form layout). */
export type PortalFormValues = Record<string, string>;

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" "),
  };
}

export function getDemoPortalFormValues(caseId?: string | null): PortalFormValues {
  const demo = getDemoCase(caseId);
  const p = demo.payload;
  const { first, last } = splitName(p.patient_name);
  const prescriber = splitName(p.provider_name.replace(/,?\s*MD$/i, ""));

  const doseMatch = p.dosage.match(/^([\d.]+\s*\w+)/);
  const freqMatch = p.dosage.match(/(daily|weekly|once weekly|twice daily)/i);

  return {
    plan_name: demo.payer,
    plan_phone: "(800) 555-4321",
    plan_fax: "(800) 555-4322",
    patient_first_name: first,
    patient_last_name: last,
    patient_mi: caseId === "james-wilson" ? "R" : caseId === "maria-overshare" ? "L" : "E",
    patient_phone:
      caseId === "james-wilson"
        ? "(510) 555-0284"
        : caseId === "maria-overshare"
          ? "(510) 555-0312"
          : "(510) 555-0198",
    patient_address:
      caseId === "james-wilson"
        ? "901 Broadway"
        : caseId === "maria-overshare"
          ? "5521 International Blvd"
          : "2847 Maple Street",
    patient_city: "Oakland",
    patient_state: "CA",
    patient_zip: caseId === "james-wilson" ? "94607" : "94612",
    patient_dob: p.dob,
    patient_allergies: "NKDA",
    primary_insurance_name: demo.payer,
    primary_patient_id: p.member_id,
    secondary_insurance_name: "",
    secondary_patient_id: "",
    prescriber_first_name: prescriber.first || "Emily",
    prescriber_last_name: prescriber.last || "Chen",
    prescriber_specialty: "Internal Medicine",
    prescriber_address: "1840 Telegraph Ave",
    prescriber_city: "Oakland",
    prescriber_state: "CA",
    prescriber_zip: "94612",
    prescriber_npi: "1234567890",
    prescriber_phone: "(510) 555-0142",
    prescriber_fax: "(510) 555-0143",
    prescriber_email: "e.chen@bayareapc.com",
    medication_name:
      caseId === "james-wilson" ? p.medication : `${p.medication} (semaglutide)`,
    medication_dose: doseMatch?.[1] ?? p.dosage.split(" ")[0] ?? p.dosage,
    medication_frequency:
      (freqMatch?.[0] ?? p.dosage.replace(/^[\d.]+\s*\w+\s*/i, "")) || "As directed",
    medication_quantity: caseId === "james-wilson" ? "30 tablets" : "1 pen (4 doses)",
    medication_duration: caseId === "james-wilson" ? "90 days / 3 refills" : "12 weeks / 5 refills",
    diagnosis_primary: p.diagnosis,
    clinical_justification: p.justification,
    urgency_non_urgent: "on",
    patient_sex_female: caseId === "james-wilson" ? "" : "on",
    patient_sex_male: caseId === "james-wilson" ? "on" : "",
    therapy_new: "on",
    medication_route_injection: caseId === "james-wilson" ? "" : "on",
    medication_route_oral: caseId === "james-wilson" ? "on" : "",
    admin_location_home: caseId === "james-wilson" ? "" : "on",
    admin_location_office: caseId === "james-wilson" ? "on" : "",
  };
}

/** Order agent autofill types fields across the form (top to bottom). */
export const AUTOFILL_SEQUENCE: { id: string; kind: "text" | "checkbox" | "textarea" }[] = [
  { id: "plan_name", kind: "text" },
  { id: "plan_phone", kind: "text" },
  { id: "plan_fax", kind: "text" },
  { id: "urgency_non_urgent", kind: "checkbox" },
  { id: "patient_first_name", kind: "text" },
  { id: "patient_last_name", kind: "text" },
  { id: "patient_mi", kind: "text" },
  { id: "patient_phone", kind: "text" },
  { id: "patient_address", kind: "text" },
  { id: "patient_city", kind: "text" },
  { id: "patient_state", kind: "text" },
  { id: "patient_zip", kind: "text" },
  { id: "patient_dob", kind: "text" },
  { id: "patient_sex_female", kind: "checkbox" },
  { id: "patient_sex_male", kind: "checkbox" },
  { id: "patient_allergies", kind: "text" },
  { id: "primary_insurance_name", kind: "text" },
  { id: "primary_patient_id", kind: "text" },
  { id: "prescriber_first_name", kind: "text" },
  { id: "prescriber_last_name", kind: "text" },
  { id: "prescriber_specialty", kind: "text" },
  { id: "prescriber_address", kind: "text" },
  { id: "prescriber_city", kind: "text" },
  { id: "prescriber_state", kind: "text" },
  { id: "prescriber_zip", kind: "text" },
  { id: "prescriber_npi", kind: "text" },
  { id: "prescriber_phone", kind: "text" },
  { id: "prescriber_fax", kind: "text" },
  { id: "prescriber_email", kind: "text" },
  { id: "medication_name", kind: "text" },
  { id: "therapy_new", kind: "checkbox" },
  { id: "medication_dose", kind: "text" },
  { id: "medication_frequency", kind: "text" },
  { id: "medication_quantity", kind: "text" },
  { id: "medication_duration", kind: "text" },
  { id: "medication_route_oral", kind: "checkbox" },
  { id: "medication_route_injection", kind: "checkbox" },
  { id: "admin_location_home", kind: "checkbox" },
  { id: "admin_location_office", kind: "checkbox" },
  { id: "diagnosis_primary", kind: "text" },
  { id: "clinical_justification", kind: "textarea" },
];

export function portalValuesToPayload(v: PortalFormValues): PaFormPayload {
  const first = v.patient_first_name?.trim() ?? "";
  const last = v.patient_last_name?.trim() ?? "";
  const patient_name =
    [first, last].filter(Boolean).join(" ") || v.patient_name || "Unknown Patient";

  const prescriber = [v.prescriber_first_name, v.prescriber_last_name]
    .filter(Boolean)
    .join(" ");
  const provider_name = prescriber ? `${prescriber}, MD` : v.provider_name || "";

  const dosage = [v.medication_dose, v.medication_frequency].filter(Boolean).join(" ");

  return {
    patient_name,
    dob: v.patient_dob || v.dob || "",
    member_id: v.primary_patient_id || v.member_id || "",
    diagnosis: v.diagnosis_primary || v.diagnosis || "",
    medication: v.medication_name?.split("(")[0]?.trim() || v.medication || "",
    dosage: dosage || v.dosage || "",
    provider_name,
    justification: v.clinical_justification || v.justification || "",
  };
}

export function payloadToPortalValues(p: PaFormPayload, caseId?: DemoCaseId): PortalFormValues {
  return { ...getDemoPortalFormValues(caseId), ...p };
}

export { basePayload as getDemoFormPayload };
