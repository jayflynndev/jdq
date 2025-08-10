"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

interface Score {
  username: string;
  score: number;
  tiebreaker: number;
  quizDate: string;
}

interface AggregatedScore {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
  count: number;
}

export default function ThursdayLeaderboard({
  searchedUsername,
}: {
  searchedUsername?: string;
}) {
  const [aggregated, setAggregated] = useState<AggregatedScore[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<AggregatedScore | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const allScores = await fetchScoresByType("JVQ");

      // Filter for Thursday scores
      const thursdayScores = allScores.filter((s) => {
        const date = new Date(s.quizDate);
        return date.getDay() === 4; // 4 = Thursday
      });

      const scoresByUser: { [username: string]: Score[] } = {};
      thursdayScores.forEach((s) => {
        if (!scoresByUser[s.username]) {
          scoresByUser[s.username] = [];
        }
        // Ensure score and tiebreaker are numbers (not null)
        scoresByUser[s.username].push({
          ...s,
          score: s.score ?? 0,
          tiebreaker: s.tiebreaker ?? 0,
        });
      });

      const aggregatedData: AggregatedScore[] = Object.entries(
        scoresByUser
      ).map(([username, scores]) => {
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const totalTiebreaker = scores.reduce(
          (sum, s) => sum + s.tiebreaker,
          0
        );
        return {
          username,
          averageScore: totalScore / scores.length,
          averageTiebreaker: totalTiebreaker / scores.length,
          count: scores.length,
        };
      });

      const sorted = aggregatedData.sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker
      );

      setAggregated(sorted);

      if (searchedUsername) {
        const index = sorted.findIndex(
          (s) => s.username.toLowerCase() === searchedUsername.toLowerCase()
        );
        if (index !== -1) {
          setUserIndex(index);
          setUserScore(sorted[index]);
        }
      }
    };

    fetchData();
  }, [searchedUsername]);

  return (
    <div className="space-y-4">
      {/* Header + Toggle */}
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap">
        <h2 className="text-white font-semibold text-lg">
          Thursday Quiz Leaderboard
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
              ? "🎉 You're in the top 10 on Thursdays!"
              : "Here’s your Thursday leaderboard position:"}
          </p>
          <p>
            <strong>#{userIndex! + 1}</strong> – {userScore.username} – Avg:{" "}
            {userScore.averageScore.toFixed(2)} pts (Tiebreak Avg:{" "}
            {userScore.averageTiebreaker.toFixed(1)})
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
        {aggregated.length === 0 && (
          <p className="text-white text-center mt-4">
            No Thursday scores available yet.
          </p>
        )}
      </div>
    </div>
  );
}
