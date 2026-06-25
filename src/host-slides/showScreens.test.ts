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
  it("defaults Thursday decks to QuizHub and recap messaging", () => {
    const settings = getDefaultShowScreens("thursday");

    expect(settings.preQuiz.enabled).toBe(true);
    expect(settings.preQuiz.recapText.toLowerCase()).toContain("quizhub.co.uk");
    expect(settings.preQuiz.recapText.toLowerCase()).toContain("quiz recap");
    expect(settings.preQuiz.tickerText.toLowerCase()).toContain("quizhub.co.uk");
    expect(settings.firstBreak.enabled).toBe(true);
    expect(settings.firstBreak.titleText).toContain("Rounds 1-3");
    expect(settings.secondBreak.enabled).toBe(true);
    expect(settings.secondBreak.titleText).toContain("Rounds 4-5");
  });

  it("defaults Saturday decks to QuizHub and recap messaging", () => {
    const settings = getDefaultShowScreens("saturday");

    expect(settings.preQuiz.enabled).toBe(true);
    expect(settings.preQuiz.recapText.toLowerCase()).toContain("quizhub.co.uk");
    expect(settings.preQuiz.recapText.toLowerCase()).toContain("quiz recap");
    expect(settings.preQuiz.tickerText.toLowerCase()).toContain("quizhub.co.uk");
    expect(settings.firstBreak.enabled).toBe(true);
    expect(settings.secondBreak.enabled).toBe(false);
  });

  it("defaults Patreon decks without Quiz Recap wording", () => {
    const settings = getDefaultShowScreens("patreon");
    const combinedCopy = [
      settings.preQuiz.howToPlayText,
      settings.preQuiz.recapText,
      settings.preQuiz.tickerText,
      settings.firstBreak.titleText,
      settings.firstBreak.bodyText,
      settings.firstBreak.tickerText,
      settings.secondBreak.titleText,
      settings.secondBreak.bodyText,
      settings.secondBreak.tickerText,
    ]
      .join(" ")
      .toLowerCase();

    expect(settings.preQuiz.enabled).toBe(true);
    expect(combinedCopy).toContain("patreon");
    expect(combinedCopy).not.toContain("quiz recap");
  });

  it("preserves explicit overrides", () => {
    const defaults = getDefaultShowScreens("thursday");
    const settings = resolveHostShowScreens("thursday", {
      ...defaults,
      preQuiz: {
        ...defaults.preQuiz,
        enabled: false,
        howToPlayText: "Custom instructions",
        recapText: "",
        tickerText: "",
      },
      firstBreak: {
        ...defaults.firstBreak,
        titleText: "Custom break",
      },
    });

    expect(settings.preQuiz.enabled).toBe(false);
    expect(settings.preQuiz.howToPlayText).toBe("Custom instructions");
    expect(settings.preQuiz.recapText).toBe("");
    expect(settings.firstBreak.titleText).toBe("Custom break");
  });

  it("uses the Part 1 access code for the first break", () => {
    const deck = getDeck("thursday");
    deck.quizRecapAccessCodes = { part1: "ROUND123", part2: "FINAL456" };

    expect(getBreakAccessCode(deck, "first")).toEqual({
      shouldShow: true,
      part: "Part 1",
      code: "ROUND123",
    });
  });

  it("uses the Part 2 access code for the second break", () => {
    const deck = getDeck("saturday");
    deck.quizRecapAccessCodes = { part1: "ROUND123", part2: "FINAL456" };

    expect(getBreakAccessCode(deck, "second")).toEqual({
      shouldShow: true,
      part: "Part 2",
      code: "FINAL456",
    });
  });

  it("handles missing access codes gracefully", () => {
    const deck = getDeck("thursday");
    deck.quizRecapAccessCodes = { part1: "   " };

    expect(getBreakAccessCode(deck, "first")).toEqual({
      shouldShow: true,
      part: "Part 1",
      code: null,
    });
  });

  it("does not show access codes for Patreon decks by default", () => {
    const deck = getDeck("patreon");
    deck.quizRecapAccessCodes = { part1: "SHOULD-NOT-SHOW" };

    expect(getBreakAccessCode(deck, "first")).toEqual({ shouldShow: false });
  });
});
