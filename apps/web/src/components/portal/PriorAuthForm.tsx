"use client";

import { useEffect, useRef, useState } from "react";
import { PortalHeader } from "./PortalHeader";
import {
  AUTOFILL_SEQUENCE,
  getDemoPortalFormValues,
  portalValuesToPayload,
  type PortalFormValues,
} from "@/lib/portal-form-data";

type Props = {
  autofill?: boolean;
  runId?: string;
  caseId?: string;
};

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-y border-[#7eb8da] bg-[#d4e8f5] px-4 py-1.5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#1a3a52]">{children}</h2>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  active,
  value,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  required?: boolean;
  active?: boolean;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const cls = `w-full border-0 border-b border-slate-400 bg-transparent px-1 py-1 text-sm focus:border-hf-blue focus:outline-none focus:ring-0 ${
    active ? "border-green-600 bg-green-50" : ""
  }`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
      />
    </div>
  );
}

function Check({
  id,
  label,
  active,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  active?: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-xs text-slate-700 ${
        active ? "rounded bg-green-50 px-1" : ""
      }`}
    >
      <input
        id={id}
        name={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-slate-400"
      />
      {label}
    </label>
  );
}

export function PriorAuthForm({ autofill = false, runId, caseId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<PortalFormValues>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [filling, setFilling] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const setField = (id: string, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  const setCheck = (id: string, v: boolean) =>
    setChecks((prev) => ({ ...prev, [id]: v }));

  useEffect(() => {
    if (!autofill) return;

    const demo = getDemoPortalFormValues(caseId);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= AUTOFILL_SEQUENCE.length) {
        clearInterval(interval);
        setFilling(null);
        setTimeout(() => formRef.current?.requestSubmit(), 700);
        return;
      }
      const { id, kind } = AUTOFILL_SEQUENCE[i];
      setFilling(id);
      if (kind === "checkbox") {
        setCheck(id, demo[id] === "on");
      } else {
        setField(id, demo[id] ?? "");
      }
      i += 1;
    }, 320);

    return () => clearInterval(interval);
  }, [autofill, caseId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitted) return;
    setSubmitted(true);

    const merged: PortalFormValues = { ...values };
    for (const [k, v] of Object.entries(checks)) {
      if (v) merged[k] = "on";
    }

    const payload = portalValuesToPayload(merged);

    try {
      const res = await fetch("/api/pa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { status_url?: string; reference_id?: string };
      const path =
        data.status_url?.startsWith("/")
          ? data.status_url
          : data.reference_id
            ? `/portal/healthfirst/submission/${data.reference_id}`
            : null;
      if (path) {
        window.location.assign(path);
      } else if (data.status_url) {
        window.location.assign(data.status_url);
      }
    } catch {
      setSubmitted(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-200 font-portal">
      <PortalHeader title="Prescription Drug Prior Authorization Request" />

      <main className="mx-auto max-w-4xl px-4 py-6">
        {autofill && (
          <div className="mb-4 rounded border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-900">
            <strong>Agent filling form</strong>
            {runId ? <> — run {runId.slice(0, 8)}…</> : null}
            {filling && (
              <span className="mt-1 block font-mono text-xs">Filling: #{filling}</span>
            )}
          </div>
        )}

        <form
          ref={formRef}
          id="prior-auth-form"
          onSubmit={handleSubmit}
          className="border border-slate-400 bg-white shadow-md"
        >
          {/* Title block — matches standard PA form */}
          <div className="border-b border-slate-400 px-4 py-3 text-center">
            <p className="text-[10px] text-slate-500">Page 1 of 2</p>
            <h1 className="text-sm font-bold uppercase leading-snug text-slate-900">
              Prescription Drug Prior Authorization or
              <br />
              Step Therapy Exception Request Form
            </h1>
          </div>

          {/* Plan header row */}
          <div className="grid gap-3 border-b border-slate-300 p-4 sm:grid-cols-3">
            <Field
              id="plan_name"
              label="Plan / Medical Group Name"
              required
              active={filling === "plan_name"}
              value={values.plan_name ?? ""}
              onChange={(v) => setField("plan_name", v)}
            />
            <Field
              id="plan_phone"
              label="Plan Phone #"
              active={filling === "plan_phone"}
              value={values.plan_phone ?? ""}
              onChange={(v) => setField("plan_phone", v)}
            />
            <Field
              id="plan_fax"
              label="Plan Fax #"
              active={filling === "plan_fax"}
              value={values.plan_fax ?? ""}
              onChange={(v) => setField("plan_fax", v)}
            />
          </div>

          <div className="flex flex-wrap gap-4 border-b border-slate-300 px-4 py-2">
            <Check
              id="urgency_non_urgent"
              label="Non-Urgent"
              active={filling === "urgency_non_urgent"}
              checked={checks.urgency_non_urgent ?? false}
              onChange={(v) => setCheck("urgency_non_urgent", v)}
            />
            <Check
              id="urgency_urgent"
              label="Urgent / Clinical Reason"
              active={filling === "urgency_urgent"}
              checked={checks.urgency_urgent ?? false}
              onChange={(v) => setCheck("urgency_urgent", v)}
            />
          </div>

          <SectionBar>1. Patient Information</SectionBar>
          <div className="grid gap-3 p-4 sm:grid-cols-4">
            <Field
              id="patient_first_name"
              label="First Name"
              required
              active={filling === "patient_first_name"}
              value={values.patient_first_name ?? ""}
              onChange={(v) => setField("patient_first_name", v)}
            />
            <Field
              id="patient_last_name"
              label="Last Name"
              required
              active={filling === "patient_last_name"}
              value={values.patient_last_name ?? ""}
              onChange={(v) => setField("patient_last_name", v)}
            />
            <Field
              id="patient_mi"
              label="MI"
              active={filling === "patient_mi"}
              value={values.patient_mi ?? ""}
              onChange={(v) => setField("patient_mi", v)}
            />
            <Field
              id="patient_phone"
              label="Phone Number"
              active={filling === "patient_phone"}
              value={values.patient_phone ?? ""}
              onChange={(v) => setField("patient_phone", v)}
            />
            <Field
              id="patient_address"
              label="Address"
              className="sm:col-span-2"
              active={filling === "patient_address"}
              value={values.patient_address ?? ""}
              onChange={(v) => setField("patient_address", v)}
            />
            <Field
              id="patient_city"
              label="City"
              active={filling === "patient_city"}
              value={values.patient_city ?? ""}
              onChange={(v) => setField("patient_city", v)}
            />
            <Field
              id="patient_state"
              label="State"
              active={filling === "patient_state"}
              value={values.patient_state ?? ""}
              onChange={(v) => setField("patient_state", v)}
            />
            <Field
              id="patient_zip"
              label="Zip Code"
              active={filling === "patient_zip"}
              value={values.patient_zip ?? ""}
              onChange={(v) => setField("patient_zip", v)}
            />
            <Field
              id="patient_dob"
              label="Date of Birth"
              required
              active={filling === "patient_dob"}
              value={values.patient_dob ?? ""}
              onChange={(v) => setField("patient_dob", v)}
            />
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-[11px] font-medium text-slate-700">Sex</span>
              <div className="flex gap-4">
                <Check
                  id="patient_sex_female"
                  label="Female"
                  active={filling === "patient_sex_female"}
                  checked={checks.patient_sex_female ?? false}
                  onChange={(v) => setCheck("patient_sex_female", v)}
                />
                <Check
                  id="patient_sex_male"
                  label="Male"
                  checked={checks.patient_sex_male ?? false}
                  onChange={(v) => setCheck("patient_sex_male", v)}
                />
              </div>
            </div>
            <Field
              id="patient_allergies"
              label="Allergies"
              className="sm:col-span-2"
              active={filling === "patient_allergies"}
              value={values.patient_allergies ?? ""}
              onChange={(v) => setField("patient_allergies", v)}
            />
          </div>

          <SectionBar>2. Insurance Information</SectionBar>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <Field
              id="primary_insurance_name"
              label="Primary Insurance Name"
              required
              active={filling === "primary_insurance_name"}
              value={values.primary_insurance_name ?? ""}
              onChange={(v) => setField("primary_insurance_name", v)}
            />
            <Field
              id="primary_patient_id"
              label="Patient ID Number"
              required
              active={filling === "primary_patient_id"}
              value={values.primary_patient_id ?? ""}
              onChange={(v) => setField("primary_patient_id", v)}
            />
            <Field
              id="secondary_insurance_name"
              label="Secondary Insurance Name"
              active={filling === "secondary_insurance_name"}
              value={values.secondary_insurance_name ?? ""}
              onChange={(v) => setField("secondary_insurance_name", v)}
            />
            <Field
              id="secondary_patient_id"
              label="Patient ID Number"
              active={filling === "secondary_patient_id"}
              value={values.secondary_patient_id ?? ""}
              onChange={(v) => setField("secondary_patient_id", v)}
            />
          </div>

          <SectionBar>3. Prescriber Information</SectionBar>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Field
              id="prescriber_first_name"
              label="First Name"
              required
              active={filling === "prescriber_first_name"}
              value={values.prescriber_first_name ?? ""}
              onChange={(v) => setField("prescriber_first_name", v)}
            />
            <Field
              id="prescriber_last_name"
              label="Last Name"
              required
              active={filling === "prescriber_last_name"}
              value={values.prescriber_last_name ?? ""}
              onChange={(v) => setField("prescriber_last_name", v)}
            />
            <Field
              id="prescriber_specialty"
              label="Specialty"
              active={filling === "prescriber_specialty"}
              value={values.prescriber_specialty ?? ""}
              onChange={(v) => setField("prescriber_specialty", v)}
            />
            <Field
              id="prescriber_address"
              label="Address"
              className="sm:col-span-2"
              active={filling === "prescriber_address"}
              value={values.prescriber_address ?? ""}
              onChange={(v) => setField("prescriber_address", v)}
            />
            <Field
              id="prescriber_city"
              label="City"
              active={filling === "prescriber_city"}
              value={values.prescriber_city ?? ""}
              onChange={(v) => setField("prescriber_city", v)}
            />
            <Field
              id="prescriber_state"
              label="State"
              active={filling === "prescriber_state"}
              value={values.prescriber_state ?? ""}
              onChange={(v) => setField("prescriber_state", v)}
            />
            <Field
              id="prescriber_zip"
              label="Zip Code"
              active={filling === "prescriber_zip"}
              value={values.prescriber_zip ?? ""}
              onChange={(v) => setField("prescriber_zip", v)}
            />
            <Field
              id="prescriber_npi"
              label="NPI Number"
              required
              active={filling === "prescriber_npi"}
              value={values.prescriber_npi ?? ""}
              onChange={(v) => setField("prescriber_npi", v)}
            />
            <Field
              id="prescriber_phone"
              label="Phone Number"
              active={filling === "prescriber_phone"}
              value={values.prescriber_phone ?? ""}
              onChange={(v) => setField("prescriber_phone", v)}
            />
            <Field
              id="prescriber_fax"
              label="Fax Number (HIPAA compliant)"
              active={filling === "prescriber_fax"}
              value={values.prescriber_fax ?? ""}
              onChange={(v) => setField("prescriber_fax", v)}
            />
            <Field
              id="prescriber_email"
              label="Email Address"
              className="sm:col-span-2"
              active={filling === "prescriber_email"}
              value={values.prescriber_email ?? ""}
              onChange={(v) => setField("prescriber_email", v)}
            />
          </div>

          <SectionBar>4. Medication / Medical and Dispensing Information</SectionBar>
          <div className="space-y-3 p-4">
            <Field
              id="medication_name"
              label="Medication Name"
              required
              active={filling === "medication_name"}
              value={values.medication_name ?? ""}
              onChange={(v) => setField("medication_name", v)}
            />
            <div className="flex flex-wrap gap-4">
              <Check
                id="therapy_new"
                label="New Therapy"
                active={filling === "therapy_new"}
                checked={checks.therapy_new ?? false}
                onChange={(v) => setCheck("therapy_new", v)}
              />
              <Check id="therapy_renewal" label="Renewal" checked={checks.therapy_renewal ?? false} onChange={(v) => setCheck("therapy_renewal", v)} />
              <Check id="therapy_step" label="Step Therapy Exception" checked={checks.therapy_step ?? false} onChange={(v) => setCheck("therapy_step", v)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field
                id="medication_dose"
                label="Dose / Strength"
                required
                active={filling === "medication_dose"}
                value={values.medication_dose ?? ""}
                onChange={(v) => setField("medication_dose", v)}
              />
              <Field
                id="medication_frequency"
                label="Frequency"
                required
                active={filling === "medication_frequency"}
                value={values.medication_frequency ?? ""}
                onChange={(v) => setField("medication_frequency", v)}
              />
              <Field
                id="medication_quantity"
                label="Quantity"
                active={filling === "medication_quantity"}
                value={values.medication_quantity ?? ""}
                onChange={(v) => setField("medication_quantity", v)}
              />
              <Field
                id="medication_duration"
                label="Length of Therapy / # Refills"
                active={filling === "medication_duration"}
                value={values.medication_duration ?? ""}
                onChange={(v) => setField("medication_duration", v)}
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-700">Route of Administration</p>
              <div className="flex flex-wrap gap-3">
                <Check id="medication_route_oral" label="Oral / SL" checked={checks.medication_route_oral ?? false} onChange={(v) => setCheck("medication_route_oral", v)} />
                <Check
                  id="medication_route_injection"
                  label="Injection"
                  active={filling === "medication_route_injection"}
                  checked={checks.medication_route_injection ?? false}
                  onChange={(v) => setCheck("medication_route_injection", v)}
                />
                <Check id="medication_route_iv" label="IV" checked={checks.medication_route_iv ?? false} onChange={(v) => setCheck("medication_route_iv", v)} />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-700">Place of Administration</p>
              <div className="flex flex-wrap gap-3">
                <Check id="admin_location_home" label="Patient&apos;s Home" active={filling === "admin_location_home"} checked={checks.admin_location_home ?? false} onChange={(v) => setCheck("admin_location_home", v)} />
                <Check id="admin_location_office" label="Physician&apos;s Office" checked={checks.admin_location_office ?? false} onChange={(v) => setCheck("admin_location_office", v)} />
              </div>
            </div>
            <Field
              id="diagnosis_primary"
              label="Primary Diagnosis (ICD-10)"
              required
              active={filling === "diagnosis_primary"}
              value={values.diagnosis_primary ?? ""}
              onChange={(v) => setField("diagnosis_primary", v)}
            />
            <div>
              <label
                htmlFor="clinical_justification"
                className="mb-1 block text-[11px] font-medium text-slate-700"
              >
                Clinical Justification / Step Therapy Documentation
                <span className="text-red-600"> *</span>
              </label>
              <textarea
                id="clinical_justification"
                name="clinical_justification"
                required
                rows={4}
                value={values.clinical_justification ?? ""}
                onChange={(e) => setField("clinical_justification", e.target.value)}
                className={`w-full border border-slate-300 px-2 py-1 text-sm focus:border-hf-blue focus:outline-none ${
                  filling === "clinical_justification" ? "border-green-600 bg-green-50" : ""
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-400 bg-slate-100 px-4 py-3">
            <p className="text-[10px] text-slate-500">
              Revised 12/2016 · Form HF-PA-212 · Synthetic demo data only
            </p>
            <button
              id="submit-prior-auth"
              type="submit"
              disabled={autofill && !!filling}
              className="rounded border border-hf-navy bg-hf-navy px-5 py-2 text-sm font-semibold text-white hover:bg-hf-blue disabled:opacity-50"
            >
              Submit Prior Authorization
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
