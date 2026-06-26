import { describe, expect, it } from "vitest";
import { getQuizRecapQuestionNumber } from "@/src/quiz-recap/rendering";

describe("Quiz Recap rendering", () => {
  it("generates one-based question numbers from array indexes", () => {
    expect(getQuizRecapQuestionNumber(0)).toBe("1.");
    expect(getQuizRecapQuestionNumber(1)).toBe("2.");
    expect(getQuizRecapQuestionNumber(9)).toBe("10.");
  });
});
