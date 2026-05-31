import { PriorAuthForm } from "@/components/portal/PriorAuthForm";

export default async function PriorAuthFormPage({
  searchParams,
}: {
  searchParams: Promise<{ autofill?: string; run?: string }>;
}) {
  const { autofill, run } = await searchParams;
  return (
    <PriorAuthForm
      autofill={autofill === "1"}
      runId={run}
    />
  );
}
