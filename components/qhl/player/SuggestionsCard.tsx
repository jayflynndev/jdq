"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizPartSetup, QuizSetup } from "@/src/qhl/quizTypes";
import { RoundTabs } from "@/components/qhl/shared/RoundTabs";

export function SuggestionsCard({
  quizId,
  teamId,
  partIndex,
  setup,
  enabled,
}: {
  quizId: string;
  teamId: string;
  partIndex: number;
  setup: QuizSetup;
  enabled: boolean;
}) {
  const part: QuizPartSetup | null = useMemo(() => {
    const idx = Math.max(1, Math.min(partIndex, setup.length)) - 1;
    return setup[idx] ?? null;
  }, [setup, partIndex]);

  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // key `${r}:${q}`

  useEffect(() => {
    setSelectedRoundIndex(0);
    setDrafts({});
  }, [partIndex]);

  if (!enabled || !part) return null;

  const round = part.rounds[selectedRoundIndex];
  const labels = part.rounds.map((r) => r.title);

  function keyOf(r: number, q: number) {
    return `${r}:${q}`;
  }

  async function save(r: number, q: number) {
    const k = keyOf(r, q);
    const text = drafts[k] ?? "";

    const { error } = await supabase.rpc("qhl_player_upsert_suggestion", {
      p_quiz_id: quizId,
      p_team_id: teamId,
      p_part_index: partIndex,
      p_round_index: r,
      p_question_index: q,
      p_suggestion: text,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-2">
        <div className="text-base font-semibold text-slate-900">
          Team suggestions
        </div>
        <div className="text-sm text-slate-600">
          Add suggestions for your captain — only the captain’s sheet is
          submitted.
        </div>

        <RoundTabs
          roundsCount={part.rounds.length}
          selectedRoundIndex={selectedRoundIndex}
          onSelect={setSelectedRoundIndex}
          labels={labels}
        />
      </div>

      <div className="rounded-2xl border bg-slate-50 p-4 space-y-4">
        <div className="flex items-baseline justify-between">
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
            const k = keyOf(selectedRoundIndex, qi);
            return (
              <div
                key={qi}
                className="rounded-xl border bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-600">
                    Q{qi + 1}
                  </div>
                </div>

                <div className="mt-2 grid gap-2 md:grid-cols-12 md:items-center">
                  <input
                    className="md:col-span-9 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    value={drafts[k] ?? ""}
                    onChange={(e) =>
                      setDrafts((cur) => ({ ...cur, [k]: e.target.value }))
                    }
                    placeholder="Your suggestion…"
                  />

                  <button
                    className="md:col-span-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:translate-y-px"
                    onClick={() => save(selectedRoundIndex, qi)}
                  >
                    Send
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-600">
          Tip: clear the input and Send to remove a suggestion.
        </div>
      </div>
    </div>
  );
}
