import { describe, expect, it } from "vitest";
import {
  getDateInTimeZone,
  getFeaturedRecapWindow,
  selectQuizRecapListing,
  type QuizRecapListItem,
} from "@/src/quiz-recap/listing";

function quiz(id: string, quizDay: string, quizDate: string): QuizRecapListItem {
  return { id, quiz_day: quizDay, quiz_date: quizDate };
}

const quizzes = [
  quiz("future-thursday", "Thursday", "2026-07-02"),
  quiz("saturday-27", "Saturday", "2026-06-27"),
  quiz("thursday-25", "Thursday", "2026-06-25"),
  quiz("saturday-20", "Saturday", "2026-06-20"),
];

describe("Quiz Recap listing dates", () => {
  it.each([
    ["2026-06-25", "thursday", "2026-06-25"],
    ["2026-06-26", "thursday", "2026-06-25"],
    ["2026-06-27", "saturday", "2026-06-27"],
    ["2026-07-01", "saturday", "2026-06-27"],
  ] as const)(
    "uses the correct display window on %s",
    (today, quizDay, quizDate) => {
      expect(getFeaturedRecapWindow(today)).toEqual({ quizDay, quizDate });
    },
  );

  it("uses the Europe/London calendar date", () => {
    expect(
      getDateInTimeZone(new Date("2026-06-24T23:30:00.000Z")),
    ).toBe("2026-06-25");
  });
});

describe("selectQuizRecapListing", () => {
  it.each([
    ["2026-06-25", "thursday-25"],
    ["2026-06-26", "thursday-25"],
    ["2026-06-27", "saturday-27"],
    ["2026-07-01", "saturday-27"],
  ] as const)("selects %s's featured recap", (today, currentId) => {
    expect(selectQuizRecapListing(quizzes, today).currentQuiz?.id).toBe(
      currentId,
    );
  });

  it("does not expose a future recap as current or previous", () => {
    const listing = selectQuizRecapListing(quizzes, "2026-07-01");

    expect(listing.currentQuiz?.id).toBe("saturday-27");
    expect(listing.previousQuizzes.map((item) => item.id)).not.toContain(
      "future-thursday",
    );
  });

  it("returns at most six previous eligible quizzes in newest-first order", () => {
    const history = Array.from({ length: 8 }, (_, index) =>
      quiz(
        `history-${index}`,
        index % 2 === 0 ? "Thursday" : "Saturday",
        `2026-06-${String(19 - index).padStart(2, "0")}`,
      ),
    );
    const listing = selectQuizRecapListing(
      [...quizzes, ...history],
      "2026-06-27",
    );

    expect(listing.previousQuizzes).toHaveLength(6);
    expect(
      listing.previousQuizzes.map((item) => item.quiz_date),
    ).toEqual(
      [...listing.previousQuizzes]
        .map((item) => item.quiz_date)
        .sort((left, right) => right.localeCompare(left)),
    );
  });

  it("requires the expected quiz day as well as the date", () => {
    const listing = selectQuizRecapListing(
      [quiz("wrong-day", "Saturday", "2026-06-25")],
      "2026-06-25",
    );

    expect(listing.currentQuiz).toBeUndefined();
  });
});
