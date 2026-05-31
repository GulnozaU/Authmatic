"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PriorAuthForm } from "@/components/portal/PriorAuthForm";

function FormLoader() {
  const searchParams = useSearchParams();
  const autofill = searchParams.get("autofill") === "1";
  const runId = searchParams.get("run") ?? undefined;

  return <PriorAuthForm autofill={autofill} runId={runId} />;
}

function FormFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-600">Loading HealthFirst portal…</p>
    </div>
  );
}

export default function PriorAuthFormPage() {
  return (
    <Suspense fallback={<FormFallback />}>
      <FormLoader />
    </Suspense>
  );
}
