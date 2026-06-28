import { describe, expect, it } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import { resolveHostShowOrder } from "@/src/host-slides/showOrder";
import type { HostDeck, HostShowBlock } from "@/src/host-slides/types";
import {
  clampSlideIndex,
  hasValidPresenterControlToken,
  nextPresenterControlState,
  previousPresenterControlState,
  resolvePresenterShowActionIndex,
  setPresenterControlState,
} from "@/src/host-slides/presenterControl";

function deck(quizType: HostDeck["quizType"]): HostDeck {
  const subject = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!subject) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(subject);
}

describe("presenter control state", () => {
  it("increments next and clamps at the final slide", () => {
    expect(
      nextPresenterControlState({
        currentIndex: 2,
        maxIndex: 3,
        commandCounter: 7,
      }),
    ).toEqual({ currentIndex: 3, maxIndex: 3, commandCounter: 8 });

    expect(
      nextPresenterControlState({
        currentIndex: 3,
        maxIndex: 3,
        commandCounter: 8,
      }),
    ).toEqual({ currentIndex: 3, maxIndex: 3, commandCounter: 9 });
  });

  it("decrements previous and clamps at zero", () => {
    expect(
      previousPresenterControlState({
        currentIndex: 1,
        maxIndex: 3,
        commandCounter: 4,
      }),
    ).toEqual({ currentIndex: 0, maxIndex: 3, commandCounter: 5 });

    expect(
      previousPresenterControlState({
        currentIndex: 0,
        maxIndex: 3,
        commandCounter: 5,
      }),
    ).toEqual({ currentIndex: 0, maxIndex: 3, commandCounter: 6 });
  });

  it("clamps explicit presenter state updates", () => {
    expect(clampSlideIndex(99, 8)).toBe(8);
    expect(clampSlideIndex(-2, 8)).toBe(0);
    expect(
      setPresenterControlState(
        { currentIndex: 2, maxIndex: 8, commandCounter: 3 },
        12,
        6,
      ),
    ).toEqual({ currentIndex: 6, maxIndex: 6, commandCounter: 4 });
  });

  it("requires the configured token and allows open mode when absent", () => {
    expect(
      hasValidPresenterControlToken(null, {
        HOST_SLIDES_PRESENTER_CONTROL_TOKEN: undefined,
      }),
    ).toBe(true);
    expect(
      hasValidPresenterControlToken("wrong", {
        HOST_SLIDES_PRESENTER_CONTROL_TOKEN: "secret",
      }),
    ).toBe(false);
    expect(
      hasValidPresenterControlToken("secret", {
        HOST_SLIDES_PRESENTER_CONTROL_TOKEN: "secret",
      }),
    ).toBe(true);
  });
});

describe("presenter show action resolver", () => {
  it("maps named actions to flattened presenter slide indices", () => {
    const subject = deck("thursday");
    const slides = buildHostSlideSequence(subject);

    expect(resolvePresenterShowActionIndex(slides, "go_to_pre_quiz")).toEqual({
      ok: true,
      index: 0,
    });
    expect(resolvePresenterShowActionIndex(slides, "go_to_quiz_start")).toEqual({
      ok: true,
      index: 1,
    });
    expect(resolvePresenterShowActionIndex(slides, "go_to_first_break")).toEqual({
      ok: true,
      index: slides.findIndex((slide) => slide.id === "pre_break-1"),
    });
    expect(
      resolvePresenterShowActionIndex(slides, "go_to_round_4_questions"),
    ).toEqual({
      ok: true,
      index: slides.findIndex(
        (slide) => slide.id === "round-4-questions-intro",
      ),
    });
    expect(resolvePresenterShowActionIndex(slides, "go_to_quiz_end")).toEqual({
      ok: true,
      index: slides.length - 1,
    });
  });

  it("skips disabled show-order blocks and returns a helpful unavailable result", () => {
    const subject = deck("thursday");
    subject.showOrder = resolveHostShowOrder(subject).map(
      (block): HostShowBlock =>
        block.id === "pre_break-1" ? { ...block, enabled: false } : block,
    );
    const slides = buildHostSlideSequence(subject);

    expect(resolvePresenterShowActionIndex(slides, "go_to_first_break")).toEqual(
      {
        ok: false,
        message:
          "Presenter action go_to_first_break is not available for this deck or show order.",
      },
    );
  });

  it("targets Saturday Dingbats and rejects Dingbats for Thursday", () => {
    const saturdaySlides = buildHostSlideSequence(deck("saturday"));
    const thursdaySlides = buildHostSlideSequence(deck("thursday"));

    expect(
      resolvePresenterShowActionIndex(saturdaySlides, "go_to_dingbats"),
    ).toEqual({
      ok: true,
      index: saturdaySlides.findIndex(
        (slide) => slide.type === "dingbat-question",
      ),
    });
    expect(
      resolvePresenterShowActionIndex(thursdaySlides, "go_to_dingbats"),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("go_to_dingbats"),
    });
  });

  it("supports Patreon first break and rejects absent Patreon actions", () => {
    const slides = buildHostSlideSequence(deck("patreon"));

    expect(
      resolvePresenterShowActionIndex(slides, "go_to_first_break"),
    ).toMatchObject({
      ok: true,
      index: slides.findIndex((slide) => slide.id === "pre_break-1"),
    });
    expect(
      resolvePresenterShowActionIndex(slides, "go_to_second_break"),
    ).toMatchObject({
      ok: false,
      message: expect.stringContaining("go_to_second_break"),
    });
  });
});
