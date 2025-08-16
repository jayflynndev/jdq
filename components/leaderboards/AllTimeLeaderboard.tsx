"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

type Row = {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
  entries: number;
};

export default function AllTimeLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: "JDQ" | "JVQ";
  searchedUsername?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_quiz_type: quizType,
        p_date_from: null,
        p_date_to: null,
        p_day_types: null,
        p_start_date: null,
        p_min_entries: 20,
      });

      if (error) {
        console.error("AllTime RPC error:", error);
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const mapped: Row[] = (data ?? []).map((r: any) => ({
        username: r.username ?? "Unknown",
        averageScore: Number(r.avg_score ?? 0),
        averageTiebreaker:
          r.avg_tiebreaker === null ? 999999 : Number(r.avg_tiebreaker),
        entries: Number(r.entries ?? 0),
      }));

      if (!cancelled) {
        setRows(mapped);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [quizType]);

  const { highlightIndex, highlightRow } = useMemo(() => {
    if (!searchedUsername)
      return {
        highlightIndex: null as number | null,
        highlightRow: null as Row | null,
      };
    const idx = rows.findIndex(
      (u) => u.username.toLowerCase() === searchedUsername.toLowerCase()
    );
    return {
      highlightIndex: idx >= 0 ? idx : null,
      highlightRow: idx >= 0 ? rows[idx] : null,
    };
  }, [rows, searchedUsername]);

  if (loading) {
    return (
      <div className="text-sm text-white/80">Loading all-time leaderboard…</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex justify-end">
        <button
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-card hover:opacity-90"
          onClick={() => setShowFull((p) => !p)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {highlightRow && (
        <div className="mb-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-card">
          {highlightIndex !== null && highlightIndex < 10 ? (
            <p className="mb-1 font-bold">🎉 You’re in the top 10 all-time!</p>
          ) : (
            <p className="mb-1 font-bold">Your all-time ranking:</p>
          )}
          <p>
            <strong>#{(highlightIndex ?? 0) + 1}</strong> —{" "}
            {highlightRow.username} — {highlightRow.averageScore.toFixed(2)} avg
            (Tiebreak avg: {highlightRow.averageTiebreaker})
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border borderc bg-white shadow-card">
        <table className="min-w-full table-fixed text-black">
          <thead className="sticky top-0 z-10 bg-surface-subtle">
            <tr className="text-textc">
              <th className="py-2 px-4 text-center w-28">Position</th>
              <th className="py-2 px-4 text-center">Username</th>
              <th className="py-2 px-4 text-right w-28">Avg Score</th>
              <th className="py-2 px-4 text-right w-32">Avg Tiebreak</th>
            </tr>
          </thead>
          <tbody>
            {(showFull ? rows : rows.slice(0, 10)).map((u, i) => {
              const rank = i + 1;
              const topBg =
                rank === 1
                  ? "bg-amber-50"
                  : rank === 2
                  ? "bg-zinc-50"
                  : rank === 3
                  ? "bg-orange-50"
                  : "";

              const highlight =
                !!searchedUsername &&
                u.username.toLowerCase() === searchedUsername.toLowerCase();

              return (
                <tr
                  key={`${u.username}-${i}`}
                  className={[
                    "border-t border-gray-200 transition-colors hover:bg-surface-subtle/60",
                    topBg,
                    highlight ? "ring-2 ring-brand/50" : "",
                  ].join(" ")}
                >
                  <td className="py-2 px-4 text-left w-28">
                    <span className="inline-flex items-center gap-2">
                      {rank === 1
                        ? "🥇"
                        : rank === 2
                        ? "🥈"
                        : rank === 3
                        ? "🥉"
                        : null}
                      <span className="font-semibold">#{rank}</span>
                    </span>
                  </td>
                  <td
                    className={`py-2 px-4 ${rank <= 3 ? "font-semibold" : ""}`}
                  >
                    {u.username}
                  </td>
                  <td className="py-2 px-4 text-right">
                    {u.averageScore.toFixed(2)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    {u.averageTiebreaker}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="p-4 text-center text-textc-muted">
            No scores yet. (Minimum 20 entries)
          </p>
        )}
      </div>
    </div>
  );
}
