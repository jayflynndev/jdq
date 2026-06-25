export type HostQuizType = "thursday" | "saturday" | "patreon";

export type HostDeckStatus = "draft" | "ready";

export interface HostQuestion {
  id: string;
  prompt: string;
  answer: string;
  imageUrl?: string;
  imageStoragePath?: string;
  imagePlaceholder?: string;
}

export interface HostRound {
  id: string;
  title: string;
  questions: HostQuestion[];
}

export interface HostDingbatItem {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  answer: string;
  imageStoragePath?: string;
  imageUrl?: string;
}

export type HostDingbatItems = [
  HostDingbatItem,
  HostDingbatItem,
  HostDingbatItem,
  HostDingbatItem,
  HostDingbatItem,
  HostDingbatItem,
];

export interface HostDingbatSet {
  items: HostDingbatItems;
}

export interface HostPreQuizScreenSettings {
  enabled: boolean;
  titleText: string;
  bodyText: string;
  tickerText: string;
}

export interface HostShowScreenTextSettings {
  enabled: boolean;
  titleText: string;
  bodyText: string;
  tickerText: string;
}

export type HostShowScreenType =
  | "blank"
  | "pre_roll"
  | "pre_quiz"
  | "pre_break"
  | "break_countdown"
  | "post_break"
  | "mid_quiz_reset"
  | "saturday_break_2"
  | "quiz_end";

export interface HostShowScreens {
  blank: HostShowScreenTextSettings;
  preRoll: HostShowScreenTextSettings;
  preQuiz: HostPreQuizScreenSettings;
  preBreak: HostShowScreenTextSettings;
  breakCountdown: HostShowScreenTextSettings;
  postBreak: HostShowScreenTextSettings;
  midQuizReset: HostShowScreenTextSettings;
  saturdayBreak2: HostShowScreenTextSettings;
  quizEnd: HostShowScreenTextSettings;
}

export interface HostQuizRecapAccessCodes {
  part1?: string;
  part2?: string;
}

export type HostShowBlockType =
  | "pre_quiz"
  | "title_slide"
  | "round_intro"
  | "question_section"
  | "answer_section"
  | "pre_break"
  | "break_countdown"
  | "post_break"
  | "round_reset"
  | "dingbat_question"
  | "dingbat_answer"
  | "tiebreak"
  | "quiz_end";

export interface HostRoundIntroBlockConfig {
  roundNumber: number;
}

export interface HostSectionBlockConfig {
  roundNumbers: number[];
}

export interface HostBreakBlockConfig {
  breakNumber: 1 | 2;
  accessCodePart?: "part1" | "part2";
  showTimerPlaceholder?: boolean;
}

export type HostShowBlock =
  | {
      id: string;
      type: "pre_quiz" | "title_slide" | "round_reset" | "quiz_end";
      label: string;
      enabled: boolean;
    }
  | {
      id: string;
      type: "round_intro";
      label: string;
      enabled: boolean;
      config: HostRoundIntroBlockConfig;
    }
  | {
      id: string;
      type: "question_section" | "answer_section";
      label: string;
      enabled: boolean;
      config: HostSectionBlockConfig;
    }
  | {
      id: string;
      type: "pre_break" | "break_countdown" | "post_break";
      label: string;
      enabled: boolean;
      config: HostBreakBlockConfig;
    }
  | {
      id: string;
      type: "dingbat_question" | "dingbat_answer" | "tiebreak";
      label: string;
      enabled: boolean;
    };

export type HostShowOrder = HostShowBlock[];

interface HostDeckBase {
  id: string;
  title: string;
  quizDate: string;
  status: HostDeckStatus;
  showScreens?: HostShowScreens;
  showOrder?: HostShowOrder;
  quizRecapAccessCodes?: HostQuizRecapAccessCodes;
  connectionExplanation?: string;
  linkedQuizRecapId?: string;
  quizRecapLastPublishedAt?: string;
}

export interface ThursdayHostDeck extends HostDeckBase {
  quizType: "thursday";
  rounds: [HostRound, HostRound, HostRound, HostRound, HostRound];
  tiebreaker?: HostQuestion;
}

export interface SaturdayHostDeck extends HostDeckBase {
  quizType: "saturday";
  rounds: [HostRound, HostRound, HostRound, HostRound, HostRound];
  tiebreaker?: HostQuestion;
  dingbats?: HostDingbatSet;
}

export type WeeklyHostDeck = ThursdayHostDeck | SaturdayHostDeck;

export interface PatreonHostDeck extends HostDeckBase {
  quizType: "patreon";
  rounds: HostRound[];
  tiebreaker?: HostQuestion;
}

export type HostDeck = WeeklyHostDeck | PatreonHostDeck;

export type HostPresenterSlide =
  | {
      id: string;
      type: "show-screen";
      screenType: HostShowScreenType;
      accessCodePart?: "part1" | "part2";
    }
  | { id: string; type: "title" }
  | { id: string; type: "round-intro"; roundId: string }
  | { id: string; type: "question"; roundId: string; questionId: string }
  | { id: string; type: "answer"; roundId: string; questionId: string }
  | { id: string; type: "connection-explanation" }
  | { id: string; type: "dingbat-question" }
  | { id: string; type: "dingbat-answer" }
  | { id: string; type: "tiebreaker-question" }
  | { id: string; type: "tiebreaker-answer" };

export function createEmptyDingbatSet(): HostDingbatSet {
  return {
    items: [1, 2, 3, 4, 5, 6].map((position) => ({
      position: position as HostDingbatItem["position"],
      answer: "",
    })) as HostDingbatItems,
  };
}
