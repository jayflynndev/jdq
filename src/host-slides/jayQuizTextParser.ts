import type {
  HostDeck,
  HostDeckStatus,
  HostQuizType,
  HostQuestion,
  HostRound,
} from "@/src/host-slides/types";

export type JayQuizParserOptions = {
  quizType?: HostQuizType;
  status?: HostDeckStatus;
  strictStandardShape?: boolean;
};

export class HostDeckParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HostDeckParseError";
  }
}

const MONTHS: Readonly<Record<string, number>> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferQuizType(header: string): HostQuizType {
  if (/\bthursday\b/i.test(header)) return "thursday";
  if (/\bsaturday\b/i.test(header)) return "saturday";
  if (/\bpatreon\b/i.test(header)) return "patreon";
  throw new HostDeckParseError(
    "Could not determine whether the document is a Thursday, Saturday, or Patreon quiz.",
  );
}

function parseHeaderDate(header: string): string {
  const match = header.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?\b/i,
  );
  if (!match) {
    throw new HostDeckParseError(
      "The first line must contain a date such as 26 June or 26 June 2026.",
    );
  }

  const day = Number(match[1]);
  const month = MONTHS[match[2].toLowerCase()];
  const year = match[3] ? Number(match[3]) : new Date().getFullYear();
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new HostDeckParseError(`Invalid quiz date in first line: ${header}`);
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function hasFiveRounds(
  rounds: HostRound[],
): rounds is [HostRound, HostRound, HostRound, HostRound, HostRound] {
  return rounds.length === 5;
}

/**
 * Parses the plain text extracted from Jay's current quiz DOCX format.
 *
 * Assumptions intentionally kept here, rather than in the presenter:
 * - The first non-empty line contains both the quiz name and a written UK date.
 * - Every standalone, non-numbered line after that starts a new round.
 * - A "Tie Break"/"Tiebreaker" heading optionally starts a tiebreak section.
 * - Each question is one line, numbered from 1 within its section.
 * - The final question mark separates question text from its inline answer.
 * - "(Picture)" may occur anywhere on the numbered line and is not displayed.
 *
 * DOCX binary extraction is deliberately outside this pure parser. A later
 * importer can extract raw text and pass it to this function unchanged.
 */
export function parseJayQuizText(
  rawText: string,
  options: JayQuizParserOptions = {},
): HostDeck {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const header = lines.shift();
  if (!header) throw new HostDeckParseError("The quiz document is empty.");

  const quizType = options.quizType ?? inferQuizType(header);
  const quizDate = parseHeaderDate(header);
  const deckId = slugify(`${quizType}-${quizDate}`);
  const rounds: HostRound[] = [];
  let currentRound: HostRound | null = null;
  let parsingTiebreaker = false;
  let tiebreaker: HostQuestion | undefined;

  for (const [lineIndex, line] of lines.entries()) {
    const questionMatch = line.match(/^(\d+)[.)]\s+(.+)$/);

    if (!questionMatch) {
      if (
        /^tie\s*-?\s*break(?:er)?(?:\s+(?:question|questions))?:?$/i.test(
          line,
        )
      ) {
        parsingTiebreaker = true;
        currentRound = null;
        continue;
      }

      parsingTiebreaker = false;
      currentRound = {
        id: `${deckId}-round-${rounds.length + 1}`,
        // Preserve source spelling exactly, including "Geberal Knowledge".
        title: line,
        questions: [],
      };
      rounds.push(currentRound);
      continue;
    }

    const sourceQuestionNumber = Number(questionMatch[1]);
    const hasPicture = /\(Picture\)/i.test(questionMatch[2]);
    const questionAndAnswer = questionMatch[2]
      .replace(/\s*\(Picture\)\s*/gi, " ")
      .trim();
    const answerBoundary = questionAndAnswer.lastIndexOf("?");

    if (answerBoundary < 0) {
      throw new HostDeckParseError(
        `Line ${lineIndex + 2} has no question mark separating its inline answer.`,
      );
    }

    const prompt = questionAndAnswer.slice(0, answerBoundary + 1).trim();
    const answer = questionAndAnswer.slice(answerBoundary + 1).trim();
    if (!answer) {
      throw new HostDeckParseError(
        `Line ${lineIndex + 2} has no answer after the question mark.`,
      );
    }

    if (parsingTiebreaker) {
      if (tiebreaker) {
        throw new HostDeckParseError("Only one tiebreaker question is supported.");
      }
      tiebreaker = {
        id: `${deckId}-tiebreaker`,
        prompt,
        answer,
        ...(hasPicture ? { imagePlaceholder: "Picture required" } : {}),
      };
      continue;
    }

    if (!currentRound) {
      throw new HostDeckParseError(
        `Line ${lineIndex + 2} contains a question before a round title.`,
      );
    }

    const expectedNumber = currentRound.questions.length + 1;
    if (sourceQuestionNumber !== expectedNumber) {
      throw new HostDeckParseError(
        `Expected question ${expectedNumber} in "${currentRound.title}", found ${sourceQuestionNumber}.`,
      );
    }

    currentRound.questions.push({
      id: `${currentRound.id}-question-${sourceQuestionNumber}`,
      prompt,
      answer,
      ...(hasPicture ? { imagePlaceholder: "Picture required" } : {}),
    });
  }

  if (quizType === "patreon") {
    return {
      id: deckId,
      title: header,
      quizType,
      quizDate,
      status: options.status ?? "draft",
      rounds,
      ...(tiebreaker ? { tiebreaker } : {}),
    };
  }

  if (!hasFiveRounds(rounds)) {
    throw new HostDeckParseError(
      `Expected exactly 5 rounds, found ${rounds.length}.`,
    );
  }
  if (options.strictStandardShape !== false) {
    rounds.forEach((round, index) => {
      if (round.questions.length !== 10) {
        throw new HostDeckParseError(
          `Round ${index + 1} must contain 10 questions; found ${round.questions.length}.`,
        );
      }
    });
  }

  return {
    id: deckId,
    title: header,
    quizType,
    quizDate,
    status: options.status ?? "draft",
    rounds,
    ...(tiebreaker ? { tiebreaker } : {}),
  };
}
