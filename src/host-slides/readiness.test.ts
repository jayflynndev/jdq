import { describe, expect, it } from "vitest";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";
import { getHostDeckReadiness } from "@/src/host-slides/readiness";

function createDeck() {
  return parseJayQuizText(createRepresentativeJayQuizText());
}

function attachRequiredImages(): ReturnType<typeof createDeck> {
  const deck = createDeck();
  deck.rounds.forEach((round) => {
    round.questions.forEach((question) => {
      if (question.imagePlaceholder) {
        question.imageStoragePath = `fixture/${question.id}.jpg`;
      }
    });
  });
  return deck;
}

describe("getHostDeckReadiness", () => {
  it("counts picture questions and missing images", () => {
    const readiness = getHostDeckReadiness(createDeck());

    expect(readiness.pictureQuestionCount).toBe(2);
    expect(readiness.missingImageCount).toBe(2);
    expect(readiness.needsReview).toBe(true);
  });

  it("keeps manual Ready status separate from validation warnings", () => {
    const deck = attachRequiredImages();
    deck.status = "ready";

    expect(getHostDeckReadiness(deck)).toMatchObject({
      showReady: true,
      needsReview: false,
    });

    deck.rounds[0].questions[0].answer = "";
    expect(getHostDeckReadiness(deck)).toMatchObject({
      showReady: true,
      needsReview: true,
      validationWarningCount: 1,
    });
  });

  it("reports missing optional tiebreak separately from validation warnings", () => {
    const deck = attachRequiredImages();
    deck.status = "ready";
    delete deck.tiebreaker;

    expect(getHostDeckReadiness(deck)).toMatchObject({
      showReady: true,
      tiebreakerSet: false,
      validationWarningCount: 0,
    });
  });
});
