import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubmissionBody = {
  name?: string;

  category?: string;
  question?: string;
  answer?: string;
  notes?: string;
  website?: string;
};

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmissionBody;

    if (body.website && body.website.trim() !== "") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const name = cleanText(body.name, 100);

    const category = cleanText(body.category, 100);
    const question = cleanText(body.question, 500);
    const answer = cleanText(body.answer, 300);
    const notes = cleanText(body.notes, 500);

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("anniversary_question_submissions")
      .insert([
        {
          name,

          category,
          question,
          answer,
          notes,
          status: "pending",
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: `Supabase insert failed: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Submission route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Route failed: ${error.message}`
            : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
