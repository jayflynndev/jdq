import { NextResponse } from "next/server";
import type {
  ConnectionReviewFinding,
  ConnectionReviewRequest,
} from "@/src/host-slides/productionReview";
import {
  fetchOpenAiReview,
  openAiUnavailableMessage,
} from "@/src/host-slides/openAiReviewErrors";

export const runtime = "nodejs";
export const maxDuration = 60;

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown): ConnectionReviewRequest | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  if (
    typeof value.deckId !== "string" ||
    typeof value.quizTitle !== "string" ||
    (value.quizType !== "thursday" &&
      value.quizType !== "saturday" &&
      value.quizType !== "patreon") ||
    typeof value.roundNumber !== "number" ||
    typeof value.roundTitle !== "string"
  ) {
    return null;
  }
  const items = value.items.filter(
    (item): item is ConnectionReviewRequest["items"][number] => {
      if (!isRecord(item)) return false;
      return (
        typeof item.id === "string" &&
        typeof item.roundNumber === "number" &&
        typeof item.questionNumber === "number" &&
        typeof item.question === "string" &&
        typeof item.answer === "string"
      );
    },
  );
  if (items.length !== value.items.length) return null;
  return {
    deckId: value.deckId,
    quizTitle: value.quizTitle,
    quizType: value.quizType,
    roundNumber: value.roundNumber,
    roundTitle: value.roundTitle,
    items,
  };
}

function isFinding(value: unknown): value is ConnectionReviewFinding {
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

function parseFindings(content: string): ConnectionReviewFinding[] {
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
    return NextResponse.json(
      { error: "Invalid connection review request." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CONNECTION_REVIEW_MODEL;
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
      message: "Missing OPENAI_CONNECTION_REVIEW_MODEL",
    });
  }

  let response: Response | { timedOut: true; timeoutMs: number };
  try {
    response = await fetchOpenAiReview(
      "https://api.openai.com/v1/chat/completions",
      {
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
                "Review only Round 4 connection quality. Check whether Q10 is valid, any answer breaks the pattern, any answer reveals the connection too early, or the connection is too obscure. Do not edit data. Return JSON findings with confidence 0 to 1.",
            },
            {
              role: "user",
              content: JSON.stringify(reviewRequest),
            },
          ],
        }),
      },
    );
  } catch (error: unknown) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message:
        error instanceof Error
          ? `OpenAI Connection Review request failed: ${error.message}`
          : "OpenAI Connection Review request failed.",
    });
  }

  if ("timedOut" in response) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message: `OpenAI Connection Review timed out after ${response.timeoutMs}ms`,
    });
  }

  if (!response.ok) {
    return NextResponse.json({
      status: "unavailable",
      findings: [],
      message: await openAiUnavailableMessage(
        response,
        "OpenAI Connection Review",
      ),
    });
  }

  const payload = (await response.json()) as OpenAiResponse;
  const content = payload.choices?.[0]?.message?.content;
  return NextResponse.json({
    status: "completed",
    findings: typeof content === "string" ? parseFindings(content) : [],
  });
}
