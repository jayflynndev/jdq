import type {
  HostDeck,
  HostPresenterSlide,
  HostQuestion,
} from "@/src/host-slides/types";

function questionImageUrl(
  deck: HostDeck,
  roundId: string,
  questionId: string,
): string[] {
  const question = deck.rounds
    .find((round) => round.id === roundId)
    ?.questions.find((candidate) => candidate.id === questionId);
  return question?.imageUrl ? [question.imageUrl] : [];
}

function tiebreakImageUrl(question: HostQuestion | undefined): string[] {
  return question?.imageUrl ? [question.imageUrl] : [];
}

export function getPresenterSlideImageUrls(
  deck: HostDeck,
  slide: HostPresenterSlide,
): string[] {
  switch (slide.type) {
    case "question":
    case "answer":
      return questionImageUrl(deck, slide.roundId, slide.questionId);
    case "dingbat-question":
    case "dingbat-answer":
      return deck.quizType === "saturday"
        ? [
            ...new Set(
              (deck.dingbats?.items ?? [])
                .map((item) => item.imageUrl)
                .filter((url): url is string => Boolean(url)),
            ),
          ]
        : [];
    case "tiebreaker-question":
    case "tiebreaker-answer":
      return tiebreakImageUrl(deck.tiebreaker);
    case "title":
    case "round-intro":
      return [];
  }
}

export function getPresenterPreloadUrls(
  deck: HostDeck,
  slides: readonly HostPresenterSlide[],
  currentIndex: number,
  lookaheadSlides = 5,
): string[] {
  const safeIndex = Math.max(0, currentIndex);
  const preloadSlides = slides.slice(
    safeIndex,
    safeIndex + Math.max(0, lookaheadSlides) + 1,
  );

  return [
    ...new Set(
      preloadSlides.flatMap((slide) =>
        getPresenterSlideImageUrls(deck, slide),
      ),
    ),
  ];
}
