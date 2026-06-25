import type {
  HostDeck,
  HostQuizType,
  HostShowScreens,
} from "@/src/host-slides/types";

const WEEKLY_TICKER =
  "Follow me on Instagram for more quizzing! @thevirtualpubquiz";
const PATREON_TICKER =
  "Jay's Quiz Patreon special • Thank you for supporting the quiz";

export function getDefaultShowScreens(quizType: HostQuizType): HostShowScreens {
  if (quizType === "patreon") {
    return {
      preQuiz: {
        enabled: true,
        howToPlayText:
          "Grab a pen and paper, settle in, and play along with Jay's Patreon quiz.",
        recapText:
          "This is an exclusive Patreon quiz night. Thanks for supporting Jay's Quiz.",
        tickerText: PATREON_TICKER,
      },
      firstBreak: {
        enabled: true,
        titleText: "Back shortly with the next answers",
        bodyText:
          "Take a quick breather. Jay will be back shortly with the answer section.",
        tickerText: PATREON_TICKER,
      },
      secondBreak: {
        enabled: true,
        titleText: "Back shortly with the final answers",
        bodyText:
          "Nearly there. Jay will be back shortly with the final answer section.",
        tickerText: PATREON_TICKER,
      },
    };
  }

  return {
    preQuiz: {
      enabled: true,
      howToPlayText:
        "Grab a pen and paper. The quiz is split into rounds, with answers after each section.",
      recapText:
        "Missed a question? Visit quizhub.co.uk after the show for Quiz Recap.",
      tickerText: WEEKLY_TICKER,
    },
    firstBreak: {
      enabled: true,
      titleText: "Back shortly with the answers to Rounds 1-3",
      bodyText:
        "Grab a drink, check your answers, and get ready for the first answer section.",
      tickerText: WEEKLY_TICKER,
    },
    secondBreak: {
      enabled: quizType === "thursday",
      titleText: "Back shortly with the answers to Rounds 4-5",
      bodyText:
        "Final answers are coming up shortly. Keep your answer sheet handy! Don't forget to share your scores on Quiz Hub after the quiz!",
      tickerText: WEEKLY_TICKER,
    },
  };
}

export function resolveHostShowScreens(
  quizType: HostQuizType,
  showScreens: HostShowScreens | undefined,
): HostShowScreens {
  const defaults = getDefaultShowScreens(quizType);

  return {
    preQuiz: {
      ...defaults.preQuiz,
      ...showScreens?.preQuiz,
    },
    firstBreak: {
      ...defaults.firstBreak,
      ...showScreens?.firstBreak,
    },
    secondBreak: {
      ...defaults.secondBreak,
      ...showScreens?.secondBreak,
    },
  };
}

export type HostBreakAccessCodeResult =
  | { shouldShow: false }
  | { shouldShow: true; part: "Part 1" | "Part 2"; code: string | null };

export function getBreakAccessCode(
  deck: HostDeck,
  breakType: "first" | "second",
): HostBreakAccessCodeResult {
  if (deck.quizType === "patreon") return { shouldShow: false };

  const part = breakType === "first" ? "Part 1" : "Part 2";
  const code =
    breakType === "first"
      ? deck.quizRecapAccessCodes?.part1
      : deck.quizRecapAccessCodes?.part2;

  return {
    shouldShow: true,
    part,
    code: code?.trim() ? code : null,
  };
}
