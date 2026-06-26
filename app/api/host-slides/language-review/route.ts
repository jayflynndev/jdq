import { NextResponse } from "next/server";
import type {
  LanguageReviewFinding,
  LanguageReviewItem,
  LanguageReviewRequest,
} from "@/src/host-slides/productionReview";
import { LANGUAGE_REVIEW_SYSTEM_INSTRUCTIONS } from "@/src/host-slides/productionReview";

export const runtime = "nodejs";

type OpenAiMessage = {
  role: "system" | "user";
  content: string;
};

type OpenAiChoice = {
  message?: {
    content?: string;
  };
};

type OpenAiChatResponse = {
  choices?: OpenAiChoice[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLanguageReviewItem(value: unknown): value is LanguageReviewItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (value.field === "round_title" ||
      value.field === "question" ||
      value.field === "answer" ||
      value.field === "show_screen_text") &&
    typeof value.text === "string" &&
    typeof value.location === "string" &&
    (value.targetType === "round" ||
      value.targetType === "question" ||
      value.targetType === "answer" ||
      value.targetType === "show_screen") &&
    typeof value.targetId === "string" &&
    (value.roundNumber === undefined || typeof value.roundNumber === "number") &&
    (value.questionNumber === undefined ||
      typeof value.questionNumber === "number")
  );
}

function parseLanguageReviewRequest(
  value: unknown,
): LanguageReviewRequest | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.deckId !== "string" ||
    typeof value.quizTitle !== "string" ||
    (value.quizType !== "thursday" &&
      value.quizType !== "saturday" &&
      value.quizType !== "patreon") ||
    typeof value.instructions !== "string" ||
    !Array.isArray(value.items) ||
    !value.items.every(isLanguageReviewItem)
  ) {
    return null;
  }

  return {
    deckId: value.deckId,
    quizTitle: value.quizTitle,
    quizType: value.quizType,
    instructions: value.instructions,
    items: value.items,
  };
}

function isLanguageReviewFinding(value: unknown): value is LanguageReviewFinding {
  if (!isRecord(value)) return false;
  return (
    typeof value.itemId === "string" &&
    (value.severity === "info" || value.severity === "warning") &&
    (value.category === "grammar" ||
      value.category === "spelling" ||
      value.category === "punctuation") &&
    typeof value.message === "string" &&
    (value.suggestedText === undefined ||
      typeof value.suggestedText === "string")
  );
}

function parseModelFindings(content: string): LanguageReviewFinding[] {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed) || !Array.isArray(parsed.findings)) return [];
    return parsed.findings.filter(isLanguageReviewFinding);
  } catch {
    return [];
  }
}

function buildMessages(request: LanguageReviewRequest): OpenAiMessage[] {
  return [
    {
      role: "system",
      content: [
        LANGUAGE_REVIEW_SYSTEM_INSTRUCTIONS,
        "Return JSON only in this exact shape:",
        '{"findings":[{"itemId":"string","severity":"info|warning","category":"grammar|spelling|punctuation","message":"string","suggestedText":"optional string"}]}',
        "Use category grammar for awkward, ambiguous, unclear, repeated, inconsistent, overly long, or confusing wording.",
        "Only include suggestedText when it is a precise replacement for the original field.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        deckId: request.deckId,
        quizTitle: request.quizTitle,
        quizType: request.quizType,
        items: request.items.map((item) => ({
          id: item.id,
          field: item.field,
          location: item.location,
          text: item.text,
        })),
      }),
    },
  ];
}

export async function POST(request: Request) {
  const languageRequest = parseLanguageReviewRequest(await request.json());
  if (!languageRequest) {
    return NextResponse.json({ error: "Invalid language review request." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_LANGUAGE_REVIEW_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json({ findings: [] });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: buildMessages(languageRequest),
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      findings: [],
      message: "Language Review provider failed.",
    });
  }

  const payload = (await response.json()) as OpenAiChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  return NextResponse.json({
    findings: typeof content === "string" ? parseModelFindings(content) : [],
  });
}
