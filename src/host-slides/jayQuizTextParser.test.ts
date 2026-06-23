import { describe, expect, it } from "vitest";
import {
  HostDeckParseError,
  parseJayQuizText,
} from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";

describe("parseJayQuizText", () => {
  it("extracts title, date, quiz type, rounds, questions and tiebreaker", () => {
    const deck = parseJayQuizText(createRepresentativeJayQuizText());
    const currentYear = new Date().getFullYear();

    expect(deck.title).toBe("Jays Quiz Live Thursday 25th June");
    expect(deck.quizDate).toBe(`${currentYear}-06-25`);
    expect(deck.quizType).toBe("thursday");
    expect(deck.rounds).toHaveLength(5);
    deck.rounds.forEach((round) => expect(round.questions).toHaveLength(10));
    expect(deck.tiebreaker).toMatchObject({
      prompt: "To the nearest mile, how long is the River Thames?",
      answer: "215 miles",
    });
  });

  it("splits inline question text from its answer", () => {
    const deck = parseJayQuizText(createRepresentativeJayQuizText());

    expect(deck.rounds[0].questions[0]).toMatchObject({
      prompt: "What is sample 1 for Pot Luck?",
      answer: "Sample answer 1",
    });
  });

  it("marks picture questions and preserves source round spelling", () => {
    const deck = parseJayQuizText(createRepresentativeJayQuizText());

    expect(deck.rounds[0].questions[2].imagePlaceholder).toBe(
      "Picture required",
    );
    expect(deck.rounds[3].questions[6].imagePlaceholder).toBe(
      "Picture required",
    );
    expect(deck.rounds[4].title).toBe("Geberal Knowledge");
  });

  it("detects the standard no-year Saturday title", () => {
    const saturdayText = createRepresentativeJayQuizText().replace(
      "Jays Quiz Live Thursday 25th June",
      "Jays Quiz Live Saturday 20th June",
    );

    const deck = parseJayQuizText(saturdayText);
    expect(deck.title).toBe("Jays Quiz Live Saturday 20th June");
    expect(deck.quizType).toBe("saturday");
    expect(deck.quizDate).toBe(`${new Date().getFullYear()}-06-20`);
  });

  it("keeps support for an explicit year", () => {
    const fullYearText = createRepresentativeJayQuizText().replace(
      "Jays Quiz Live Thursday 25th June",
      "Jays Quiz Live Thursday 25th June 2031",
    );

    expect(parseJayQuizText(fullYearText).quizDate).toBe("2031-06-25");
  });

  it("detects Patreon from the title", () => {
    const patreonText = createRepresentativeJayQuizText().replace(
      "Jays Quiz Live Thursday 25th June",
      "Jays Quiz Live Patreon 25th June",
    );

    expect(parseJayQuizText(patreonText).quizType).toBe("patreon");
  });

  it("accepts a weekly quiz without a tiebreak", () => {
    const withoutTiebreak = createRepresentativeJayQuizText()
      .split("\n")
      .slice(0, -2)
      .join("\n");
    const deck = parseJayQuizText(withoutTiebreak);

    expect(deck.rounds).toHaveLength(5);
    expect(deck.tiebreaker).toBeUndefined();
  });

  it("recognises a manually labelled tiebreak without counting it as a round", () => {
    const text = createRepresentativeJayQuizText().replace(
      "Tie Break",
      "Tie Break Question",
    );
    const deck = parseJayQuizText(text);

    expect(deck.rounds).toHaveLength(5);
    expect(deck.tiebreaker?.answer).toBe("215 miles");
  });

  it("still rejects a title without a real date", () => {
    const invalidText = createRepresentativeJayQuizText().replace(
      "Jays Quiz Live Thursday 25th June",
      "Jays Quiz Live Thursday",
    );

    expect(() => parseJayQuizText(invalidText)).toThrow(HostDeckParseError);
  });
});
