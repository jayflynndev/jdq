"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType, Score } from "@/utils/fetchScoresByType";

type Row = {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
};

export default function AllTimeLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: string;
  searchedUsername?: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Row | null>(null);

  useEffect(() => {
    const run = async () => {
      const data = await fetchScoresByType(quizType); // all for type

      const map = new Map<string, Score[]>();
      for (const s of data) {
        const key = s.username || "Unknown";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      }

      const agg: Row[] = [];
      for (const [username, list] of map) {
        if (list.length < 20) continue; // ≥20 entries
        const scores = list.map((x) => x.score ?? 0);
        const tbs = list.map((x) => x.tiebreaker ?? Number.POSITIVE_INFINITY);
        const avgScore = scores.reduce((a, b) => a + b, 0) / list.length;
        const finiteTb = tbs.filter((x) => Number.isFinite(x)) as number[];
        const avgTb =
          finiteTb.length > 0
            ? finiteTb.reduce((a, b) => a + b, 0) / finiteTb.length
            : Number.POSITIVE_INFINITY;

        agg.push({
          username,
          averageScore: Math.round(avgScore * 100) / 100,
          averageTiebreaker: Number.isFinite(avgTb)
            ? Math.round(avgTb * 100) / 100
            : 999999,
        });
      }

      agg.sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker ||
          a.username.localeCompare(b.username)
      );

      setRows(agg);

      if (searchedUsername) {
        const idx = agg.findIndex(
          (u) => u.username.toLowerCase() === searchedUsername.toLowerCase()
        );
        setUserIndex(idx !== -1 ? idx : null);
        setUserScore(idx !== -1 ? agg[idx] : null);
      } else {
        setUserIndex(null);
        setUserScore(null);
      }
    };
    run();
  }, [quizType, searchedUsername]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowFull((p) => !p)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          {userIndex !== null && userIndex < 10 ? (
            <p className="font-bold mb-1">🎉 You’re in the top 10 all-time:</p>
          ) : (
            <p className="font-bold mb-1">
              You’re not in the top 10, but here’s your all-time ranking:
            </p>
          )}
          <p>
            <strong>#{(userIndex ?? 0) + 1}</strong> – {userScore.username} –{" "}
            {userScore.averageScore} avg (Tiebreak avg:{" "}
            {userScore.averageTiebreaker})
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-black rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-center">
              <th className="py-2 px-4">Position</th>
              <th className="py-2 px-4">Username</th>
              <th className="py-2 px-4">Avg Score</th>
              <th className="py-2 px-4">Avg Tiebreak</th>
            </tr>
          </thead>
          <tbody>
            {(showFull ? rows : rows.slice(0, 10)).map((u, i) => (
              <tr
                key={u.username}
                className={`border-t border-gray-300 text-center ${
                  searchedUsername &&
                  u.username.toLowerCase() === searchedUsername.toLowerCase()
                    ? "bg-green-100 font-bold"
                    : ""
                }`}
              >
                <td className="py-2 px-4 font-bold">#{i + 1}</td>
                <td className="py-2 px-4">{u.username}</td>
                <td className="py-2 px-4">{u.averageScore}</td>
                <td className="py-2 px-4">{u.averageTiebreaker}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-white text-center mt-4">
            No scores yet. (Minimum 20 entries)
          </p>
        )}
      </div>
    </div>
  );
}
