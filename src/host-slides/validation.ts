import type {
  HostDeck,
  HostDingbatSet,
  HostQuestion,
  HostRound,
} from "@/src/host-slides/types";

export type MissingAnswerIssue = {
  roundNumber: number;
  questionNumber: number;
};

export type WrongRoundSizeIssue = {
  roundNumber: number;
  roundTitle: string;
  expected: number;
  actual: number;
};

export type EmptyQuestionIssue = {
  roundNumber: number;
  questionNumber: number;
};

export type MissingPictureIssue = {
  roundNumber: number;
  questionNumber: number;
};

export type WrongRoundCountIssue = {
  expected: number;
  actual: number;
};

export type HostDeckValidationInput = {
  quizType: HostDeck["quizType"];
  rounds: readonly HostRound[];
  tiebreaker?: HostQuestion;
  dingbats?: HostDingbatSet;
};

export type HostDeckValidationSummary = {
  missingAnswers: MissingAnswerIssue[];
  emptyQuestions: EmptyQuestionIssue[];
  picturesMissingImages: MissingPictureIssue[];
  missingDingbatImages: number[];
  missingDingbatAnswers: number[];
  wrongRoundCount: WrongRoundCountIssue | null;
  wrongRoundSizes: WrongRoundSizeIssue[];
  warnings: string[];
};

export function validateHostDeck(
  deck: HostDeckValidationInput,
): HostDeckValidationSummary {
  const missingAnswers: MissingAnswerIssue[] = [];
  const emptyQuestions: EmptyQuestionIssue[] = [];
  const picturesMissingImages: MissingPictureIssue[] = [];
  const wrongRoundSizes: WrongRoundSizeIssue[] = [];
  const missingDingbatImages: number[] = [];
  const missingDingbatAnswers: number[] = [];

  deck.rounds.forEach((round, roundIndex) => {
    if (round.questions.length !== 10) {
      wrongRoundSizes.push({
        roundNumber: roundIndex + 1,
        roundTitle: round.title,
        expected: 10,
        actual: round.questions.length,
      });
    }

    round.questions.forEach((question, questionIndex) => {
      if (!question.answer.trim()) {
        missingAnswers.push({
          roundNumber: roundIndex + 1,
          questionNumber: questionIndex + 1,
        });
      }
      if (!question.prompt.trim()) {
        emptyQuestions.push({
          roundNumber: roundIndex + 1,
          questionNumber: questionIndex + 1,
        });
      }
      if (
        question.imagePlaceholder &&
        !question.imageUrl &&
        !question.imageStoragePath
      ) {
        picturesMissingImages.push({
          roundNumber: roundIndex + 1,
          questionNumber: questionIndex + 1,
        });
      }
    });
  });

  const warnings: string[] = [];
  if (deck.rounds.some((round) => !round.title.trim())) {
    warnings.push("One or more rounds have no title.");
  }
  if (!deck.tiebreaker) warnings.push("Tiebreak not set");

  if (deck.quizType === "saturday") {
    const items = deck.dingbats?.items ?? [];
    for (let position = 1; position <= 6; position += 1) {
      const item = items.find((candidate) => candidate.position === position);
      if (!item?.imageStoragePath && !item?.imageUrl) {
        missingDingbatImages.push(position);
      }
      if (!item?.answer.trim()) missingDingbatAnswers.push(position);
    }
  }

  return {
    missingAnswers,
    emptyQuestions,
    picturesMissingImages,
    missingDingbatImages,
    missingDingbatAnswers,
    wrongRoundCount:
      deck.quizType !== "patreon" && deck.rounds.length !== 5
        ? { expected: 5, actual: deck.rounds.length }
        : null,
    wrongRoundSizes,
    warnings,
  };
}
