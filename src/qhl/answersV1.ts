import type { QuizPartSetup } from "@/src/qhl/quizTypes";

export type AnswersV1 = {
  v: 1;
  rounds: { answers: string[] }[];
};

type AnswersLike = {
  v?: unknown;
  rounds?: unknown;
};

export function blankAnswersForPart(part: QuizPartSetup): AnswersV1 {
  return {
    v: 1,
    rounds: part.rounds.map((r) => ({
      answers: Array.from({ length: r.questions }, () => ""),
    })),
  };
}

export function coerceAnswersToPartShape(
  existing: unknown,
  part: QuizPartSetup,
): AnswersV1 {
  const blank = blankAnswersForPart(part);

  if (!existing || typeof existing !== "object") return blank;
  const candidate = existing as AnswersLike;
  if (candidate.v !== 1 || !Array.isArray(candidate.rounds)) return blank;
  const prevRounds: unknown[] = candidate.rounds;

  // Copy over what we can, clamp to correct sizes
  const rounds = part.rounds.map((r, ri) => {
    const prevRound = prevRounds[ri] as { answers?: unknown } | undefined;
    const prevAnswers: unknown[] = Array.isArray(prevRound?.answers)
      ? prevRound.answers
      : [];

    return {
      answers: Array.from({ length: r.questions }, (_, qi) => {
        const v = prevAnswers[qi];
        return typeof v === "string" ? v : "";
      }),
    };
  });

  return { v: 1, rounds };
}

export function setAnswer(
  cur: AnswersV1,
  roundIdx: number,
  qIdx: number,
  value: string,
): AnswersV1 {
  return {
    ...cur,
    rounds: cur.rounds.map((r, ri) => {
      if (ri !== roundIdx) return r;
      return {
        ...r,
        answers: r.answers.map((a, qi) => (qi === qIdx ? value : a)),
      };
    }),
  };
}
