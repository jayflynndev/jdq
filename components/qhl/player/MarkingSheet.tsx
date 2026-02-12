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

export function MarkingSheet({
  part,
  answers,
  marks,
  onSetMark,
  disabled,
}: {
  part: QuizPartSetup;
  answers: AnswersV1;
  marks: MarksV1;
  onSetMark: (roundIdx: number, qIdx: number, value: boolean | null) => void;
  disabled: boolean;
}) {
  const roundsCount = part.rounds.length;
  const labels = useMemo(() => part.rounds.map((r) => r.title), [part.rounds]);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  useEffect(() => setSelectedRoundIndex(0), [part]);
  useEffect(() => {
    setSelectedRoundIndex((i) => Math.max(0, Math.min(i, roundsCount - 1)));
  }, [roundsCount]);

  const round = part.rounds[selectedRoundIndex];

  return (
    <div className="space-y-4">
      <RoundTabs
        roundsCount={roundsCount}
        selectedRoundIndex={selectedRoundIndex}
        onSelect={setSelectedRoundIndex}
        labels={labels}
      />

      <div className="rounded-2xl border bg-slate-50 p-4 space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-base font-semibold text-slate-900">
            {titleOrFallback(round.title, `Round ${selectedRoundIndex + 1}`)}
          </div>
          <div className="text-xs text-slate-600">
            {round.questions} questions
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: round.questions }, (_, qi) => {
            const ans =
              answers.rounds?.[selectedRoundIndex]?.answers?.[qi] ?? "";
            const val = marks.rounds?.[selectedRoundIndex]?.marks?.[qi] ?? null;

            const yesActive = val === true;
            const noActive = val === false;

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
                    <div
                      className="mt-1 text-sm text-slate-900"
                      style={{ overflowWrap: "break-word" }}
                    >
                      {ans || <span className="text-slate-400">—</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      disabled={disabled}
                      onClick={() => onSetMark(selectedRoundIndex, qi, true)}
                      className={[
                        "inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition",
                        yesActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                        disabled ? "opacity-40" : "",
                      ].join(" ")}
                      title="Correct"
                    >
                      ✅
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => onSetMark(selectedRoundIndex, qi, false)}
                      className={[
                        "inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition",
                        noActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                        disabled ? "opacity-40" : "",
                      ].join(" ")}
                      title="Incorrect"
                    >
                      ❌
                    </button>

                    <button
                      disabled={disabled}
                      onClick={() => onSetMark(selectedRoundIndex, qi, null)}
                      className={[
                        "inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-medium transition",
                        val === null
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        disabled ? "opacity-40" : "",
                      ].join(" ")}
                      title="Unmark"
                    >
                      —
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-600">
          Tip: leave an answer unmarked if it’s unclear — your host can review.
        </div>
      </div>
    </div>
  );
}
