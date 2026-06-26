import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SlideCanvas } from "@/components/host-slides/SlideCanvas";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import type { HostDeck, HostPresenterSlide } from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(deck);
}

function renderSlide(slide: HostPresenterSlide): string {
  const deck = getDeck("thursday");
  deck.quizRecapAccessCodes = { part1: "PART-ONE", part2: "PART-TWO" };
  return renderToStaticMarkup(createElement(SlideCanvas, { deck, slide }));
}

function regionMarkup(html: string, region: string): string {
  const marker = `data-show-screen-region="${region}"`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return "";
  const nextMarkerIndex = html.indexOf(
    "data-show-screen-region=",
    markerIndex + marker.length,
  );
  return nextMarkerIndex === -1
    ? html.slice(markerIndex)
    : html.slice(markerIndex, nextMarkerIndex);
}

describe("SlideCanvas show-screen layout", () => {
  it("renders camera-mode body text in the right panel, not the main camera area", () => {
    const html = renderSlide({
      id: "break-1-pre",
      type: "show-screen",
      screenType: "pre_break",
      accessCodePart: "part1",
      textSettings: {
        titleText: "Break title",
        bodyText: "Audience-facing break body",
        tickerText: "Ticker",
      },
      showTimerPlaceholder: false,
    });

    expect(regionMarkup(html, "right-panel")).toContain(
      "Audience-facing break body",
    );
    expect(regionMarkup(html, "main")).not.toContain(
      "Audience-facing break body",
    );
  });

  it("renders break-countdown body text in the main information area", () => {
    const html = renderSlide({
      id: "break-1-countdown",
      type: "show-screen",
      screenType: "break_countdown",
      accessCodePart: "part1",
      textSettings: {
        titleText: "Break countdown title",
        bodyText: "Main break message",
        tickerText: "Ticker",
      },
      showTimerPlaceholder: true,
    });

    expect(regionMarkup(html, "main")).toContain("Main break message");
    expect(regionMarkup(html, "right-panel")).not.toContain(
      "Main break message",
    );
  });

  it("shows Part 1 and Part 2 access codes for the matching break slides", () => {
    const break1 = renderSlide({
      id: "break-1-countdown",
      type: "show-screen",
      screenType: "break_countdown",
      accessCodePart: "part1",
      showTimerPlaceholder: true,
    });
    const break2 = renderSlide({
      id: "break-2-countdown",
      type: "show-screen",
      screenType: "break_countdown",
      accessCodePart: "part2",
      showTimerPlaceholder: true,
    });

    expect(regionMarkup(break1, "right-panel")).toContain("PART-ONE");
    expect(regionMarkup(break2, "right-panel")).toContain("PART-TWO");
  });

  it("shows timer placeholders only for pre-quiz and countdown screens", () => {
    const preQuiz = renderSlide({
      id: "pre-quiz",
      type: "show-screen",
      screenType: "pre_quiz",
    });
    const countdown = renderSlide({
      id: "break-countdown",
      type: "show-screen",
      screenType: "break_countdown",
      showTimerPlaceholder: true,
    });
    const preBreak = renderSlide({
      id: "pre-break",
      type: "show-screen",
      screenType: "pre_break",
      showTimerPlaceholder: false,
    });
    const postBreak = renderSlide({
      id: "post-break",
      type: "show-screen",
      screenType: "post_break",
      showTimerPlaceholder: false,
    });

    expect(regionMarkup(preQuiz, "timer")).toContain("Quiz Starts In:");
    expect(regionMarkup(countdown, "timer")).toContain("Back in:");
    expect(regionMarkup(preBreak, "timer")).toBe("");
    expect(regionMarkup(postBreak, "timer")).toBe("");
  });

  it("keeps pre-quiz and break countdown timers in the right panel", () => {
    const preQuiz = renderSlide({
      id: "pre-quiz",
      type: "show-screen",
      screenType: "pre_quiz",
    });
    const countdown = renderSlide({
      id: "break-countdown",
      type: "show-screen",
      screenType: "break_countdown",
      showTimerPlaceholder: true,
    });

    expect(preQuiz.indexOf('data-show-screen-region="right-panel"')).toBeLessThan(
      preQuiz.indexOf('data-show-screen-region="timer"'),
    );
    expect(countdown.indexOf('data-show-screen-region="right-panel"')).toBeLessThan(
      countdown.indexOf('data-show-screen-region="timer"'),
    );
  });
});
