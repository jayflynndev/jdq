import type { HostDeck } from "@/src/host-slides/types";
import { validateHostDeck } from "@/src/host-slides/validation";

export type HostDeckReadiness = {
  pictureQuestionCount: number;
  missingImageCount: number;
  tiebreakerSet: boolean;
  validationWarningCount: number;
  showReady: boolean;
  needsReview: boolean;
};

export function getHostDeckReadiness(
  deck: HostDeck,
): HostDeckReadiness {
  const validation = validateHostDeck(deck);
  const questions = [
    ...deck.rounds.flatMap((round) => round.questions),
    ...(deck.tiebreaker ? [deck.tiebreaker] : []),
  ];
  const pictureQuestionCount = questions.filter((question) =>
    Boolean(
      question.imagePlaceholder ||
        question.imageStoragePath ||
        question.imageUrl,
    ),
  ).length;
  const tiebreakerSet = Boolean(deck.tiebreaker);
  const nonInformationalWarnings = validation.warnings.filter(
    (warning) => warning !== "Tiebreak not set",
  );
  const structuralWarningCount =
    validation.missingAnswers.length +
    validation.emptyQuestions.length +
    validation.picturesMissingImages.length +
    validation.missingDingbatImages.length +
    validation.missingDingbatAnswers.length +
    validation.wrongRoundSizes.length +
    (validation.wrongRoundCount ? 1 : 0);
  const validationWarningCount =
    structuralWarningCount + nonInformationalWarnings.length;
  const showReady = deck.status === "ready";

  return {
    pictureQuestionCount,
    missingImageCount:
      validation.picturesMissingImages.length +
      validation.missingDingbatImages.length,
    tiebreakerSet,
    validationWarningCount,
    showReady,
    needsReview: validationWarningCount > 0,
  };
}
