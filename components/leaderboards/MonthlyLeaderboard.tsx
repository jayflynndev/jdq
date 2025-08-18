"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

type Row = {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
  entries: number;
};

// get first/last day ISO (YYYY-MM-DD) for a selected YYYY-MM month
function getMonthRange(yyyymm: string) {
  // yyyymm like "2025-08"
  const [y, m] = yyyymm.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(start), to: iso(end) };
}

export default function MonthlyLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: "JDQ" | "JVQ";
  searchedUsername?: string;
}) {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [rows, setRows] = useState<Row[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { from, to } = getMonthRange(selectedMonth);

      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_quiz_type: quizType,
        p_date_from: from, // "2025-08-01"
        p_date_to: to, // "2025-08-31"
        p_min_entries: 5,
      });

      if (error) {
        console.error("Monthly RPC error:", error);
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
  }, [quizType, selectedMonth]);

  // search highlight (no re-fetch)
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

  const renderPos = (rank: number) => {
    const medal =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
    return (
      <span className="inline-flex items-center gap-2">
        {medal && <span aria-hidden>{medal}</span>}
        <span className="font-semibold">#{rank}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <label className="text-white font-semibold">
          Select month:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={defaultMonth}
            className="ml-2 rounded px-2 py-1 text-black"
          />
        </label>

        <button
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-card hover:opacity-90"
          onClick={() => setShowFull((p) => !p)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {/* Highlight */}
      {highlightRow && (
        <div className="mb-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-card">
          {highlightIndex !== null && highlightIndex < 10 ? (
            <p className="mb-1 font-bold">🎉 You’re in the monthly top 10!</p>
          ) : (
            <p className="mb-1 font-bold">Your monthly ranking:</p>
          )}
          <p>
            <strong>#{(highlightIndex ?? 0) + 1}</strong> —{" "}
            {highlightRow.username} — {highlightRow.averageScore.toFixed(2)} avg
            (Tiebreak avg: {highlightRow.averageTiebreaker})
          </p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-white/80">
          Loading monthly leaderboard…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border borderc bg-white shadow-card">
          <table className="min-w-full table-fixed text-black">
            <thead className="sticky top-0 z-10 bg-surface-subtle">
              <tr className="text-textc">
                <th className="px-4 py-2 text-left w-28">Position</th>
                <th className="px-4 py-2 text-center">Username</th>
                <th className="px-4 py-2 text-right w-28">Avg Score</th>
                <th className="px-4 py-2 text-right w-32">Avg Tiebreak</th>
                <th className="px-4 py-2 text-right w-24">Entries</th>
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
                    <td className="px-4 py-2 text-left w-28">
                      {renderPos(rank)}
                    </td>
                    <td
                      className={`px-4 py-2 ${
                        rank <= 3 ? "font-semibold" : ""
                      }`}
                    >
                      {u.username}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {u.averageScore.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {u.averageTiebreaker}
                    </td>
                    <td className="px-4 py-2 text-right">{u.entries}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="p-4 text-center text-textc-muted">
              No scores this month. (Minimum 5 entries)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
