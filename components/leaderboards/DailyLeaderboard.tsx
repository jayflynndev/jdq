"use client";
import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

interface Score {
  username: string;
  score: number;
  tiebreaker: number;
  quizDate: string;
}

export default function DailyLeaderboard({
  quizType,
  searchedUsername,
}: {
  quizType: string;
  searchedUsername?: string;
}) {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [scores, setScores] = useState<Score[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Score | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const allScores = await fetchScoresByType(quizType);
      const dailyScores = allScores.filter((s) => s.quizDate === selectedDate);

      const sorted = dailyScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.tiebreaker - b.tiebreaker; // lower tiebreaker wins
      });

      setScores(sorted);

      if (searchedUsername) {
        const index = sorted.findIndex(
          (s) => s.username.toLowerCase() === searchedUsername.toLowerCase()
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
    fetchData();
  }, [selectedDate, searchedUsername, quizType]);

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="flex justify-between items-center gap-4 mb-4 flex-wrap">
        <label className="text-white font-semibold">
          Select a date:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
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

      {/* User Highlight Box */}
      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          {userIndex !== null && userIndex < 10 ? (
            <p className="font-bold mb-1">
              🎉 Congrats! You&#39;re in the top 10 today:
            </p>
          ) : (
            <p className="font-bold mb-1">
              You’re not in the top 10, but here’s your daily ranking:
            </p>
          )}
          <p>
            <strong>#{userIndex! + 1}</strong> – {userScore.username} –{" "}
            {userScore.score} pts (Tiebreak: {userScore.tiebreaker})
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
              <th className="py-2 px-4">Score</th>
              <th className="py-2 px-4">Tiebreak</th>
            </tr>
          </thead>
          <tbody>
            {(showFull ? scores : scores.slice(0, 10)).map((user, index) => (
              <tr
                key={index}
                className={`border-t border-gray-300 text-center ${
                  searchedUsername &&
                  user.username.toLowerCase() === searchedUsername.toLowerCase()
                    ? "bg-green-100 font-bold"
                    : ""
                }`}
              >
                <td className="py-2 px-4 font-bold">#{index + 1}</td>
                <td className="py-2 px-4">{user.username}</td>
                <td className="py-2 px-4">{user.score}</td>
                <td className="py-2 px-4">{user.tiebreaker}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {scores.length === 0 && (
          <p className="text-white text-center mt-4">
            No scores available for this day.
          </p>
        )}
      </div>
    </div>
  );
}
