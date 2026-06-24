import { describe, expect, it } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import {
  getPresenterPreloadUrls,
  getPresenterSlideImageUrls,
} from "@/src/host-slides/presenterImagePreload";
import type { HostDeck, HostPresenterSlide } from "@/src/host-slides/types";
import { createEmptyDingbatSet } from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(deck);
}

describe("presenter image preload selection", () => {
  it("finds the same picture asset for question and answer slides", () => {
    const deck = getDeck("thursday");
    const round = deck.rounds[0];
    const question = round.questions[0];
    question.imageUrl = "https://images.example.test/question.png";
    const questionSlide: HostPresenterSlide = {
      id: "question",
      type: "question",
      roundId: round.id,
      questionId: question.id,
    };
    const answerSlide: HostPresenterSlide = {
      ...questionSlide,
      id: "answer",
      type: "answer",
    };

    expect(getPresenterSlideImageUrls(deck, questionSlide)).toEqual([
      question.imageUrl,
    ]);
    expect(getPresenterSlideImageUrls(deck, answerSlide)).toEqual([
      question.imageUrl,
    ]);
  });

  it("selects all available Dingbat images for either Dingbat slide", () => {
    const deck = getDeck("saturday");
    if (deck.quizType !== "saturday") throw new Error("Expected Saturday");
    deck.dingbats = createEmptyDingbatSet();
    deck.dingbats.items[0].imageUrl = "https://images.example.test/one.png";
    deck.dingbats.items[1].imageUrl = "https://images.example.test/two.png";

    expect(
      getPresenterSlideImageUrls(deck, {
        id: "dingbats",
        type: "dingbat-question",
      }),
    ).toEqual([
      "https://images.example.test/one.png",
      "https://images.example.test/two.png",
    ]);
    expect(
      getPresenterSlideImageUrls(deck, {
        id: "dingbat-answers",
        type: "dingbat-answer",
      }),
    ).toHaveLength(2);
  });

  it("preloads only the current and next five slides and deduplicates URLs", () => {
    const deck = getDeck("thursday");
    const round = deck.rounds[0];
    round.questions.forEach((question, index) => {
      question.imageUrl = `https://images.example.test/${index}.png`;
    });
    const repeatedQuestion = round.questions[0];
    const slides: HostPresenterSlide[] = [
      { id: "title", type: "title" },
      ...round.questions.map(
        (question): HostPresenterSlide => ({
          id: `${question.id}-question`,
          type: "question",
          roundId: round.id,
          questionId: question.id,
        }),
      ),
      {
        id: "repeated-answer",
        type: "answer",
        roundId: round.id,
        questionId: repeatedQuestion.id,
      },
      { id: "filler-1", type: "round-intro", roundId: round.id },
      { id: "filler-2", type: "round-intro", roundId: round.id },
      { id: "beyond-window", type: "tiebreaker-question" },
    ];
    if (deck.tiebreaker) {
      deck.tiebreaker.imageUrl = "https://images.example.test/beyond.png";
    }

    const urls = getPresenterPreloadUrls(deck, slides, 0, 5);

    expect(urls).toEqual([
      "https://images.example.test/0.png",
      "https://images.example.test/1.png",
    ]);
    expect(urls).not.toContain("https://images.example.test/beyond.png");
  });
});
