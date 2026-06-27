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

function renderSlideForDeck(
  quizType: HostDeck["quizType"],
  slide: HostPresenterSlide,
): string {
  const deck = getDeck(quizType);
  deck.quizRecapAccessCodes = { part1: "PART-ONE", part2: "PART-TWO" };
  return renderToStaticMarkup(createElement(SlideCanvas, { deck, slide }));
}

function renderSlide(slide: HostPresenterSlide): string {
  return renderSlideForDeck("thursday", slide);
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

  it("does not repeat the date in the show-screen right panel", () => {
    const html = renderSlide({
      id: "pre-quiz",
      type: "show-screen",
      screenType: "pre_quiz",
    });

    expect(regionMarkup(html, "right-panel")).not.toContain("June");
    expect(regionMarkup(html, "right-panel")).not.toContain("2026");
  });

  it("keeps the camera-mode main area clear of decorative blobs", () => {
    const html = renderSlide({
      id: "pre-break",
      type: "show-screen",
      screenType: "pre_break",
      showTimerPlaceholder: false,
    });

    expect(regionMarkup(html, "main")).not.toContain("rounded-full");
    expect(regionMarkup(html, "main")).not.toContain("bg-yellow-300/10");
  });

  it("renders a Part 2 access-code ticker on Saturday Dingbat slides", () => {
    const question = renderSlideForDeck("saturday", {
      id: "dingbat-question",
      type: "dingbat-question",
    });
    const answer = renderSlideForDeck("saturday", {
      id: "dingbat-answer",
      type: "dingbat-answer",
    });

    expect(question).toContain("Recap questions at quizhub.co.uk");
    expect(question).toContain("Access code: PART-TWO");
    expect(answer).toContain("Recap questions at quizhub.co.uk");
    expect(answer).toContain("Access code: PART-TWO");
  });

  it("renders a clean Dingbat ticker fallback when the Part 2 code is missing", () => {
    const deck = getDeck("saturday");
    deck.quizRecapAccessCodes = { part1: "PART-ONE", part2: "" };
    const html = renderToStaticMarkup(
      createElement(SlideCanvas, {
        deck,
        slide: { id: "dingbat-question", type: "dingbat-question" },
      }),
    );

    expect(html).toContain("Recap questions at quizhub.co.uk");
    expect(html).toContain("Access code coming soon");
  });
});
