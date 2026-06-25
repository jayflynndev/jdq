import { describe, expect, it } from "vitest";
import {
  getBreakAccessCode,
  getDefaultShowScreens,
  resolveHostShowScreens,
} from "@/src/host-slides/showScreens";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import type { HostDeck } from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(deck);
}

describe("Host Slides show screen settings", () => {
  it("defaults Thursday decks to Jay's Streamlabs scene flow", () => {
    const settings = getDefaultShowScreens("thursday");

    expect(settings.blank.enabled).toBe(false);
    expect(settings.preRoll.enabled).toBe(false);
    expect(settings.preQuiz.enabled).toBe(true);
    expect(settings.preQuiz.bodyText.toLowerCase()).toContain("quizhub.co.uk");
    expect(settings.preQuiz.bodyText.toLowerCase()).toContain("quiz recap");
    expect(settings.preBreak.enabled).toBe(true);
    expect(settings.breakCountdown.enabled).toBe(true);
    expect(settings.postBreak.enabled).toBe(true);
    expect(settings.midQuizReset.enabled).toBe(true);
    expect(settings.saturdayBreak2.enabled).toBe(false);
    expect(settings.quizEnd.enabled).toBe(true);
  });

  it("defaults Saturday decks with Saturday Break 2 enabled", () => {
    const settings = getDefaultShowScreens("saturday");

    expect(settings.preQuiz.enabled).toBe(true);
    expect(settings.preBreak.enabled).toBe(true);
    expect(settings.breakCountdown.enabled).toBe(true);
    expect(settings.postBreak.enabled).toBe(true);
    expect(settings.midQuizReset.enabled).toBe(true);
    expect(settings.saturdayBreak2.enabled).toBe(true);
    expect(settings.saturdayBreak2.bodyText).toContain("Part 2");
    expect(settings.quizEnd.enabled).toBe(true);
  });

  it("defaults Patreon decks without QuizHub or recap wording", () => {
    const settings = getDefaultShowScreens("patreon");
    const combinedCopy = Object.values(settings)
      .flatMap((screen) => [
        screen.titleText,
        screen.bodyText,
        screen.tickerText,
      ])
      .join(" ")
      .toLowerCase();

    expect(settings.preQuiz.enabled).toBe(true);
    expect(combinedCopy).toContain("patreon");
    expect(combinedCopy).not.toContain("quiz recap");
    expect(combinedCopy).not.toContain("quizhub");
  });

  it("preserves explicit overrides", () => {
    const defaults = getDefaultShowScreens("thursday");
    const settings = resolveHostShowScreens("thursday", {
      ...defaults,
      preQuiz: {
        ...defaults.preQuiz,
        enabled: false,
        titleText: "Custom pre-quiz",
        bodyText: "Custom instructions",
        tickerText: "",
      },
      breakCountdown: {
        ...defaults.breakCountdown,
        titleText: "Custom break",
      },
      midQuizReset: {
        ...defaults.midQuizReset,
        enabled: false,
        titleText: "Custom reset",
      },
    });

    expect(settings.preQuiz.enabled).toBe(false);
    expect(settings.preQuiz.bodyText).toBe("Custom instructions");
    expect(settings.breakCountdown.titleText).toBe("Custom break");
    expect(settings.midQuizReset.enabled).toBe(false);
    expect(settings.midQuizReset.titleText).toBe("Custom reset");
  });

  it("uses the Part 1 access code for the first break", () => {
    const deck = getDeck("thursday");
    deck.quizRecapAccessCodes = { part1: "ROUND123", part2: "FINAL456" };

    expect(getBreakAccessCode(deck, "part1")).toEqual({
      shouldShow: true,
      part: "Part 1",
      code: "ROUND123",
    });
  });

  it("uses the Part 2 access code for the second break", () => {
    const deck = getDeck("saturday");
    deck.quizRecapAccessCodes = { part1: "ROUND123", part2: "FINAL456" };

    expect(getBreakAccessCode(deck, "part2")).toEqual({
      shouldShow: true,
      part: "Part 2",
      code: "FINAL456",
    });
  });

  it("handles missing access codes gracefully", () => {
    const deck = getDeck("thursday");
    deck.quizRecapAccessCodes = { part1: "   " };

    expect(getBreakAccessCode(deck, "part1")).toEqual({
      shouldShow: true,
      part: "Part 1",
      code: null,
    });
  });

  it("does not show access codes for Patreon decks by default", () => {
    const deck = getDeck("patreon");
    deck.quizRecapAccessCodes = { part1: "SHOULD-NOT-SHOW" };

    expect(getBreakAccessCode(deck, "part1")).toEqual({ shouldShow: false });
  });
});
