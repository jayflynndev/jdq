import type {
  HostDeck,
  HostQuizType,
  HostShowScreens,
  HostShowScreenTextSettings,
} from "@/src/host-slides/types";

const WEEKLY_TICKER =
  "Visit quizhub.co.uk for Quiz Recap and follow @thevirtualpubquiz";
const PATREON_TICKER =
  "Jay's Quiz Patreon special - Thank you for supporting the quiz";

function screen(
  enabled: boolean,
  titleText: string,
  bodyText: string,
  tickerText: string,
): HostShowScreenTextSettings {
  return { enabled, titleText, bodyText, tickerText };
}

export function getDefaultShowScreens(quizType: HostQuizType): HostShowScreens {
  if (quizType === "patreon") {
    return {
      blank: screen(false, "", "", PATREON_TICKER),
      preRoll: screen(
        false,
        "Patreon quiz starting soon",
        "Jay will be live shortly. Thanks for supporting the quiz.",
        PATREON_TICKER,
      ),
      preQuiz: {
        enabled: true,
        titleText: "Patreon quiz starting soon",
        bodyText:
          "Grab a pen and paper, settle in, and play along with Jay's Patreon quiz.",
        tickerText: PATREON_TICKER,
      },
      preBreak: screen(
        true,
        "A quick pause before the answers",
        "Jay will talk you through the next part of the Patreon quiz shortly.",
        PATREON_TICKER,
      ),
      breakCountdown: screen(
        true,
        "Back shortly with the next answers",
        "Take a quick breather. Jay will be back shortly with the answer section.",
        PATREON_TICKER,
      ),
      postBreak: screen(
        true,
        "Welcome back",
        "Jay is back with the answers. Keep your answer sheet handy.",
        PATREON_TICKER,
      ),
      midQuizReset: screen(
        false,
        "Resetting for the next round",
        "Jay will be back shortly with the next section.",
        PATREON_TICKER,
      ),
      saturdayBreak2: screen(
        false,
        "Back shortly",
        "Jay will be back shortly with the next section.",
        PATREON_TICKER,
      ),
      quizEnd: screen(
        false,
        "Thanks for playing",
        "Thanks for joining Jay's Patreon quiz.",
        PATREON_TICKER,
      ),
    };
  }

  return {
    blank: screen(false, "", "", WEEKLY_TICKER),
    preRoll: screen(
      false,
      "Jay's Quiz starts soon",
      "The stream will begin shortly. Grab a pen and paper and settle in.",
      WEEKLY_TICKER,
    ),
    preQuiz: {
      enabled: true,
      titleText: "Jay's Quiz starts soon",
      bodyText:
        "Grab a pen and paper. The quiz is split into rounds, with answers after each section. Visit quizhub.co.uk after the show for Quiz Recap.",
      tickerText: WEEKLY_TICKER,
    },
    preBreak: screen(
      true,
      "Answers to Rounds 1-3 coming up",
      "Jay will talk you into the first answer section. Get your Part 1 answers ready.",
      WEEKLY_TICKER,
    ),
    breakCountdown: screen(
      true,
      "Back shortly with the answers to Rounds 1-3",
      "Grab a drink, check your answers, and get ready for the first answer section.",
      WEEKLY_TICKER,
    ),
    postBreak: screen(
      true,
      "Welcome back",
      "Jay is back with the answers to Rounds 1-3. Keep your Part 1 access code handy.",
      WEEKLY_TICKER,
    ),
    midQuizReset: screen(
      true,
      "Resetting for Round 4",
      "Jay is getting ready for the next part of the quiz. Keep your answer sheet handy.",
      WEEKLY_TICKER,
    ),
    saturdayBreak2: screen(
      quizType === "saturday",
      "Saturday Break 2",
      "Jay will be back shortly with Dingbats and the final answers. Keep your Part 2 code handy.",
      WEEKLY_TICKER,
    ),
    quizEnd: screen(
      true,
      "Thanks for playing",
      "Share your score on QuizHub and join Jay again for the next quiz.",
      WEEKLY_TICKER,
    ),
  };
}

export function resolveHostShowScreens(
  quizType: HostQuizType,
  showScreens: HostShowScreens | undefined,
): HostShowScreens {
  const defaults = getDefaultShowScreens(quizType);

  return {
    blank: {
      ...defaults.blank,
      ...showScreens?.blank,
    },
    preRoll: {
      ...defaults.preRoll,
      ...showScreens?.preRoll,
    },
    preQuiz: {
      ...defaults.preQuiz,
      ...showScreens?.preQuiz,
    },
    preBreak: {
      ...defaults.preBreak,
      ...showScreens?.preBreak,
    },
    breakCountdown: {
      ...defaults.breakCountdown,
      ...showScreens?.breakCountdown,
    },
    postBreak: {
      ...defaults.postBreak,
      ...showScreens?.postBreak,
    },
    midQuizReset: {
      ...defaults.midQuizReset,
      ...showScreens?.midQuizReset,
    },
    saturdayBreak2: {
      ...defaults.saturdayBreak2,
      ...showScreens?.saturdayBreak2,
    },
    quizEnd: {
      ...defaults.quizEnd,
      ...showScreens?.quizEnd,
    },
  };
}

export type HostBreakAccessCodeResult =
  | { shouldShow: false }
  | { shouldShow: true; part: "Part 1" | "Part 2"; code: string | null };

export function getBreakAccessCode(
  deck: HostDeck,
  part: "part1" | "part2",
): HostBreakAccessCodeResult {
  if (deck.quizType === "patreon") return { shouldShow: false };

  const label = part === "part1" ? "Part 1" : "Part 2";
  const code =
    part === "part1"
      ? deck.quizRecapAccessCodes?.part1
      : deck.quizRecapAccessCodes?.part2;

  return {
    shouldShow: true,
    part: label,
    code: code?.trim() ? code : null,
  };
}
