import type {
  HostDeck,
  HostPresenterSlide,
  HostQuizType,
  HostRound,
  HostShowBlock,
  HostShowBlockType,
  HostShowOrder,
} from "@/src/host-slides/types";

function blockBase(
  id: string,
  type: HostShowBlockType,
  label: string,
  enabled = true,
): Pick<HostShowBlock, "id" | "type" | "label" | "enabled"> {
  return { id, type, label, enabled };
}

function simpleBlock(
  id: string,
  type: "pre_quiz" | "title_slide" | "round_reset" | "quiz_end",
  label: string,
  enabled = true,
): HostShowBlock {
  return { ...blockBase(id, type, label, enabled), type };
}

function roundIntroBlock(
  roundNumber: number,
  section: "questions" | "answers" = "questions",
): HostShowBlock {
  return {
    ...blockBase(
      `round-${roundNumber}-${section}-intro`,
      "round_intro",
      `Round ${roundNumber} intro`,
    ),
    type: "round_intro",
    config: { roundNumber },
  };
}

function questionSectionBlock(roundNumbers: number[]): HostShowBlock {
  const label =
    roundNumbers.length === 1
      ? `Round ${roundNumbers[0]} questions`
      : `Rounds ${roundNumbers.join("-")} questions`;
  return {
    ...blockBase(`rounds-${roundNumbers.join("-")}-questions`, "question_section", label),
    type: "question_section",
    config: { roundNumbers },
  };
}

function answerSectionBlock(roundNumbers: number[]): HostShowBlock {
  const label =
    roundNumbers.length === 1
      ? `Round ${roundNumbers[0]} answers`
      : `Rounds ${roundNumbers.join("-")} answers`;
  return {
    ...blockBase(`rounds-${roundNumbers.join("-")}-answers`, "answer_section", label),
    type: "answer_section",
    config: { roundNumbers },
  };
}

function breakBlock(
  type: "pre_break" | "break_countdown" | "post_break",
  breakNumber: 1 | 2,
  label: string,
  showTimerPlaceholder = false,
): HostShowBlock {
  return {
    ...blockBase(`${type}-${breakNumber}`, type, label),
    type,
    config: {
      breakNumber,
      accessCodePart: breakNumber === 1 ? "part1" : "part2",
      showTimerPlaceholder,
    },
  };
}

function dingbatBlock(
  type: "dingbat_question" | "dingbat_answer",
  label: string,
): HostShowBlock {
  return { ...blockBase(type, type, label), type };
}

function tiebreakBlock(): HostShowBlock {
  return { ...blockBase("tiebreak", "tiebreak", "Tiebreak"), type: "tiebreak" };
}

function weeklyShowOrder(quizType: "thursday" | "saturday"): HostShowOrder {
  return [
    simpleBlock("pre-quiz", "pre_quiz", "Pre Quiz"),
    simpleBlock("title-slide", "title_slide", "Title Slide"),
    roundIntroBlock(1, "questions"),
    questionSectionBlock([1]),
    roundIntroBlock(2, "questions"),
    questionSectionBlock([2]),
    roundIntroBlock(3, "questions"),
    questionSectionBlock([3]),
    breakBlock("pre_break", 1, "Pre Break 1"),
    breakBlock("break_countdown", 1, "Break Countdown 1", true),
    breakBlock("post_break", 1, "Post Break 1"),
    roundIntroBlock(1, "answers"),
    answerSectionBlock([1]),
    roundIntroBlock(2, "answers"),
    answerSectionBlock([2]),
    roundIntroBlock(3, "answers"),
    answerSectionBlock([3]),
    simpleBlock("round-4-reset", "round_reset", "Round 4 Reset"),
    roundIntroBlock(4, "questions"),
    questionSectionBlock([4]),
    roundIntroBlock(5, "questions"),
    questionSectionBlock([5]),
    breakBlock("pre_break", 2, "Pre Break 2"),
    breakBlock("break_countdown", 2, "Break Countdown 2", true),
    ...(quizType === "saturday"
      ? [
          dingbatBlock("dingbat_question", "Dingbat Question"),
          dingbatBlock("dingbat_answer", "Dingbat Answer"),
        ]
      : []),
    breakBlock("post_break", 2, "Post Break 2"),
    roundIntroBlock(4, "answers"),
    answerSectionBlock([4]),
    roundIntroBlock(5, "answers"),
    answerSectionBlock([5]),
    tiebreakBlock(),
    simpleBlock("quiz-end", "quiz_end", "Quiz End"),
  ];
}

function patreonShowOrder(roundCount = 5): HostShowOrder {
  const roundNumbers = Array.from(
    { length: Math.max(0, roundCount) },
    (_, index) => index + 1,
  );

  return [
    simpleBlock("pre-quiz", "pre_quiz", "Pre Quiz"),
    simpleBlock("title-slide", "title_slide", "Title Slide"),
    ...roundNumbers.flatMap((roundNumber) => [
      roundIntroBlock(roundNumber, "questions"),
      questionSectionBlock([roundNumber]),
    ]),
    ...roundNumbers.flatMap((roundNumber) => [
      roundIntroBlock(roundNumber, "answers"),
      answerSectionBlock([roundNumber]),
    ]),
    tiebreakBlock(),
    simpleBlock("quiz-end", "quiz_end", "Quiz End"),
  ];
}

export function getDefaultShowOrder(
  quizType: HostQuizType,
  roundCount = 5,
): HostShowOrder {
  if (quizType === "thursday" || quizType === "saturday") {
    return weeklyShowOrder(quizType);
  }
  return patreonShowOrder(roundCount);
}

function findRound(deck: HostDeck, roundNumber: number): HostRound | null {
  return deck.rounds[roundNumber - 1] ?? null;
}

function buildRoundQuestionSlides(
  round: HostRound,
): HostPresenterSlide[] {
  return round.questions.map((question) => ({
    id: `${question.id}-question`,
    type: "question",
    roundId: round.id,
    questionId: question.id,
  }));
}

function buildRoundAnswerSlides(round: HostRound): HostPresenterSlide[] {
  return round.questions.map((question) => ({
    id: `${question.id}-answer`,
    type: "answer",
    roundId: round.id,
    questionId: question.id,
  }));
}

function blockRoundNumbers(block: HostShowBlock): number[] {
  if (block.type !== "question_section" && block.type !== "answer_section") {
    return [];
  }
  return block.config.roundNumbers;
}

export function resolveHostShowOrder(deck: HostDeck): HostShowOrder {
  return deck.showOrder ?? getDefaultShowOrder(deck.quizType, deck.rounds.length);
}

export function buildHostSlidesFromShowOrder(
  deck: HostDeck,
  showOrder: HostShowOrder = resolveHostShowOrder(deck),
): HostPresenterSlide[] {
  return showOrder.flatMap((block): HostPresenterSlide[] => {
    if (!block.enabled) return [];

    switch (block.type) {
      case "pre_quiz":
        return [
          {
            id: block.id,
            type: "show-screen",
            screenType: "pre_quiz",
          },
        ];
      case "title_slide":
        return [{ id: block.id, type: "title" }];
      case "round_intro": {
        const round = findRound(deck, block.config.roundNumber);
        return round
          ? [{ id: block.id, type: "round-intro", roundId: round.id }]
          : [];
      }
      case "question_section":
        return blockRoundNumbers(block).flatMap((roundNumber) => {
          const round = findRound(deck, roundNumber);
          return round ? buildRoundQuestionSlides(round) : [];
        });
      case "answer_section":
        return blockRoundNumbers(block).flatMap((roundNumber) => {
          const round = findRound(deck, roundNumber);
          if (!round) return [];
          return [
            ...buildRoundAnswerSlides(round),
            ...(roundNumber === 4 && deck.connectionExplanation?.trim()
              ? [
                  {
                    id: `${deck.id}-connection-explanation`,
                    type: "connection-explanation" as const,
                  },
                ]
              : []),
          ];
        });
      case "pre_break":
      case "post_break":
        return [
          {
            id: block.id,
            type: "show-screen",
            screenType: block.type,
            accessCodePart: block.config.accessCodePart,
          },
        ];
      case "break_countdown":
        return [
          {
            id: block.id,
            type: "show-screen",
            screenType:
              block.config.breakNumber === 2 && deck.quizType === "saturday"
                ? "saturday_break_2"
                : "break_countdown",
            accessCodePart: block.config.accessCodePart,
          },
        ];
      case "round_reset":
        return [
          {
            id: block.id,
            type: "show-screen",
            screenType: "mid_quiz_reset",
          },
        ];
      case "dingbat_question":
        return deck.quizType === "saturday"
          ? [{ id: block.id, type: "dingbat-question" }]
          : [];
      case "dingbat_answer":
        return deck.quizType === "saturday"
          ? [{ id: block.id, type: "dingbat-answer" }]
          : [];
      case "tiebreak":
        return deck.tiebreaker
          ? [
              {
                id: `${deck.tiebreaker.id}-question`,
                type: "tiebreaker-question",
              },
              {
                id: `${deck.tiebreaker.id}-answer`,
                type: "tiebreaker-answer",
              },
            ]
          : [];
      case "quiz_end":
        return [
          {
            id: block.id,
            type: "show-screen",
            screenType: "quiz_end",
          },
        ];
    }
  });
}
