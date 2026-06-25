import type {
  HostDeck,
  PatreonHostDeck,
  HostPresenterSlide,
  HostRound,
  WeeklyHostDeck,
} from "@/src/host-slides/types";
import { resolveHostShowScreens } from "@/src/host-slides/showScreens";

function buildRoundQuestionSlides(round: HostRound): HostPresenterSlide[] {
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

function buildRoundSection(round: HostRound): HostPresenterSlide[] {
  return [
    { id: `${round.id}-intro`, type: "round-intro", roundId: round.id },
    ...buildRoundQuestionSlides(round),
  ];
}

function buildRoundAnswerSection(round: HostRound): HostPresenterSlide[] {
  return [
    { id: `${round.id}-answers-intro`, type: "round-intro", roundId: round.id },
    ...buildRoundAnswerSlides(round),
  ];
}

function buildWeeklySequence(deck: WeeklyHostDeck): HostPresenterSlide[] {
  const [round1, round2, round3, round4, round5] = deck.rounds;
  const showScreens = resolveHostShowScreens(
    deck.quizType,
    deck.showScreens,
  );
  const openingShowScreens: HostPresenterSlide[] = [
    ...(showScreens.blank.enabled
      ? [
          {
            id: `${deck.id}-blank`,
            type: "show-screen",
            screenType: "blank",
          } as const,
        ]
      : []),
    ...(showScreens.preRoll.enabled
      ? [
          {
            id: `${deck.id}-pre-roll`,
            type: "show-screen",
            screenType: "pre_roll",
          } as const,
        ]
      : []),
    ...(showScreens.preQuiz.enabled
      ? [
          {
            id: `${deck.id}-pre-quiz`,
            type: "show-screen",
            screenType: "pre_quiz",
          } as const,
        ]
      : []),
  ];
  const firstBreakSlides: HostPresenterSlide[] = [
    ...(showScreens.preBreak.enabled
      ? [
          {
            id: `${deck.id}-pre-break`,
            type: "show-screen",
            screenType: "pre_break",
            accessCodePart: "part1",
          } as const,
        ]
      : []),
    ...(showScreens.breakCountdown.enabled
      ? [
          {
            id: `${deck.id}-break-countdown`,
            type: "show-screen",
            screenType: "break_countdown",
            accessCodePart: "part1",
          } as const,
        ]
      : []),
    ...(showScreens.postBreak.enabled
      ? [
          {
            id: `${deck.id}-post-break`,
            type: "show-screen",
            screenType: "post_break",
            accessCodePart: "part1",
          } as const,
        ]
      : []),
  ];
  const secondBreakSlides: HostPresenterSlide[] =
    deck.quizType === "saturday" && showScreens.saturdayBreak2.enabled
      ? [
          {
            id: `${deck.id}-saturday-break-2`,
            type: "show-screen",
            screenType: "saturday_break_2",
            accessCodePart: "part2",
          },
        ]
      : [];
  const midQuizResetSlides: HostPresenterSlide[] =
    showScreens.midQuizReset.enabled
      ? [
          {
            id: `${deck.id}-mid-quiz-reset`,
            type: "show-screen",
            screenType: "mid_quiz_reset",
          },
        ]
      : [];
  const quizEndSlides: HostPresenterSlide[] = showScreens.quizEnd.enabled
    ? [
        {
          id: `${deck.id}-quiz-end`,
          type: "show-screen",
          screenType: "quiz_end",
        },
      ]
    : [];
  const connectionExplanation: HostPresenterSlide[] =
    deck.connectionExplanation?.trim()
      ? [
          {
            id: `${deck.id}-connection-explanation`,
            type: "connection-explanation",
          },
        ]
      : [];
  const dingbatSlides: HostPresenterSlide[] =
    deck.quizType === "saturday"
      ? [
          { id: `${deck.id}-dingbat-question`, type: "dingbat-question" },
          { id: `${deck.id}-dingbat-answer`, type: "dingbat-answer" },
        ]
      : [];
  const tiebreakSlides: HostPresenterSlide[] = deck.tiebreaker
    ? [
        {
          id: `${deck.tiebreaker.id}-question`,
          type: "tiebreaker-question",
        },
        { id: `${deck.tiebreaker.id}-answer`, type: "tiebreaker-answer" },
      ]
    : [];

  return [
    ...openingShowScreens,
    { id: `${deck.id}-title`, type: "title" },
    ...buildRoundSection(round1),
    ...buildRoundSection(round2),
    ...buildRoundSection(round3),
    ...firstBreakSlides,
    ...buildRoundAnswerSection(round1),
    ...buildRoundAnswerSection(round2),
    ...buildRoundAnswerSection(round3),
    ...midQuizResetSlides,
    ...buildRoundSection(round4),
    ...buildRoundSection(round5),
    ...secondBreakSlides,
    ...dingbatSlides,
    ...buildRoundAnswerSection(round4),
    ...connectionExplanation,
    ...buildRoundAnswerSection(round5),
    ...tiebreakSlides,
    ...quizEndSlides,
  ];
}

function buildPatreonSequence(deck: PatreonHostDeck): HostPresenterSlide[] {
  const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
  const slides: HostPresenterSlide[] = [
    ...(showScreens.preQuiz.enabled
      ? [
          {
            id: `${deck.id}-pre-quiz`,
            type: "show-screen",
            screenType: "pre_quiz",
          } as const,
        ]
      : []),
    { id: `${deck.id}-title`, type: "title" },
  ];

  deck.rounds.forEach((round, roundIndex) => {
    slides.push(...buildRoundSection(round));
    if (showScreens.breakCountdown.enabled && roundIndex === 2) {
      slides.push({
        id: `${deck.id}-first-break`,
        type: "show-screen",
        screenType: "break_countdown",
      });
    }
    if (showScreens.saturdayBreak2.enabled && roundIndex === 4) {
      slides.push({
        id: `${deck.id}-second-break`,
        type: "show-screen",
        screenType: "saturday_break_2",
      });
    }
    slides.push(...buildRoundAnswerSection(round));
  });

  return slides;
}

export function buildHostSlideSequence(deck: HostDeck): HostPresenterSlide[] {
  switch (deck.quizType) {
    case "thursday":
    case "saturday":
      return buildWeeklySequence(deck);
    case "patreon":
      return buildPatreonSequence(deck);
  }
}
