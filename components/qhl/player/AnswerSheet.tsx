"use client";

import { useEffect, useMemo, useState } from "react";
import type { QuizPartSetup } from "@/src/qhl/quizTypes";
import type { AnswersV1 } from "@/src/qhl/answersV1";
import { RoundTabs } from "@/components/qhl/shared/RoundTabs";
import type { SuggestionsMap } from "@/src/qhl/suggestionsTypes";

export function AnswerSheet({
  part,
  answers,
  onChange,
  disabled,
  suggestionsMap,
}: {
  part: QuizPartSetup;
  answers: AnswersV1;
  onChange: (roundIdx: number, qIdx: number, value: string) => void;
  disabled: boolean;
  suggestionsMap?: SuggestionsMap;
}) {
  const roundsCount = part.rounds.length;
  const labels = useMemo(() => part.rounds.map((r) => r.title), [part.rounds]);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  useEffect(() => {
    setSelectedRoundIndex(0);
  }, [part]);

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
            {round.title?.trim()
              ? round.title
              : `Round ${selectedRoundIndex + 1}`}
          </div>
          <div className="text-xs text-slate-600">
            {round.questions} questions
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: round.questions }, (_, qi) => {
            const key = `${selectedRoundIndex}:${qi}`;
            const suggs = suggestionsMap?.[key] ?? [];

            const value =
              answers.rounds?.[selectedRoundIndex]?.answers?.[qi] ?? "";

            return (
              <div
                key={qi}
                className="rounded-xl border bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-slate-600">
                    Q{qi + 1}
                  </div>

                  {disabled ? (
                    <div className="text-xs text-slate-500">Locked</div>
                  ) : null}
                </div>

                <input
                  className="mt-2 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:bg-slate-50"
                  value={value}
                  onChange={(e) =>
                    onChange(selectedRoundIndex, qi, e.target.value)
                  }
                  disabled={disabled}
                  placeholder="Type your answer…"
                />

                {suggs.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggs.slice(0, 8).map((s, idx) => (
                      <button
                        key={`${s.user_id}-${idx}`}
                        type="button"
                        className="rounded-full border border-yellow-300/70 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900 hover:brightness-95 disabled:opacity-40"
                        onClick={() =>
                          onChange(selectedRoundIndex, qi, s.suggestion)
                        }
                        title="Click to copy into your answer"
                        disabled={disabled}
                      >
                        {s.suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {suggestionsMap ? (
          <div className="text-xs text-slate-600">
            Tip: click a suggestion to copy it into your answer.
          </div>
        ) : null}
      </div>
    </div>
  );
}
