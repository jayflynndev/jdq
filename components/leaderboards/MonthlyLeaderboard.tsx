"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

interface Score {
  username: string;
  score: number;
  tiebreaker: number;
  quizDate: string;
  // For aggregated scores, these fields are used:
  averageScore?: number;
  averageTiebreaker?: number;
}

export default function MonthlyLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: string;
  searchedUsername?: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const [aggregatedScores, setAggregatedScores] = useState<Score[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Score | null>(null);

  useEffect(() => {
    const fetchAndAggregate = async () => {
      const allScores = await fetchScoresByType(quizType);
      const filtered = allScores.filter((s) =>
        s.quizDate.startsWith(selectedMonth)
      );

      const userMap: { [username: string]: Score[] } = {};
      filtered.forEach((score) => {
        if (!userMap[score.username]) userMap[score.username] = [];
        userMap[score.username].push(score);
      });

      const aggregated = Object.entries(userMap)
        .filter(([, scores]) => scores.length >= 5)
        .map(([username, scores]) => {
          const total = scores.reduce((sum, s) => sum + s.score, 0);
          const tbTotal = scores.reduce((sum, s) => sum + s.tiebreaker, 0);
          return {
            username,
            score: 0,
            tiebreaker: 0,
            quizDate: "",
            averageScore: Math.round((total / scores.length) * 100) / 100,
            averageTiebreaker:
              Math.round((tbTotal / scores.length) * 100) / 100,
          };
        });

      const sorted = aggregated.sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker
      );

      setAggregatedScores(sorted);

      if (searchedUsername) {
        const index = sorted.findIndex(
          (u) => u.username.toLowerCase() === searchedUsername.toLowerCase()
        );
        if (index !== -1) {
          setUserIndex(index);
          setUserScore(sorted[index]);
        } else {
          setUserIndex(null);
          setUserScore(null);
        }
      }
    };

    fetchAndAggregate();
  }, [selectedMonth, searchedUsername, quizType]);

  return (
    <div className="space-y-4">
      {/* Month Picker */}
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap">
        <label className="text-white font-semibold">
          Select a month:
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="ml-2 px-2 py-1 rounded text-black"
          />
        </label>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowFull((prev) => !prev)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {/* User Search Result */}
      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          {userIndex !== null && userIndex < 10 ? (
            <p className="font-bold mb-1">
              🎉 Congrats! You&#39;re in the top 10 this month:
            </p>
          ) : (
            <p className="font-bold mb-1">
              You’re not in the top 10, but here’s your current monthly ranking:
            </p>
          )}
          <p>
            <strong>#{userIndex! + 1}</strong> – {userScore.username} –{" "}
            {userScore.averageScore} avg (Tiebreak avg:{" "}
            {userScore.averageTiebreaker})
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
            </tr>
          </thead>
          <tbody>
            {(showFull ? aggregatedScores : aggregatedScores.slice(0, 10)).map(
              (user, index) => (
                <tr
                  key={index}
                  className={`border-t border-gray-300 text-center ${
                    searchedUsername &&
                    user.username.toLowerCase() ===
                      searchedUsername.toLowerCase()
                      ? "bg-green-100 font-bold"
                      : ""
                  }`}
                >
                  <td className="py-2 px-4 font-bold">#{index + 1}</td>
                  <td className="py-2 px-4">{user.username}</td>
                  <td className="py-2 px-4">{user.averageScore}</td>
                  <td className="py-2 px-4">{user.averageTiebreaker}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
        {aggregatedScores.length === 0 && (
          <p className="text-white text-center mt-4">
            No scores available for this month. A minimum of 5 entries is
            required to appear on the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}
