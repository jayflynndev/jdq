"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

interface Score {
  id: string;
  quiz_date: string; // 'YYYY-MM-DD'
  created_at: string; // ISO timestamptz
  score: number | null;
  tiebreaker: number | null;
  day_type?: string | null; // JVQ: 'Thursday' | 'Saturday' | null
  edited_by_user_at?: string | null;
}

interface UserScoreTableProps {
  quizType: "JDQ" | "JVQ";
}

export default function UserScoreTable({ quizType }: UserScoreTableProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Score | null>(null);
  const [newScore, setNewScore] = useState<string>("");
  const [newTb, setNewTb] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const maxScore = quizType === "JDQ" ? 5 : 50; // <-- different rules
  // helper to format YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
  };

  const refreshScores = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setScores([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("scores")
      .select(
        "id, quiz_date, created_at, score, tiebreaker, day_type, edited_by_user_at"
      )
      .eq("uid", user.id)
      .eq("quiz_type", quizType);

    if (error) {
      console.error(error);
      setScores([]);
      setLoading(false);
      return;
    }
    const sorted = (data || []).sort(
      (a: Score, b: Score) =>
        new Date(b.quiz_date).getTime() - new Date(a.quiz_date).getTime()
    ) as Score[];
    setScores(sorted);
    setLoading(false);
  };

  useEffect(() => {
    refreshScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizType]);

  const displayedScores = useMemo(
    () => (showAll ? scores : scores.slice(0, 5)),
    [scores, showAll]
  );

  // 48-hour edit window helper
  const canEdit = (row: Score) => {
    if (row.edited_by_user_at) return false; // already used their one change
    if (!row.created_at) return false;
    const created = new Date(row.created_at).getTime();
    const now = Date.now();
    const hours48 = 48 * 60 * 60 * 1000;
    return now - created <= hours48;
  };

  const openEdit = (row: Score) => {
    setEditing(row);
    setNewScore((row.score ?? 0) + "");
    setNewTb((row.tiebreaker ?? 0) + "");
    setErrorMsg("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setNewScore("");
    setNewTb("");
    setErrorMsg("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    // validation with per-type max
    const s = Number(newScore);
    const tb = Number(newTb);
    if (!Number.isFinite(s) || s < 0 || s > maxScore) {
      setErrorMsg(`Score must be a number between 0 and ${maxScore}.`);
      return;
    }
    if (!Number.isFinite(tb) || tb < 0) {
      setErrorMsg("Tiebreaker must be a number 0 or greater.");
      return;
    }
    if (!canEdit(editing)) {
      setErrorMsg("This score can no longer be edited.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("update_score_once", {
      p_id: editing.id,
      p_score: Math.trunc(s),
      p_tiebreaker: Math.trunc(tb),
    });
    setSaving(false);

    if (error) {
      console.error(error);
      setErrorMsg(
        error.message || "Could not update (already edited or not your score)."
      );
      return;
    }

    await refreshScores();
    closeModal();
  };

  // headers
  const headers =
    quizType === "JDQ"
      ? ["Date", "Score", "Tiebreaker", "Actions"]
      : ["Date", "Day", "Score", "Tiebreaker", "Actions"];

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Your Past {quizType} Scores</h2>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-collapse text-center">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="py-2 border border-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedScores.map((row) => {
                  const editable = canEdit(row);
                  return (
                    <tr key={row.id}>
                      <td className="py-2 border border-gray-300">
                        {formatDate(row.quiz_date)}
                      </td>
                      {quizType === "JVQ" && (
                        <td className="py-2 border border-gray-300">
                          {row.day_type?.slice(0, 3) || ""}
                        </td>
                      )}
                      <td className="py-2 border border-gray-300">
                        {row.score ?? "—"}
                      </td>
                      <td className="py-2 border border-gray-300">
                        {row.tiebreaker ?? "—"}
                      </td>
                      <td className="py-2 border border-gray-300">
                        {row.edited_by_user_at ? (
                          <span className="text-xs text-gray-500">Edited</span>
                        ) : editable ? (
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                            onClick={() => openEdit(row)}
                          >
                            Edit score
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Edit window closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {scores.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-blue-500 hover:underline"
            >
              {showAll ? "Show Less" : "Show All"}
            </button>
          )}
        </>
      )}

      {/* Pretty modal */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">
                Edit score for {formatDate(editing.quiz_date)}
              </h3>
              <p className="text-sm text-gray-500">
                You can edit a score once within 48 hours of submitting.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-medium">Score (0–{maxScore})</label>
                <input
                  type="number"
                  className="w-32 px-3 py-2 border rounded text-black"
                  value={newScore}
                  min={0}
                  max={maxScore}
                  onChange={(e) => setNewScore(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="font-medium">Tiebreaker (0+)</label>
                <input
                  type="number"
                  className="w-32 px-3 py-2 border rounded text-black"
                  value={newTb}
                  min={0}
                  onChange={(e) => setNewTb(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="text-sm text-red-600">{errorMsg}</div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded border hover:bg-gray-100"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
