import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";
import type { WeeklyHostDeck } from "@/src/host-slides/types";

const ROUND_TITLES = [
  "Pot Luck",
  "Entertainment",
  "Sport",
  "Connections",
  "Geberal Knowledge",
] as const;

export function createRepresentativeJayQuizText(): string {
  const lines = ["Jays Quiz Live Thursday 25th June"];

  ROUND_TITLES.forEach((roundTitle, roundIndex) => {
    lines.push(roundTitle);
    for (let questionNumber = 1; questionNumber <= 10; questionNumber += 1) {
      const pictureMarker =
        (roundIndex === 0 && questionNumber === 3) ||
        (roundIndex === 3 && questionNumber === 7)
          ? " (Picture)"
          : "";
      lines.push(
        `${questionNumber}. What is sample ${questionNumber} for ${roundTitle}? Sample answer ${questionNumber}${pictureMarker}`,
      );
    }
  });

  lines.push("Tie Break");
  lines.push("1. To the nearest mile, how long is the River Thames? 215 miles");
  return lines.join("\n");
}

/** Lightweight development check that can run without a database or browser. */
export function verifyRepresentativeJayQuizParsing(): WeeklyHostDeck {
  const deck = parseJayQuizText(createRepresentativeJayQuizText());
  if (deck.quizType !== "thursday") {
    throw new Error("Fixture was not detected as a Thursday quiz.");
  }
  const questionCount = deck.rounds.reduce(
    (total, round) => total + round.questions.length,
    0,
  );

  if (questionCount !== 50) throw new Error("Fixture did not parse 50 questions.");
  if (deck.rounds[4].title !== "Geberal Knowledge") {
    throw new Error("Round title spelling was not preserved.");
  }
  if (!deck.rounds[0].questions[2].imagePlaceholder) {
    throw new Error("Picture marker was not detected.");
  }

  return deck;
}
