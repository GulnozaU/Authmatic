import { redirect } from "next/navigation";

export default async function SuccessRedirect({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (ref) {
    redirect(`/portal/healthfirst/submission/${ref}`);
  }
  redirect("/portal/healthfirst/prior-auth");
}
