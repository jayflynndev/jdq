"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";
import type { TeamRow } from "@/src/qhl/teamTypes";

type ResultRow = {
  my_answers: unknown;
  my_marks: unknown;
  part_points: number;
  total_points: number;
  needs_manual_review: boolean;
  notes: string | null;
};

export function MyResultsCard({
  quizId,
  runtime,
  myTeam,
}: {
  quizId: string;
  runtime: QuizRuntime | null;
  myTeam: TeamRow | null;
}) {
  const show = runtime?.phase === "SHOW_LEADERBOARD";
  const partIndex = runtime?.part_index ?? 1;

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<ResultRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
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

    const first = (data?.[0] ?? null) as ResultRow | null;
    setRow(first);
    setLoading(false);
  }

  useEffect(() => {
    if (!show) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, quizId, partIndex, myTeam?.id]);

  if (!show) return null;

  if (!myTeam) {
    return (
      <div className="rounded-xl border p-4">
        <div className="font-medium">Your results</div>
        <div className="mt-1 text-sm opacity-70">
          Join a team to see your results.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">Your results (Part {partIndex})</div>
          <div className="text-sm opacity-70">
            Team: <span className="font-medium">{myTeam.name}</span>
          </div>
        </div>

        <button
          onClick={load}
          className="rounded border px-3 py-2 text-sm"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {row?.needs_manual_review && (
        <div className="rounded border p-3">
          <div className="font-medium">Manual review</div>
          <div className="text-sm opacity-70 mt-1">
            You missed a phase or your marks weren’t submitted in time — this
            will be manually reviewed after the quiz. Carry on from here.
          </div>
          {row.notes ? (
            <div className="mt-2 text-xs opacity-70">Notes: {row.notes}</div>
          ) : null}
        </div>
      )}

      <div className="rounded border p-3">
        <div className="text-sm opacity-70">Score</div>
        <div className="mt-1 flex gap-4">
          <div>
            <div className="text-xs opacity-70">This part</div>
            <div className="font-mono text-lg">{row?.part_points ?? 0}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">Total</div>
            <div className="font-mono text-lg">{row?.total_points ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="rounded border p-3">
        <div className="font-medium">Your submitted answers</div>
        <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-sm">
          {JSON.stringify(row?.my_answers ?? {}, null, 2)}
        </pre>
      </div>

      <div className="rounded border p-3">
        <div className="font-medium">Marks received</div>
        <div className="text-xs opacity-70 mt-1">
          (Marker identity is hidden to prevent bias.)
        </div>
        <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-sm">
          {JSON.stringify(row?.my_marks ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
