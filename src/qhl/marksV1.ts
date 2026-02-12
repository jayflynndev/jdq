import type { QuizPartSetup } from "@/src/qhl/quizTypes";

export type MarksV1 = {
  v: 1;
  rounds: { marks: (boolean | null)[] }[];
};

type MarksLike = {
  v?: unknown;
  rounds?: unknown;
};

export function blankMarksForPart(part: QuizPartSetup): MarksV1 {
  return {
    v: 1,
    rounds: part.rounds.map((r) => ({
      marks: Array.from({ length: r.questions }, () => null),
    })),
  };
}

export function coerceMarksToPartShape(
  existing: unknown,
  part: QuizPartSetup,
): MarksV1 {
  const blank = blankMarksForPart(part);

  if (!existing || typeof existing !== "object") return blank;
  const candidate = existing as MarksLike;
  if (candidate.v !== 1 || !Array.isArray(candidate.rounds)) return blank;
  const prevRounds: unknown[] = candidate.rounds;

  const rounds = part.rounds.map((r, ri) => {
    const prevRound = prevRounds[ri] as { marks?: unknown } | undefined;
    const prevMarks: unknown[] = Array.isArray(prevRound?.marks)
      ? prevRound.marks
      : [];

    return {
      marks: Array.from({ length: r.questions }, (_, qi) => {
        const v = prevMarks[qi];
        if (v === true) return true;
        if (v === false) return false;
        return null;
      }),
    };
  });

  return { v: 1, rounds };
}

export function toggleMark(
  cur: MarksV1,
  roundIdx: number,
  qIdx: number,
  next: boolean | null,
): MarksV1 {
  return {
    ...cur,
    rounds: cur.rounds.map((r, ri) => {
      if (ri !== roundIdx) return r;
      return {
        ...r,
        marks: r.marks.map((m, qi) => (qi === qIdx ? next : m)),
      };
    }),
  };
}
