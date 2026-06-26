import { describe, expect, it } from "vitest";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { createEmptyDingbatSet } from "@/src/host-slides/types";

const REVIEW_METADATA = {
  lastRunAt: "2026-06-26T10:00:00Z",
  version: "production-review-v1",
  durationMs: 0,
  stages: [
    {
      id: "fact_review" as const,
      label: "AI Fact Review",
      status: "completed" as const,
      findingsCount: 0,
      durationMs: 0,
      completedAt: "2026-06-26T10:00:00Z",
    },
    {
      id: "image_suggestions" as const,
      label: "AI Image Suggestions",
      status: "completed" as const,
      findingsCount: 0,
      durationMs: 0,
      completedAt: "2026-06-26T10:00:00Z",
    },
    {
      id: "connection_review" as const,
      label: "AI Connection Review",
      status: "completed" as const,
      findingsCount: 0,
      durationMs: 0,
      completedAt: "2026-06-26T10:00:00Z",
    },
  ],
};

function createCompleteDeck() {
  const deck = parseJayQuizText(createRepresentativeJayQuizText());
  deck.rounds.forEach((round) => {
    round.questions.forEach((question) => {
      if (question.imagePlaceholder) {
        question.imageStoragePath = `fixture/${question.id}.jpg`;
      }
    });
  });
  deck.qaFindings = [];
  deck.productionReview = REVIEW_METADATA;
  return deck;
}

describe("evaluateHostDeckReadiness", () => {
  it("returns 100% for a complete factual checklist", () => {
    expect(evaluateHostDeckReadiness(createCompleteDeck())).toMatchObject({
      score: 100,
      warnings: [],
      errors: [],
      isReady: true,
    });
  });

  it("treats a missing tiebreak as a lighter warning", () => {
    const deck = createCompleteDeck();
    delete deck.tiebreaker;

    expect(evaluateHostDeckReadiness(deck)).toMatchObject({
      score: 92,
      isReady: true,
      errors: [],
      warnings: [{ code: "tiebreak_missing" }],
    });
  });

  it("scores a missing picture and tiebreak at 78%", () => {
    const deck = createCompleteDeck();
    delete deck.tiebreaker;
    delete deck.rounds[0].questions[2].imageStoragePath;

    expect(evaluateHostDeckReadiness(deck)).toMatchObject({
      score: 78,
      isReady: false,
      errors: [{ code: "picture_image_missing" }],
      warnings: [{ code: "tiebreak_missing" }],
    });
  });

  it("scores multiple missing answers deterministically", () => {
    const deck = createCompleteDeck();
    deck.rounds[0].questions.slice(0, 6).forEach((question) => {
      question.answer = "";
    });

    const result = evaluateHostDeckReadiness(deck);
    expect(result.score).toBe(40);
    expect(result.errors).toHaveLength(6);
    expect(result.isReady).toBe(false);
  });

  it("checks Saturday Dingbat images and answers", () => {
    const source = createRepresentativeJayQuizText().replace(
      "Thursday",
      "Saturday",
    );
    const deck = parseJayQuizText(source);
    if (deck.quizType !== "saturday") throw new Error("Expected Saturday");
    deck.rounds.forEach((round) =>
      round.questions.forEach((question) => {
        if (question.imagePlaceholder) {
          question.imageStoragePath = `fixture/${question.id}.jpg`;
        }
      }),
    );
    deck.dingbats = createEmptyDingbatSet();

    const result = evaluateHostDeckReadiness(deck);
    expect(
      result.errors.filter((issue) => issue.code === "dingbat_image_missing"),
    ).toHaveLength(6);
    expect(
      result.errors.filter((issue) => issue.code === "dingbat_answer_missing"),
    ).toHaveLength(6);
  });

  it("reports a missing deck as a factual failure", () => {
    expect(evaluateHostDeckReadiness(null)).toEqual({
      score: 0,
      passedChecks: 0,
      totalChecks: 1,
      warnings: [],
      errors: [{ code: "deck_missing", message: "Deck does not exist." }],
      isReady: false,
    });
  });

  it("warns when Production Review has not been run", () => {
    const deck = createCompleteDeck();
    delete deck.productionReview;

    expect(evaluateHostDeckReadiness(deck).warnings).toContainEqual(
      expect.objectContaining({ code: "production_review_not_run" }),
    );
  });

  it("reports open QA findings but ignores ignored findings", () => {
    const deck = createCompleteDeck();
    deck.qaFindings = [
      {
        id: "qa-error",
        deckId: deck.id,
        targetType: "question",
        targetId: deck.rounds[0].questions[0].id,
        roundNumber: 1,
        questionNumber: 1,
        severity: "error",
        category: "missing_answer",
        source: "LOCAL",
        message: "Open QA error.",
        status: "open",
        createdAt: "2026-06-26T10:00:00Z",
        updatedAt: "2026-06-26T10:00:00Z",
      },
      {
        id: "qa-ignored",
        deckId: deck.id,
        targetType: "question",
        targetId: deck.rounds[0].questions[1].id,
        roundNumber: 1,
        questionNumber: 2,
        severity: "warning",
        category: "punctuation",
        source: "LOCAL",
        message: "Ignored QA warning.",
        status: "ignored",
        createdAt: "2026-06-26T10:00:00Z",
        updatedAt: "2026-06-26T10:00:00Z",
      },
    ];

    const result = evaluateHostDeckReadiness(deck);

    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "qa_open_error" }),
    );
    expect(result.warnings).not.toContainEqual(
      expect.objectContaining({ code: "qa_open_warning" }),
    );
  });
});
