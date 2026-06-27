export type PresenterControlState = {
  deckId: string;
  currentIndex: number;
  maxIndex: number;
  commandCounter: number;
  updatedAt: string;
};

export type PresenterControlAction =
  | "next"
  | "previous"
  | "go_to_pre_quiz"
  | "go_to_quiz_start"
  | "go_to_first_break"
  | "go_to_first_break_countdown"
  | "go_to_after_first_break"
  | "go_to_round_1_answers"
  | "go_to_round_4_reset"
  | "go_to_round_4_questions"
  | "go_to_second_break"
  | "go_to_second_break_countdown"
  | "go_to_after_second_break"
  | "go_to_dingbats"
  | "go_to_round_4_answers"
  | "go_to_quiz_end";

export const PRESENTER_CONTROL_ACTIONS: readonly PresenterControlAction[] = [
  "next",
  "previous",
  "go_to_pre_quiz",
  "go_to_quiz_start",
  "go_to_first_break",
  "go_to_first_break_countdown",
  "go_to_after_first_break",
  "go_to_round_1_answers",
  "go_to_round_4_reset",
  "go_to_round_4_questions",
  "go_to_second_break",
  "go_to_second_break_countdown",
  "go_to_after_second_break",
  "go_to_dingbats",
  "go_to_round_4_answers",
  "go_to_quiz_end",
] as const;

type PresenterActionSlide = {
  id: string;
  type: string;
  screenType?: string;
  accessCodePart?: "part1" | "part2";
};

export type PresenterActionResolveResult =
  | { ok: true; index: number }
  | { ok: false; message: string };

export function isPresenterControlAction(
  value: unknown,
): value is PresenterControlAction {
  return (
    typeof value === "string" &&
    PRESENTER_CONTROL_ACTIONS.includes(value as PresenterControlAction)
  );
}

function findSlideIndex(
  slides: readonly PresenterActionSlide[],
  predicate: (slide: PresenterActionSlide) => boolean,
): number | null {
  const index = slides.findIndex(predicate);
  return index >= 0 ? index : null;
}

export function resolvePresenterShowActionIndex(
  slides: readonly PresenterActionSlide[],
  action: Exclude<PresenterControlAction, "next" | "previous">,
): PresenterActionResolveResult {
  const targetIndex = (() => {
    switch (action) {
      case "go_to_pre_quiz":
        return findSlideIndex(
          slides,
          (slide) =>
            slide.type === "show-screen" && slide.screenType === "pre_quiz",
        );
      case "go_to_quiz_start":
        return findSlideIndex(slides, (slide) => slide.type === "title");
      case "go_to_first_break":
        return findSlideIndex(slides, (slide) => slide.id === "pre_break-1");
      case "go_to_first_break_countdown":
        return findSlideIndex(
          slides,
          (slide) => slide.id === "break_countdown-1",
        );
      case "go_to_after_first_break":
        return findSlideIndex(slides, (slide) => slide.id === "post_break-1");
      case "go_to_round_1_answers":
        return findSlideIndex(
          slides,
          (slide) => slide.id === "round-1-answers-intro",
        );
      case "go_to_round_4_reset":
        return findSlideIndex(
          slides,
          (slide) =>
            slide.type === "show-screen" &&
            slide.screenType === "mid_quiz_reset",
        );
      case "go_to_round_4_questions":
        return findSlideIndex(
          slides,
          (slide) => slide.id === "round-4-questions-intro",
        );
      case "go_to_second_break":
        return findSlideIndex(slides, (slide) => slide.id === "pre_break-2");
      case "go_to_second_break_countdown":
        return findSlideIndex(
          slides,
          (slide) => slide.id === "break_countdown-2",
        );
      case "go_to_after_second_break":
        return findSlideIndex(slides, (slide) => slide.id === "post_break-2");
      case "go_to_dingbats":
        return findSlideIndex(
          slides,
          (slide) => slide.type === "dingbat-question",
        );
      case "go_to_round_4_answers":
        return findSlideIndex(
          slides,
          (slide) => slide.id === "round-4-answers-intro",
        );
      case "go_to_quiz_end":
        return findSlideIndex(
          slides,
          (slide) =>
            slide.type === "show-screen" && slide.screenType === "quiz_end",
        );
    }
  })();

  if (targetIndex === null) {
    return {
      ok: false,
      message: `Presenter action ${action} is not available for this deck or show order.`,
    };
  }

  return { ok: true, index: targetIndex };
}

export type PresenterControlSnapshot = Pick<
  PresenterControlState,
  "currentIndex" | "maxIndex" | "commandCounter"
>;

export function clampSlideIndex(index: number, maxIndex: number): number {
  const safeMax = Math.max(0, Math.floor(maxIndex));
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.floor(index)), safeMax);
}

export function nextPresenterControlState(
  state: PresenterControlSnapshot,
): PresenterControlSnapshot {
  return {
    ...state,
    currentIndex: clampSlideIndex(state.currentIndex + 1, state.maxIndex),
    commandCounter: state.commandCounter + 1,
  };
}

export function previousPresenterControlState(
  state: PresenterControlSnapshot,
): PresenterControlSnapshot {
  return {
    ...state,
    currentIndex: clampSlideIndex(state.currentIndex - 1, state.maxIndex),
    commandCounter: state.commandCounter + 1,
  };
}

export function setPresenterControlState(
  state: PresenterControlSnapshot,
  currentIndex: number,
  maxIndex: number,
): PresenterControlSnapshot {
  const safeMax = Math.max(0, Math.floor(maxIndex));
  return {
    currentIndex: clampSlideIndex(currentIndex, safeMax),
    maxIndex: safeMax,
    commandCounter: state.commandCounter + 1,
  };
}

export function isPresenterControlTokenConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env.HOST_SLIDES_PRESENTER_CONTROL_TOKEN?.trim());
}

export function hasValidPresenterControlToken(
  suppliedToken: string | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const configuredToken = env.HOST_SLIDES_PRESENTER_CONTROL_TOKEN?.trim();
  if (!configuredToken) return true;
  return suppliedToken === configuredToken;
}
