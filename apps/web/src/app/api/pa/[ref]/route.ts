import { NextResponse } from "next/server";
import { getSubmission } from "@/lib/submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  const submission = await getSubmission(ref);

  if (!submission) {
    return NextResponse.json({ error: "Reference ID not found" }, { status: 404 });
  }

  return NextResponse.json(submission);
}
