import { describe, expect, it } from "vitest";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";
import type { HostDeckValidationInput } from "@/src/host-slides/validation";
import { validateHostDeck } from "@/src/host-slides/validation";
import { createEmptyDingbatSet } from "@/src/host-slides/types";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";

function createDeck() {
  return parseJayQuizText(createRepresentativeJayQuizText());
}

describe("validateHostDeck", () => {
  it("reports missing answers", () => {
    const deck = createDeck();
    deck.rounds[0].questions[0].answer = " ";

    expect(validateHostDeck(deck).missingAnswers).toEqual([
      { roundNumber: 1, questionNumber: 1 },
    ]);
  });

  it("reports empty questions", () => {
    const deck = createDeck();
    deck.rounds[1].questions[2].prompt = "";

    expect(validateHostDeck(deck).emptyQuestions).toEqual([
      { roundNumber: 2, questionNumber: 3 },
    ]);
  });

  it("reports required pictures without an attached image", () => {
    const deck = createDeck();
    const summary = validateHostDeck(deck);

    expect(summary.picturesMissingImages).toContainEqual({
      roundNumber: 1,
      questionNumber: 3,
    });

    deck.rounds[0].questions[2].imageUrl = "/fixture-picture.jpg";
    expect(validateHostDeck(deck).picturesMissingImages).not.toContainEqual({
      roundNumber: 1,
      questionNumber: 3,
    });
  });

  it("reports wrong question and round counts", () => {
    const deck = createDeck();
    deck.rounds[0].questions.pop();
    const fourRoundDeck: HostDeckValidationInput = {
      quizType: deck.quizType,
      rounds: deck.rounds.slice(0, 4),
      tiebreaker: deck.tiebreaker,
    };
    const summary = validateHostDeck(fourRoundDeck);

    expect(summary.wrongRoundCount).toEqual({ expected: 5, actual: 4 });
    expect(summary.wrongRoundSizes).toContainEqual({
      roundNumber: 1,
      roundTitle: "Pot Luck",
      expected: 10,
      actual: 9,
    });
  });

  it("treats a missing tiebreaker as informational only", () => {
    const deck = createDeck();
    const withoutTiebreaker: HostDeckValidationInput = {
      quizType: deck.quizType,
      rounds: deck.rounds,
    };

    const summary = validateHostDeck(withoutTiebreaker);
    expect(summary.warnings).toContain("Tiebreak not set");
    expect(summary.wrongRoundCount).toBeNull();
    expect(summary.wrongRoundSizes).toHaveLength(0);
  });

  it("reports missing Saturday Dingbat images and answers", () => {
    const sourceDeck = mockHostSlideDecks.find(
      (deck) => deck.quizType === "saturday",
    );
    if (!sourceDeck || sourceDeck.quizType !== "saturday") {
      throw new Error("Saturday fixture missing");
    }
    const deck = structuredClone(sourceDeck);
    let summary = validateHostDeck(deck);
    expect(summary.missingDingbatImages).toEqual([1, 2, 3, 4, 5, 6]);
    expect(summary.missingDingbatAnswers).toEqual([1, 2, 3, 4, 5, 6]);

    deck.dingbats = createEmptyDingbatSet();
    deck.dingbats.items.forEach((item) => {
      item.answer = `Answer ${item.position}`;
      item.imageStoragePath = `dingbats/${item.position}.jpg`;
    });
    summary = validateHostDeck(deck);
    expect(summary.missingDingbatImages).toHaveLength(0);
    expect(summary.missingDingbatAnswers).toHaveLength(0);
  });
});
