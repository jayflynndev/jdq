import { describe, expect, it } from "vitest";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { getPresenterGateDecision } from "@/src/host-slides/presenterGate";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";

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

function completeDeck() {
  const deck = parseJayQuizText(createRepresentativeJayQuizText());
  deck.rounds.forEach((round) =>
    round.questions.forEach((question) => {
      if (question.imagePlaceholder) {
        question.imageStoragePath = `fixture/${question.id}.jpg`;
      }
    }),
  );
  deck.qaFindings = [];
  deck.productionReview = REVIEW_METADATA;
  return deck;
}

describe("getPresenterGateDecision", () => {
  it("presents immediately at 100% readiness", () => {
    expect(
      getPresenterGateDecision(evaluateHostDeckReadiness(completeDeck())),
    ).toBe("present");
  });

  it("opens review when readiness has a warning", () => {
    const deck = completeDeck();
    delete deck.tiebreaker;

    expect(
      getPresenterGateDecision(evaluateHostDeckReadiness(deck)),
    ).toBe("review");
  });

  it("opens review when readiness has an error", () => {
    const deck = completeDeck();
    deck.rounds[3].questions[6].answer = "";

    expect(
      getPresenterGateDecision(evaluateHostDeckReadiness(deck)),
    ).toBe("review");
  });
});
