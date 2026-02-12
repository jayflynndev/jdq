"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizPartSetup } from "@/src/qhl/quizTypes";
import type { AnswersV1 } from "@/src/qhl/answersV1";
import type { MarksV1 } from "@/src/qhl/marksV1";
import { RoundTabs } from "@/components/qhl/shared/RoundTabs";

function titleOrFallback(t: string | undefined, fallback: string) {
  const s = t?.trim();
  return s ? s : fallback;
}

function markSymbol(v: boolean | null | undefined) {
  if (v === true) return "✅";
  if (v === false) return "❌";
  return "—";
}

export function MarkedResultsSheet({
  part,
  answers,
  marks,
}: {
  part: QuizPartSetup;
  answers: AnswersV1;
  marks: MarksV1;
}) {
  const roundsCount = part.rounds.length;
  const labels = useMemo(() => part.rounds.map((r) => r.title), [part.rounds]);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  useEffect(() => setSelectedRoundIndex(0), [part]);
  useEffect(() => {
    setSelectedRoundIndex((i) => Math.max(0, Math.min(i, roundsCount - 1)));
  }, [roundsCount]);

  const safeRoundIndex = Math.max(
    0,
    Math.min(selectedRoundIndex, Math.max(0, roundsCount - 1)),
  );

  const round = part.rounds[safeRoundIndex];

  if (!round) {
    return (
      <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
        No rounds configured for this part.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoundTabs
        roundsCount={roundsCount}
        selectedRoundIndex={safeRoundIndex}
        onSelect={setSelectedRoundIndex}
        labels={labels}
      />

      <div className="rounded-2xl border bg-slate-50 p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-base font-semibold text-slate-900">
            {titleOrFallback(round.title, `Round ${safeRoundIndex + 1}`)}
          </div>
          <div className="text-xs text-slate-600">
            {round.questions} questions
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: round.questions }, (_, qi) => {
            const ans = answers.rounds?.[safeRoundIndex]?.answers?.[qi] ?? "";
            const mk = marks.rounds?.[safeRoundIndex]?.marks?.[qi] ?? null;

            return (
              <div
                key={qi}
                className="rounded-xl border bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-600">
                      Q{qi + 1}
                    </div>
                    <div className="mt-1 text-sm text-slate-900">
                      {ans || <span className="text-slate-400">—</span>}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    {markSymbol(mk)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-600">
          Marker identity is hidden to reduce bias.
        </div>
      </div>
    </div>
  );
}
