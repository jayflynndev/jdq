import { describe, expect, it } from "vitest";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { createEmptyDingbatSet } from "@/src/host-slides/types";

function createCompleteDeck() {
  const deck = parseJayQuizText(createRepresentativeJayQuizText());
  deck.rounds.forEach((round) => {
    round.questions.forEach((question) => {
      if (question.imagePlaceholder) {
        question.imageStoragePath = `fixture/${question.id}.jpg`;
      }
    });
  });
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
});
