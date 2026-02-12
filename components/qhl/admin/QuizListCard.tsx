"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QhlQuizRow } from "@/components/qhl/admin/AdminQhlHub";

export function QuizListCard({
  quizzes,
  loading,
  onRefresh,
}: {
  quizzes: QhlQuizRow[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  async function archiveQuiz(quizId: string, quizName: string) {
    const ok = confirm(
      `Archive quiz "${quizName}"?\n\nThis hides it from lists but keeps all data.`,
    );
    if (!ok) return;

    const { error } = await supabase.rpc("qhl_admin_archive_quiz", {
      p_quiz_id: quizId,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await onRefresh();
  }

  async function deleteQuizPermanently(quizId: string, quizName: string) {
    const confirmed = confirm(
      `Permanently delete quiz "${quizName}"?\n\nThis will remove the quiz and all related data and cannot be undone.`,
    );
    if (!confirmed) return;

    const typed = prompt(`Type "${quizName}" to confirm permanent delete:`);
    if (typed !== quizName) {
      alert("Delete cancelled. Quiz name did not match.");
      return;
    }

    setDeletingQuizId(quizId);

    const { error } = await supabase.rpc("qhl_admin_delete_quiz", {
      p_quiz_id: quizId,
    });

    if (error) {
      console.error(error);
      alert(`Could not permanently delete quiz.\n\n${error.message}`);
      setDeletingQuizId(null);
      return;
    }

    setDeletingQuizId(null);
    await onRefresh();
  }

  return (
    <div className="qhl-card space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-bold text-white">Quizzes</div>
          <div className="text-sm text-violet-100/75">
            Edit quiz setup, open rooms, archive, or permanently delete.
          </div>
        </div>

        <button
          className="qhl-btn-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-violet-100/80">Loading...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-sm text-violet-100/80">No quizzes yet.</div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-violet-200/20 bg-violet-950/35 p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-base font-bold text-white md:text-lg">
                    {q.name}
                  </div>

                  <div className="mt-1 text-sm text-violet-100/75">
                    Starts:{" "}
                    {q.starts_at ? new Date(q.starts_at).toLocaleString() : "-"}
                  </div>

                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
                    Parts: {q.parts_count}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/admin/qhl/quizzes/${q.id}/edit`}
                    className="qhl-btn-secondary"
                  >
                    Edit
                  </Link>

                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-rose-300/40 bg-rose-400/15 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/25"
                    onClick={() => archiveQuiz(q.id, q.name)}
                    title="Soft delete (archive)"
                  >
                    Archive
                  </button>

                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-red-300/50 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => deleteQuizPermanently(q.id, q.name)}
                    title="Hard delete quiz and all related data"
                    disabled={deletingQuizId === q.id}
                  >
                    {deletingQuizId === q.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/admin/qhl/quizzes/${q.id}`}
                  className="qhl-btn-secondary text-center"
                >
                  Control Room
                </Link>

                <Link
                  href={`/qhl/players/qhl/${q.id}`}
                  className="qhl-btn-primary text-center"
                >
                  Player Room
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
