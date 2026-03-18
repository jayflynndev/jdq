import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubmissionBody = {
  name?: string;
  email?: string;
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

    // Honeypot: bots often fill hidden fields
    if (body.website && body.website.trim() !== "") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const name = cleanText(body.name, 100);
    const email = cleanText(body.email, 200);
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

    const { error } = await supabase
      .from("anniversary_question_submissions")
      .insert({
        name,
        email,
        category,
        question,
        answer,
        notes,
        status: "pending",
      });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Unable to save your submission right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Submission route error:", error);
    return NextResponse.json(
      { error: "Something went wrong while submitting your question." },
      { status: 500 },
    );
  }
}
