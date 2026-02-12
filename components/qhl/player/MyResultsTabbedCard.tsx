"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";
import type { TeamRow } from "@/src/qhl/teamTypes";
import type { QuizSetup } from "@/src/qhl/quizTypes";

import { PartsTabs } from "@/components/qhl/player/PartsTabs";
import { MarkedResultsSheet } from "@/components/qhl/player/MarkedResultsSheet";

import { coerceAnswersToPartShape, type AnswersV1 } from "@/src/qhl/answersV1";
import { coerceMarksToPartShape, type MarksV1 } from "@/src/qhl/marksV1";

type ResultRow = {
  my_answers: unknown;
  my_marks: unknown;
  part_points: number;
  total_points: number;
  needs_manual_review: boolean;
  notes: string | null;
};

export function MyResultsTabbedCard({
  quizId,
  runtime,
  myTeam,
}: {
  quizId: string;
  runtime: QuizRuntime | null;
  myTeam: TeamRow | null;
}) {
  const show =
    runtime?.phase === "SHOW_LEADERBOARD" || runtime?.phase === "ENDED";

  const [setup, setSetup] = useState<QuizSetup>([]);
  const [partsCount, setPartsCount] = useState<number>(1);

  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(
    runtime?.part_index ?? 1,
  );

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<ResultRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // keep selection in range if runtime changes
  useEffect(() => {
    if (!runtime?.part_index) return;
    setSelectedPartIndex((prev) => prev || runtime.part_index);
  }, [runtime?.part_index]);

  // Load quiz meta (setup + parts_count) when showing results
  useEffect(() => {
    async function loadQuizMeta() {
      const { data, error } = await supabase
        .from("qhl_quizzes")
        .select("parts_count,setup")
        .eq("id", quizId)
        .single();

      if (error) {
        console.error(error);
        setPartsCount(1);
        setSetup([]);
        return;
      }

      const pc = Math.max(1, Math.floor(data?.parts_count ?? 1));
      setPartsCount(pc);
      setSetup(((data?.setup ?? []) as QuizSetup) || []);
    }

    if (show) loadQuizMeta();
  }, [show, quizId]);

  async function loadResults(partIndex: number) {
    if (!myTeam) return;

    setLoading(true);
    setError(null);

    const { data, error: rpcErr } = await supabase.rpc(
      "qhl_player_get_my_part_results",
      {
        p_quiz_id: quizId,
        p_part_index: partIndex,
        p_team_id: myTeam.id,
      },
    );

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message);
      setRow(null);
      setLoading(false);
      return;
    }

    setRow((data?.[0] ?? null) as ResultRow | null);
    setLoading(false);
  }

  useEffect(() => {
    if (!show) return;
    if (!myTeam) return;
    loadResults(selectedPartIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, quizId, myTeam?.id, selectedPartIndex]);

  const part = useMemo(() => {
    if (!setup?.length) return null;
    const idx = Math.max(1, Math.min(selectedPartIndex, setup.length)) - 1;
    return setup[idx] ?? null;
  }, [setup, selectedPartIndex]);

  const answers: AnswersV1 = useMemo(() => {
    if (!part) return { v: 1, rounds: [] };
    return coerceAnswersToPartShape(row?.my_answers ?? null, part);
  }, [row?.my_answers, part]);

  const marks: MarksV1 = useMemo(() => {
    if (!part) return { v: 1, rounds: [] };
    return coerceMarksToPartShape(row?.my_marks ?? null, part);
  }, [row?.my_marks, part]);

  if (!show) return null;

  if (!myTeam) {
    return (
      <div className="qhl-card">
        <div className="text-base font-semibold text-white">Your results</div>
        <div className="mt-1 text-sm text-violet-100/80">
          Join a team to see your results.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
      <div className="qhl-card space-y-4">
        <div>
          <div className="text-base font-semibold text-white">Your results</div>
          <div className="mt-1 text-sm text-violet-100/80">
            Team:{" "}
            <span className="font-medium text-violet-50">{myTeam.name}</span>
          </div>
        </div>

        <button
          onClick={() => loadResults(selectedPartIndex)}
          className="qhl-btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <PartsTabs
        partsCount={partsCount}
        selectedPartIndex={selectedPartIndex}
        onSelect={setSelectedPartIndex}
      />

      {error ? (
        <div className="rounded-xl border border-rose-300/40 bg-rose-400/15 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {row?.needs_manual_review ? (
        <div className="rounded-2xl border border-yellow-300/45 bg-yellow-300/15 p-4">
          <div className="text-sm font-semibold text-yellow-100">
            Manual review
          </div>
          <div className="mt-1 text-sm text-yellow-100/85">
            You missed a phase or your marks weren’t submitted in time — this
            will be manually reviewed after the quiz.
          </div>
          {row.notes ? (
            <div className="mt-2 text-xs text-yellow-100/80">
              Notes: {row.notes}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4">
        <div className="text-sm font-medium text-violet-100/90">Score</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-violet-200/30 bg-violet-900/35 p-3">
            <div className="text-xs text-violet-100/75">
              Part {selectedPartIndex}
            </div>
            <div className="mt-1 font-mono text-2xl text-violet-50">
              {row?.part_points ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-violet-200/30 bg-violet-900/35 p-3">
            <div className="text-xs text-violet-100/75">Total</div>
            <div className="mt-1 font-mono text-2xl text-violet-50">
              {row?.total_points ?? 0}
            </div>
          </div>
        </div>
      </div>

      {part ? (
        <div className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4">
          <div className="text-base font-semibold text-white">
            Your marked sheet
          </div>
          <div className="mt-3">
            <MarkedResultsSheet part={part} answers={answers} marks={marks} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4">
          <div className="text-base font-semibold text-white">
            Your marked sheet
          </div>
          <div className="mt-1 text-sm text-violet-100/80">
            Quiz setup not found for this part yet.
          </div>
        </div>
      )}
    </div>
  );
}
