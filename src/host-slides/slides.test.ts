import { describe, expect, it } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import {
  buildHostSlidesFromShowOrder,
  getDefaultShowOrder,
  resolveHostShowOrder,
} from "@/src/host-slides/showOrder";
import type {
  HostDeck,
  HostPresenterSlide,
  HostRound,
  HostShowScreenType,
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

function showScreenIndexes(
  slides: HostPresenterSlide[],
  screenType: HostShowScreenType,
): number[] {
  return indexesOf(
    slides,
    (slide) => slide.type === "show-screen" && slide.screenType === screenType,
  );
}

function showOrderSummary(deck: HostDeck): string[] {
  return getDefaultShowOrder(deck.quizType, deck.rounds.length).map((block) =>
    block.type === "round_intro"
      ? `${block.type}:${block.config.roundNumber}`
      : block.type === "question_section" || block.type === "answer_section"
        ? `${block.type}:${block.config.roundNumbers.join(",")}`
        : block.type === "pre_break" ||
            block.type === "break_countdown" ||
            block.type === "post_break"
          ? `${block.type}:${block.config.breakNumber}`
          : block.type,
  );
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
  it("defines the required default Thursday show order", () => {
    const deck = getDeck("thursday");

    expect(showOrderSummary(deck)).toEqual([
      "pre_quiz",
      "title_slide",
      "round_intro:1",
      "question_section:1",
      "round_intro:2",
      "question_section:2",
      "round_intro:3",
      "question_section:3",
      "pre_break:1",
      "break_countdown:1",
      "post_break:1",
      "round_intro:1",
      "answer_section:1",
      "round_intro:2",
      "answer_section:2",
      "round_intro:3",
      "answer_section:3",
      "round_reset",
      "round_intro:4",
      "question_section:4",
      "round_intro:5",
      "question_section:5",
      "pre_break:2",
      "break_countdown:2",
      "post_break:2",
      "round_intro:4",
      "answer_section:4",
      "round_intro:5",
      "answer_section:5",
      "tiebreak",
      "quiz_end",
    ]);
  });

  it("defines Saturday Dingbats inside the second break area", () => {
    const deck = getDeck("saturday");
    const summary = showOrderSummary(deck);
    const secondBreakIndex = summary.indexOf("break_countdown:2");

    expect(summary.slice(secondBreakIndex - 1, secondBreakIndex + 4)).toEqual([
      "pre_break:2",
      "break_countdown:2",
      "dingbat_question",
      "dingbat_answer",
      "post_break:2",
    ]);
  });

  it("builds the section-based Thursday sequence", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);

    expect(slides[0]).toMatchObject({
      type: "show-screen",
      screenType: "pre_quiz",
    });
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

    expect(slides.at(-3)?.type).toBe("tiebreaker-question");
    expect(slides.at(-2)?.type).toBe("tiebreaker-answer");
    expect(slides.at(-1)).toMatchObject({
      type: "show-screen",
      screenType: "quiz_end",
    });
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
    expect(slides.at(-3)?.type).toBe("tiebreaker-question");
    expect(slides.at(-2)?.type).toBe("tiebreaker-answer");
    expect(slides.at(-1)).toMatchObject({
      type: "show-screen",
      screenType: "quiz_end",
    });
  });

  it("inserts first break show screens after Round 3 questions and before Round 1 answers", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);
    const allBreakIndexes = [
      ...showScreenIndexes(slides, "pre_break"),
      ...showScreenIndexes(slides, "break_countdown"),
      ...showScreenIndexes(slides, "post_break"),
    ].sort((left, right) => left - right);
    const round3QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[2], "question"),
    );
    const round1AnswerStart = Math.min(
      ...questionIndexes(slides, deck.rounds[0], "answer"),
    );
    const breakIndexes = allBreakIndexes.filter(
      (index) => index > round3QuestionEnd && index < round1AnswerStart,
    );

    expect(
      breakIndexes.map((index) =>
        slides[index].type === "show-screen" ? slides[index].screenType : null,
      ),
    ).toEqual(["pre_break", "break_countdown", "post_break"]);
    expect(Math.min(...breakIndexes)).toBeGreaterThan(round3QuestionEnd);
    expect(Math.max(...breakIndexes)).toBeLessThan(round1AnswerStart);
  });

  it("places the mid-quiz reset slide between Round 3 answers and Round 4 intro", () => {
    const deck = getDeck("thursday");
    const slides = buildHostSlideSequence(deck);
    const resetIndex = showScreenIndexes(slides, "mid_quiz_reset")[0];
    const round3AnswerEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[2], "answer"),
    );
    const round4IntroIndex = slides.findIndex(
      (slide) =>
        slide.type === "round-intro" && slide.roundId === deck.rounds[3].id,
    );

    expect(resetIndex).toBeGreaterThan(round3AnswerEnd);
    expect(resetIndex).toBeLessThan(round4IntroIndex);
  });

  it("places Saturday Break 2 before Dingbats and after Round 5 questions", () => {
    const deck = getDeck("saturday");
    const slides = buildHostSlideSequence(deck);
    const saturdayBreakIndex = showScreenIndexes(slides, "saturday_break_2")[0];
    const dingbatQuestionIndex = slides.findIndex(
      (slide) => slide.type === "dingbat-question",
    );
    const round5QuestionEnd = Math.max(
      ...questionIndexes(slides, deck.rounds[4], "question"),
    );

    expect(saturdayBreakIndex).toBeGreaterThan(round5QuestionEnd);
    expect(saturdayBreakIndex).toBeLessThan(dingbatQuestionIndex);
  });

  it("omits disabled show-order blocks", () => {
    const deck = structuredClone(getDeck("thursday"));
    deck.showOrder = resolveHostShowOrder(deck).map((block) =>
      block.type === "pre_break" ||
      block.type === "break_countdown" ||
      block.type === "post_break"
        ? { ...block, enabled: false }
        : block,
    );
    const slides = buildHostSlideSequence(deck);

    expect(showScreenIndexes(slides, "pre_break")).toHaveLength(0);
    expect(showScreenIndexes(slides, "break_countdown")).toHaveLength(0);
    expect(showScreenIndexes(slides, "post_break")).toHaveLength(0);
  });

  it("generates presenter output from show order", () => {
    const deck = structuredClone(getDeck("thursday"));
    const showOrder = resolveHostShowOrder(deck).filter(
      (block) =>
        block.type === "title_slide" ||
        block.id === "round-4-questions-intro" ||
        (block.type === "question_section" &&
          block.config.roundNumbers.includes(4)),
    );

    expect(buildHostSlidesFromShowOrder(deck, showOrder).map((slide) => slide.type))
      .toEqual(["title", "round-intro", "question", "question"]);
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

    expect(slides[0]).toMatchObject({
      type: "show-screen",
      screenType: "pre_quiz",
    });
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

    const questionIndexesAll = deck.rounds.flatMap((round) =>
      questionIndexes(slides, round, "question"),
    );
    const answerIndexesAll = deck.rounds.flatMap((round) =>
      questionIndexes(slides, round, "answer"),
    );
    expect(Math.max(...questionIndexesAll)).toBeLessThan(
      Math.min(...answerIndexesAll),
    );
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

  it("starts with the title slide when opening screens are disabled", () => {
    const deck = structuredClone(getDeck("thursday"));
    deck.showOrder = resolveHostShowOrder(deck).map((block) =>
      block.type === "pre_quiz" ? { ...block, enabled: false } : block,
    );
    const slides = buildHostSlideSequence(deck);

    expect(slides[0].type).toBe("title");
    expect(showScreenIndexes(slides, "pre_quiz")).toHaveLength(0);
  });
});
