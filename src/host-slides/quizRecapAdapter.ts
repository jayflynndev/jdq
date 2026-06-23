import type { HostDeck, WeeklyHostDeck } from "@/src/host-slides/types";

export interface QuizRecapImage {
  label: string;
  url: string;
}

export interface QuizRecapRound {
  round: number;
  questions: string[];
}

export interface QuizRecapPart {
  rounds: QuizRecapRound[];
  images: QuizRecapImage[];
}

export interface QuizRecapDraft {
  quiz_day: "Thursday" | "Saturday";
  quiz_date: string;
  parts: {
    part1: QuizRecapPart;
    part2: QuizRecapPart;
  };
}

export type QuizRecapImageUrlResolver = (storagePath: string) => string;

export class UnsupportedQuizRecapDeckError extends Error {
  constructor(quizType: HostDeck["quizType"]) {
    super(`${quizType} Host Slides decks cannot publish to Quiz Recap.`);
    this.name = "UnsupportedQuizRecapDeckError";
  }
}

function mapPart(
  deck: WeeklyHostDeck,
  roundIndexes: readonly number[],
  resolveImageUrl: QuizRecapImageUrlResolver,
  preferPreviewUrl: boolean,
): QuizRecapPart {
  const rounds = roundIndexes.map((roundIndex) => {
    const round = deck.rounds[roundIndex];

    return {
      round: roundIndex + 1,
      questions: round.questions.map((question) => question.prompt),
    };
  });

  const images = roundIndexes.flatMap((roundIndex) =>
    deck.rounds[roundIndex].questions.flatMap((question, questionIndex) => {
      const url =
        preferPreviewUrl && question.imageUrl
          ? question.imageUrl
          : question.imageStoragePath
            ? resolveImageUrl(question.imageStoragePath)
            : undefined;

      return url
        ? [
            {
              label: `Round ${roundIndex + 1} Question ${questionIndex + 1}`,
              url,
            },
          ]
        : [];
    }),
  );

  return { rounds, images };
}

/**
 * Converts reviewed weekly Host Slides data into the question-only structure
 * consumed by Quiz Recap. Answers, tiebreaks and Saturday Dingbats are
 * intentionally outside the recap product boundary.
 */
export function createQuizRecapDraft(
  deck: HostDeck,
  resolveImageUrl: QuizRecapImageUrlResolver,
): QuizRecapDraft {
  if (deck.quizType === "patreon") {
    throw new UnsupportedQuizRecapDeckError(deck.quizType);
  }

  return {
    quiz_day: deck.quizType === "thursday" ? "Thursday" : "Saturday",
    quiz_date: deck.quizDate,
    parts: {
      part1: mapPart(deck, [0, 1, 2], resolveImageUrl, false),
      part2: mapPart(deck, [3, 4], resolveImageUrl, false),
    },
  };
}

/**
 * Builds the same question-only recap shape for the editor review, while
 * allowing current local/data URL previews. Publishing must continue to use
 * createQuizRecapDraft so only persisted storage paths cross that boundary.
 */
export function createQuizRecapReviewDraft(
  deck: HostDeck,
  resolveImageUrl: QuizRecapImageUrlResolver,
): QuizRecapDraft {
  if (deck.quizType === "patreon") {
    throw new UnsupportedQuizRecapDeckError(deck.quizType);
  }

  return {
    quiz_day: deck.quizType === "thursday" ? "Thursday" : "Saturday",
    quiz_date: deck.quizDate,
    parts: {
      part1: mapPart(deck, [0, 1, 2], resolveImageUrl, true),
      part2: mapPart(deck, [3, 4], resolveImageUrl, true),
    },
  };
}
