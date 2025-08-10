"use client";

import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

interface Score {
  username: string;
  score: number | null;
  tiebreaker: number | null;
  quizDate: string;
}

interface AggregatedScore {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
  count: number;
}

export default function CombinedJVQLeaderboard({
  searchedUsername,
}: {
  searchedUsername?: string;
}) {
  const [aggregated, setAggregated] = useState<AggregatedScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<AggregatedScore | null>(null);

  useEffect(() => {
    // Reset highlight
    setUserIndex(null);
    setUserScore(null);
    setLoading(true);

    const fetchData = async () => {
      const allScores = await fetchScoresByType("JVQ");
      console.log("Fetched JVQ scores:", allScores);

      // Group by user
      const byUser: Record<string, Score[]> = {};
      allScores.forEach((s) => {
        byUser[s.username] = byUser[s.username] || [];
        byUser[s.username].push(s);
      });

      // Build & filter
      const agg: AggregatedScore[] = Object.entries(byUser)
        .map(([username, scores]) => {
          const count = scores.length;
          const totalScore = scores.reduce((sum, s) => sum + (s.score ?? 0), 0);
          const totalTb = scores.reduce(
            (sum, s) => sum + (s.tiebreaker ?? 0),
            0
          );
          return {
            username,
            averageScore: totalScore / count,
            averageTiebreaker: totalTb / count,
            count,
          };
        })
        .filter((u) => u.count >= 10);

      console.log("After filtering ≥10 entries:", agg);

      // Sort
      agg.sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker
      );

      setAggregated(agg);

      // Highlight search
      if (searchedUsername) {
        const idx = agg.findIndex(
          (u) => u.username.toLowerCase() === searchedUsername.toLowerCase()
        );
        if (idx !== -1) {
          setUserIndex(idx);
          setUserScore(agg[idx]);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [searchedUsername]);

  if (loading) {
    return <p className="text-black text-center mt-4">Loading…</p>;
  }

  // Early return if nobody qualifies
  if (aggregated.length === 0) {
    return (
      <p className="text-black font-bold text-xl text-center">
        No users have at least 10 JVQ entries yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Toggle */}
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap">
        <h2 className="text-white font-semibold text-lg">
          Combined JVQ Leaderboard
        </h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowFull((prev) => !prev)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {/* User Highlight Box */}
      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          <p className="font-bold mb-1">
            {userIndex! < 10
              ? "🎉 Congrats! You’re in the top 10 across all JVQ quizzes!"
              : "Here’s your combined JVQ ranking:"}
          </p>
          <p>
            <strong>#{userIndex! + 1}</strong> – {userScore.username} – Avg:{" "}
            {userScore.averageScore.toFixed(2)} pts (Tiebreak Avg:{" "}
            {userScore.averageTiebreaker.toFixed(1)}) – Entries:{" "}
            {userScore.count}
          </p>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-black rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="py-2 px-4">Position</th>
              <th className="py-2 px-4">Username</th>
              <th className="py-2 px-4">Avg Score</th>
              <th className="py-2 px-4">Avg Tiebreak</th>
              <th className="py-2 px-4">Entries</th>
            </tr>
          </thead>
          <tbody>
            {(showFull ? aggregated : aggregated.slice(0, 10)).map(
              (user, idx) => (
                <tr
                  key={user.username}
                  className={`border-t border-gray-300 text-center ${
                    searchedUsername &&
                    user.username.toLowerCase() ===
                      searchedUsername.toLowerCase()
                      ? "bg-green-100 font-bold"
                      : ""
                  }`}
                >
                  <td className="py-2 px-4 font-bold">#{idx + 1}</td>
                  <td className="py-2 px-4">{user.username}</td>
                  <td className="py-2 px-4">{user.averageScore.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    {user.averageTiebreaker.toFixed(1)}
                  </td>
                  <td className="py-2 px-4">{user.count}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
