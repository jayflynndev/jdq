import { describe, expect, it } from "vitest";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { getPresenterGateDecision } from "@/src/host-slides/presenterGate";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";

function completeDeck() {
  const deck = parseJayQuizText(createRepresentativeJayQuizText());
  deck.rounds.forEach((round) =>
    round.questions.forEach((question) => {
      if (question.imagePlaceholder) {
        question.imageStoragePath = `fixture/${question.id}.jpg`;
      }
    }),
  );
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
