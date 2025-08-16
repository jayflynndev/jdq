"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

type Score = {
  user_id: string;
  username: string;
  score: number | null;
  tiebreaker: number | null;
  quizDate: string;
};

export default function DailyLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: "JDQ" | "JVQ";
  searchedUsername?: string;
}) {
  const todayISO = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [scores, setScores] = useState<Score[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      // fetch only this date from the DB
      const rows = await fetchScoresByType(quizType, { date: selectedDate });

      // sort: score desc, then tiebreak asc (null = worst)
      const sorted = [...rows].sort((a, b) => {
        const as = a.score ?? -Infinity;
        const bs = b.score ?? -Infinity;
        if (bs !== as) return bs - as;
        const at = a.tiebreaker ?? Number.POSITIVE_INFINITY;
        const bt = b.tiebreaker ?? Number.POSITIVE_INFINITY;
        return at - bt;
      });

      // dedupe: keep best per user_id
      const seen = new Set<string>();
      const uniqueBest: Score[] = [];
      for (const r of sorted) {
        if (!seen.has(r.user_id)) {
          seen.add(r.user_id);
          uniqueBest.push(r);
        }
      }

      if (!cancelled) {
        setScores(uniqueBest);

        if (searchedUsername) {
          const idx = uniqueBest.findIndex(
            (s) => s.username?.toLowerCase() === searchedUsername.toLowerCase()
          );
          setUserIndex(idx !== -1 ? idx : null);
          setUserScore(idx !== -1 ? uniqueBest[idx] : null);
        } else {
          setUserIndex(null);
          setUserScore(null);
        }

        setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, searchedUsername, quizType]);

  const renderPosCell = (rank: number) => {
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
      {/* Date Picker + Toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <label className="text-white font-semibold">
          Select a date:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={todayISO}
            className="ml-2 rounded px-2 py-1 text-black"
          />
        </label>

        <button
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-card hover:opacity-90"
          onClick={() => setShowFull((prev) => !prev)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {/* User Highlight Box */}
      {userScore && (
        <div className="mb-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-card">
          {userIndex !== null && userIndex < 10 ? (
            <p className="mb-1 font-bold">🎉 You’re in today’s top 10!</p>
          ) : (
            <p className="mb-1 font-bold">Your daily ranking:</p>
          )}
          <p>
            <strong>#{(userIndex ?? 0) + 1}</strong> — {userScore.username} —{" "}
            {userScore.score} pts (Tiebreak: {userScore.tiebreaker ?? "—"})
          </p>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-sm text-white/80">Loading daily leaderboard…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border borderc bg-white shadow-card">
          <table className="min-w-full text-black table-fixed">
            <thead className="sticky top-0 z-10 bg-surface-subtle">
              <tr className="text-textc">
                <th className="px-4 py-2 text-left w-28">Position</th>
                <th className="px-4 py-2 text-center">Username</th>
                <th className="px-4 py-2 text-right w-24">Score</th>
                <th className="px-4 py-2 text-right w-28">Tiebreak</th>
              </tr>
            </thead>
            <tbody>
              {(showFull ? scores : scores.slice(0, 10)).map((user, index) => {
                const rank = index + 1;

                // top-3 backgrounds
                const topBg =
                  rank === 1
                    ? "bg-amber-50"
                    : rank === 2
                    ? "bg-zinc-50"
                    : rank === 3
                    ? "bg-orange-50"
                    : "";

                const isSearchedMatch =
                  !!searchedUsername &&
                  user.username?.toLowerCase() ===
                    searchedUsername.toLowerCase();

                return (
                  <tr
                    key={user.user_id}
                    className={[
                      "border-t border-gray-200 transition-colors hover:bg-surface-subtle/60",
                      topBg,
                      isSearchedMatch ? "ring-2 ring-brand/50" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-2 text-left w-28">
                      {renderPosCell(rank)}
                    </td>
                    <td
                      className={`px-4 py-2 ${
                        rank <= 3 ? "font-semibold" : ""
                      }`}
                    >
                      {user.username}
                    </td>
                    <td className="px-4 py-2 text-right w-24  tabular-nums">
                      {user.score}
                    </td>
                    <td className="px-4 py-2 text-right w-28  tabular-nums">
                      {user.tiebreaker ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {scores.length === 0 && (
            <p className="p-4 text-center text-textc-muted">
              No scores available for this day.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
