import { describe, expect, it } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import { resolveHostShowScreens } from "@/src/host-slides/showScreens";
import type {
  HostDeck,
  HostPresenterSlide,
  HostRound,
} from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return deck;
}

function indexesOf(
  slides: HostPresenterSlide[],
  predicate: (slide: HostPresenterSlide) => boolean,
): number[] {
  return slides.flatMap((slide, index) => (predicate(slide) ? [index] : []));
}

function questionIndexes(
  slides: HostPresenterSlide[],
  round: HostRound,
  type: "question" | "answer",
): number[] {
  return indexesOf(
    slides,
    (slide) => slide.type === type && slide.roundId === round.id,
  );
}

function expectRoundSections(
  slides: HostPresenterSlide[],
  deck: HostDeck,
): void {
  deck.rounds.forEach((round) => {
    const intros = indexesOf(
      slides,
      (slide) => slide.type === "round-intro" && slide.roundId === round.id,
    );
    const questions = questionIndexes(slides, round, "question");
    const answers = questionIndexes(slides, round, "answer");

    expect(intros).toHaveLength(2);
    expect(intros[0]).toBeLessThan(Math.min(...questions));
    expect(intros[1]).toBeLessThan(Math.min(...answers));
  });
}

describe("buildHostSlideSequence", () => {
  it("builds the section-based Thursday sequence", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);

    expect(slides[0]).toMatchObject({ type: "pre-quiz" });
    expect(slides[1]).toMatchObject({ type: "title" });
    expectRoundSections(slides, deck);

    const firstHalfQuestionIndexes = deck.rounds
      .slice(0, 3)
      .flatMap((round) => questionIndexes(slides, round, "question"));
    const firstHalfAnswerIndexes = deck.rounds
      .slice(0, 3)
      .flatMap((round) => questionIndexes(slides, round, "answer"));
    expect(Math.max(...firstHalfQuestionIndexes)).toBeLessThan(
      Math.min(...firstHalfAnswerIndexes),
    );

    const secondHalfQuestionIndexes = deck.rounds
      .slice(3, 5)
      .flatMap((round) => questionIndexes(slides, round, "question"));
    const secondHalfAnswerIndexes = deck.rounds
      .slice(3, 5)
      .flatMap((round) => questionIndexes(slides, round, "answer"));
    expect(Math.max(...secondHalfQuestionIndexes)).toBeLessThan(
      Math.min(...secondHalfAnswerIndexes),
    );

    expect(slides.at(-2)?.type).toBe("tiebreaker-question");
    expect(slides.at(-1)?.type).toBe("tiebreaker-answer");
    expect(
      slides.some(
        (slide) =>
          slide.type === "dingbat-question" || slide.type === "dingbat-answer",
      ),
    ).toBe(false);
  });

  it("places Saturday Dingbats between Round 5 questions and Round 4 answers", () => {
    const deck = getDeck("saturday");
    const slides = buildHostSlideSequence(deck);
    expectRoundSections(slides, deck);

    const dingbatQuestionIndex = slides.findIndex(
      (slide) => slide.type === "dingbat-question",
    );
    const dingbatAnswerIndex = slides.findIndex(
      (slide) => slide.type === "dingbat-answer",
    );
    const round5QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[4], "question"),
    );
    const round4AnswerStart = Math.min(
      ...questionIndexes(slides, deck.rounds[3], "answer"),
    );

    expect(dingbatQuestionIndex).toBeGreaterThan(round5QuestionEnd);
    expect(dingbatAnswerIndex).toBeGreaterThan(dingbatQuestionIndex);
    expect(dingbatAnswerIndex).toBeLessThan(round4AnswerStart);
    expect(slides.at(-2)?.type).toBe("tiebreaker-question");
    expect(slides.at(-1)?.type).toBe("tiebreaker-answer");
  });

  it("inserts the first break after Round 3 questions and before Round 1 answers", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);
    const firstBreakIndex = slides.findIndex(
      (slide) => slide.type === "break" && slide.breakType === "first",
    );
    const round3QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[2], "question"),
    );
    const round1Intros = indexesOf(
      slides,
      (slide) =>
        slide.type === "round-intro" && slide.roundId === deck.rounds[0].id,
    );
    const round1AnswerStart = Math.min(
      ...questionIndexes(slides, deck.rounds[0], "answer"),
    );

    expect(firstBreakIndex).toBeGreaterThan(round3QuestionEnd);
    expect(firstBreakIndex).toBeLessThan(round1AnswerStart);
    expect(round1Intros[1]).toBeGreaterThan(firstBreakIndex);
    expect(round1Intros[1]).toBeLessThan(round1AnswerStart);
  });

  it("inserts the second break after Round 5 questions and before Round 4 answers", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);
    const secondBreakIndex = slides.findIndex(
      (slide) => slide.type === "break" && slide.breakType === "second",
    );
    const round5QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[4], "question"),
    );
    const round4AnswerStart = Math.min(
      ...questionIndexes(slides, deck.rounds[3], "answer"),
    );

    expect(secondBreakIndex).toBeGreaterThan(round5QuestionEnd);
    expect(secondBreakIndex).toBeLessThan(round4AnswerStart);
  });

  it("places an enabled Saturday second break before Dingbats", () => {
    const deck = structuredClone(getDeck("saturday"));
    deck.showScreens = {
      ...resolveHostShowScreens(deck.quizType, deck.showScreens),
      secondBreak: {
        ...resolveHostShowScreens(deck.quizType, deck.showScreens).secondBreak,
        enabled: true,
      },
    };
    const slides = buildHostSlideSequence(deck);
    const secondBreakIndex = slides.findIndex(
      (slide) => slide.type === "break" && slide.breakType === "second",
    );
    const dingbatQuestionIndex = slides.findIndex(
      (slide) => slide.type === "dingbat-question",
    );
    const round5QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[4], "question"),
    );

    expect(secondBreakIndex).toBeGreaterThan(round5QuestionEnd);
    expect(secondBreakIndex).toBeLessThan(dingbatQuestionIndex);
  });

  it("omits disabled break screens", () => {
    const deck = structuredClone(getDeck("thursday"));
    const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
    deck.showScreens = {
      ...showScreens,
      firstBreak: { ...showScreens.firstBreak, enabled: false },
      secondBreak: { ...showScreens.secondBreak, enabled: false },
    };
    const slides = buildHostSlideSequence(deck);

    expect(slides.some((slide) => slide.type === "break")).toBe(false);
  });

  it("adds the optional connection explanation after the Round 4 answers", () => {
    const deck = structuredClone(getDeck("thursday"));
    deck.connectionExplanation = "The answers were all IKEA ranges.";
    const slides = buildHostSlideSequence(deck);
    const explanationIndex = slides.findIndex(
      (slide) => slide.type === "connection-explanation",
    );
    const round4AnswerEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[3], "answer"),
    );
    const round5AnswerStart = Math.min(
      ...questionIndexes(slides, deck.rounds[4], "answer"),
    );

    expect(explanationIndex).toBeGreaterThan(round4AnswerEnd);
    expect(explanationIndex).toBeLessThan(round5AnswerStart);
  });

  it("omits the connection explanation slide when the text is blank", () => {
    const deck = structuredClone(getDeck("thursday"));
    deck.connectionExplanation = "   ";
    const slides = buildHostSlideSequence(deck);

    expect(
      slides.some((slide) => slide.type === "connection-explanation"),
    ).toBe(false);
  });

  it("uses the simpler Patreon branch", () => {
    const deck = getDeck("patreon");
    const slides = buildHostSlideSequence(deck);

    expect(slides[0].type).toBe("pre-quiz");
    expect(slides[1].type).toBe("title");
    expect(
      slides.some(
        (slide) =>
          slide.type === "dingbat-question" || slide.type === "dingbat-answer",
      ),
    ).toBe(false);
    expect(
      slides.some(
        (slide) =>
          slide.type === "tiebreaker-question" ||
          slide.type === "tiebreaker-answer",
      ),
    ).toBe(false);

    const round1AnswerEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[0], "answer"),
    );
    const round2QuestionStart = Math.min(
      ...questionIndexes(slides, deck.rounds[1], "question"),
    );
    expect(round1AnswerEnd).toBeLessThan(round2QuestionStart);
  });

  it("omits tiebreak slides when a weekly deck has no tiebreak", () => {
    const deck = structuredClone(getDeck("thursday"));
    delete deck.tiebreaker;
    const slides = buildHostSlideSequence(deck);

    expect(slides.some((slide) => slide.type === "tiebreaker-question")).toBe(
      false,
    );
    expect(slides.some((slide) => slide.type === "tiebreaker-answer")).toBe(
      false,
    );
  });

  it("starts with the title slide when the pre-quiz screen is disabled", () => {
    const deck = structuredClone(getDeck("thursday"));
    const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
    deck.showScreens = {
      ...showScreens,
      preQuiz: { ...showScreens.preQuiz, enabled: false },
    };
    const slides = buildHostSlideSequence(deck);

    expect(slides[0].type).toBe("title");
    expect(slides.some((slide) => slide.type === "pre-quiz")).toBe(false);
  });
});
