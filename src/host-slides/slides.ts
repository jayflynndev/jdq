import type {
  HostDeck,
  PatreonHostDeck,
  HostPresenterSlide,
  HostRound,
  WeeklyHostDeck,
} from "@/src/host-slides/types";

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
  const connectionExplanation: HostPresenterSlide[] =
    deck.connectionExplanation?.trim()
      ? [
          {
            id: `${deck.id}-connection-explanation`,
            type: "connection-explanation",
          },
        ]
      : [];
  const secondBreak: HostPresenterSlide[] =
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
    { id: `${deck.id}-title`, type: "title" },
    ...buildRoundSection(round1),
    ...buildRoundSection(round2),
    ...buildRoundSection(round3),
    ...buildRoundAnswerSection(round1),
    ...buildRoundAnswerSection(round2),
    ...buildRoundAnswerSection(round3),
    ...buildRoundSection(round4),
    ...buildRoundSection(round5),
    ...secondBreak,
    ...buildRoundAnswerSection(round4),
    ...connectionExplanation,
    ...buildRoundAnswerSection(round5),
    ...tiebreakSlides,
  ];
}

function buildPatreonSequence(deck: PatreonHostDeck): HostPresenterSlide[] {
  const slides: HostPresenterSlide[] = [
    { id: `${deck.id}-title`, type: "title" },
  ];

  deck.rounds.forEach((round) => {
    slides.push(...buildRoundSection(round));
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
