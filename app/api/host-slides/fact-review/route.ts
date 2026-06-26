import { NextResponse } from "next/server";
import type {
  FactReviewFinding,
  FactReviewRequest,
} from "@/src/host-slides/productionReview";
import { openAiUnavailableMessage } from "@/src/host-slides/openAiReviewErrors";

export const runtime = "nodejs";

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown): FactReviewRequest | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  if (
    typeof value.deckId !== "string" ||
    typeof value.quizTitle !== "string" ||
    (value.quizType !== "thursday" &&
      value.quizType !== "saturday" &&
      value.quizType !== "patreon")
  ) {
    return null;
  }
  const items = value.items.filter((item): item is FactReviewRequest["items"][number] => {
    if (!isRecord(item)) return false;
    return (
      typeof item.id === "string" &&
      typeof item.roundNumber === "number" &&
      typeof item.questionNumber === "number" &&
      typeof item.question === "string" &&
      typeof item.answer === "string" &&
      typeof item.roundTitle === "string" &&
      typeof item.pictureRequired === "boolean"
    );
  });
  if (items.length !== value.items.length) return null;
  return {
    deckId: value.deckId,
    quizTitle: value.quizTitle,
    quizType: value.quizType,
    items,
  };
}

function isFinding(value: unknown): value is FactReviewFinding {
  if (!isRecord(value)) return false;
  return (
    typeof value.itemId === "string" &&
    (value.severity === "info" ||
      value.severity === "warning" ||
      value.severity === "error") &&
    typeof value.message === "string" &&
    typeof value.confidence === "number"
  );
}

function parseFindings(content: string): FactReviewFinding[] {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed) || !Array.isArray(parsed.findings)) return [];
    return parsed.findings.filter(isFinding);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const reviewRequest = parseRequest(await request.json());
  if (!reviewRequest) {
    return NextResponse.json({ error: "Invalid fact review request." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_FACT_REVIEW_MODEL;
  if (!apiKey) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message: "Missing OPENAI_API_KEY",
    });
  }
  if (!model) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message: "Missing OPENAI_FACT_REVIEW_MODEL",
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Review quiz facts only. Do not search the web. Do not edit data. Return only JSON. Flag wrong answers, possibly outdated material, alternative accepted answers, ambiguity, needs human review, low confidence, or high confidence. Include confidence from 0 to 1.",
        },
        {
          role: "user",
          content: JSON.stringify(reviewRequest),
        },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message: await openAiUnavailableMessage(response, "OpenAI Fact Review"),
    });
  }

  const payload = (await response.json()) as OpenAiResponse;
  const content = payload.choices?.[0]?.message?.content;
  return NextResponse.json({
    status: "completed",
    findings: typeof content === "string" ? parseFindings(content) : [],
  });
}
