import { describe, expect, it, vi } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import {
  createQuizRecapDraft,
  createQuizRecapReviewDraft,
  UnsupportedQuizRecapDeckError,
} from "@/src/host-slides/quizRecapAdapter";
import type { HostDeck } from "@/src/host-slides/types";
import { createEmptyDingbatSet } from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(deck);
}

const resolveImageUrl = (storagePath: string) =>
  `https://images.example.test/${storagePath}`;

describe("createQuizRecapDraft", () => {
  it("maps a Thursday deck into rounds 1-3 in part 1 and rounds 4-5 in part 2", () => {
    const deck = getDeck("thursday");
    const draft = createQuizRecapDraft(deck, resolveImageUrl);

    expect(draft.quiz_day).toBe("Thursday");
    expect(draft.quiz_date).toBe(deck.quizDate);
    expect(draft.parts.part1.rounds.map((round) => round.round)).toEqual([
      1, 2, 3,
    ]);
    expect(draft.parts.part2.rounds.map((round) => round.round)).toEqual([
      4, 5,
    ]);
    expect([
      ...draft.parts.part1.rounds,
      ...draft.parts.part2.rounds,
    ]).toHaveLength(5);
  });

  it("maps Saturday rounds but excludes Dingbats", () => {
    const deck = getDeck("saturday");
    if (deck.quizType !== "saturday") throw new Error("Expected Saturday");
    const dingbats = createEmptyDingbatSet();
    dingbats.items[0] = {
      position: 1,
      answer: "Excluded Dingbat Answer",
      imageStoragePath: "host-slides/deck/dingbats/dingbat-1.png",
    };
    deck.dingbats = dingbats;

    const draft = createQuizRecapDraft(deck, resolveImageUrl);
    const serializedDraft = JSON.stringify(draft);

    expect(draft.quiz_day).toBe("Saturday");
    expect(draft.parts.part1.rounds).toHaveLength(3);
    expect(draft.parts.part2.rounds).toHaveLength(2);
    expect(serializedDraft).not.toContain("dingbat-1.png");
    expect(serializedDraft).not.toContain("Excluded Dingbat Answer");
  });

  it("rejects Patreon decks", () => {
    expect(() =>
      createQuizRecapDraft(getDeck("patreon"), resolveImageUrl),
    ).toThrow(UnsupportedQuizRecapDeckError);
  });

  it("excludes answers and the tiebreak", () => {
    const deck = getDeck("thursday");
    const firstQuestion = deck.rounds[0].questions[0];
    const tiebreaker = deck.tiebreaker;
    if (!tiebreaker) throw new Error("Expected tiebreaker fixture");

    const draft = createQuizRecapDraft(deck, resolveImageUrl);
    const serializedDraft = JSON.stringify(draft);

    expect(draft.parts.part1.rounds[0].questions[0]).toBe(
      firstQuestion.prompt,
    );
    expect(serializedDraft).not.toContain(firstQuestion.answer);
    expect(serializedDraft).not.toContain(tiebreaker.prompt);
    expect(serializedDraft).not.toContain(tiebreaker.answer);
  });

  it("maps persisted picture-question images into the correct recap part", () => {
    const deck = getDeck("thursday");
    deck.rounds[1].questions[1].imageStoragePath =
      "host-slides/deck/round-2-q2-face.png";
    deck.rounds[3].questions[0].imageStoragePath =
      "host-slides/deck/round-4-q1-band.png";
    const resolver = vi.fn(resolveImageUrl);

    const draft = createQuizRecapDraft(deck, resolver);

    expect(draft.parts.part1.images).toEqual([
      {
        label: "Round 2 Question 2",
        url: "https://images.example.test/host-slides/deck/round-2-q2-face.png",
      },
    ]);
    expect(draft.parts.part2.images).toEqual([
      {
        label: "Round 4 Question 1",
        url: "https://images.example.test/host-slides/deck/round-4-q1-band.png",
      },
    ]);
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it("uses a local picture URL in review without allowing it into publishing", () => {
    const deck = getDeck("thursday");
    deck.rounds[0].questions[1].imageUrl =
      "data:image/png;base64,local-preview";
    const resolver = vi.fn(resolveImageUrl);

    const review = createQuizRecapReviewDraft(deck, resolver);
    const publishing = createQuizRecapDraft(deck, resolver);

    expect(review.parts.part1.images).toEqual([
      {
        label: "Round 1 Question 2",
        url: "data:image/png;base64,local-preview",
      },
    ]);
    expect(publishing.parts.part1.images).toEqual([]);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("prefers an already-resolved persisted image URL in review", () => {
    const deck = getDeck("thursday");
    const question = deck.rounds[3].questions[0];
    question.imageStoragePath = "host-slides/deck/round-4-q1-band.png";
    question.imageUrl = "https://cdn.example.test/round-4-q1-band.png";
    const resolver = vi.fn(resolveImageUrl);

    const review = createQuizRecapReviewDraft(deck, resolver);

    expect(review.parts.part2.images).toEqual([
      {
        label: "Round 4 Question 1",
        url: "https://cdn.example.test/round-4-q1-band.png",
      },
    ]);
    expect(resolver).not.toHaveBeenCalled();
  });
});
