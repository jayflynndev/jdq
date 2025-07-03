"use client";

import { useEffect, useState } from "react";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

interface Score {
  username: string;
  score: number;
  tiebreaker: number;
  quizDate: string;
}

function getMostRecentSaturday(): Date {
  const now = new Date();
  const day = now.getDay(); // Saturday = 6
  const daysSinceSaturday = (day + 7 - 6) % 7;
  const lastSaturday = new Date(now);
  lastSaturday.setDate(now.getDate() - daysSinceSaturday);
  lastSaturday.setHours(20, 30, 0, 0); // 8:30pm
  return lastSaturday;
}

function getNextSaturdayMidnight(lastSaturday: Date): Date {
  const nextSaturday = new Date(lastSaturday);
  nextSaturday.setDate(lastSaturday.getDate() + 7);
  nextSaturday.setHours(0, 0, 0, 0); // Midnight
  return nextSaturday;
}

export default function LastSaturdayLeaderboard({
  searchedUsername,
}: {
  searchedUsername?: string;
}) {
  const [scores, setScores] = useState<Score[]>([]);
  const [showFull, setShowFull] = useState(false);
  const [userIndex, setUserIndex] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<Score | null>(null);
  const [shouldShowScores, setShouldShowScores] = useState(false);
  const [quizDateString, setQuizDateString] = useState("");

  useEffect(() => {
    const now = new Date();
    const lastSaturday = getMostRecentSaturday();
    const nextSaturdayMidnight = getNextSaturdayMidnight(lastSaturday);

    if (now >= lastSaturday && now < nextSaturdayMidnight) {
      setShouldShowScores(true);
      const dateStr = lastSaturday.toISOString().split("T")[0];
      setQuizDateString(dateStr);

      const fetchData = async () => {
        const allScores = await fetchScoresByType("JVQ");
        const filtered = allScores.filter((s) => s.quizDate === dateStr);
        const sorted = filtered.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.tiebreaker - b.tiebreaker;
        });
        setScores(sorted);

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
    }
  }, [searchedUsername]);

  if (!shouldShowScores) {
    return (
      <div className="text-white text-center text-lg font-semibold">
        Scores will begin to show after the live quiz has finished.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center text-white">
        Scores from Saturday {quizDateString}
      </h2>

      {userScore && (
        <div className="bg-green-100 text-black p-4 rounded shadow mb-2">
          {userIndex !== null && userIndex < 10 ? (
            <p className="font-bold mb-1">
              🎉 Congrats! You&#39;re in the top 10 today:
            </p>
          ) : (
            <p className="font-bold mb-1">
              You’re not in the top 10, but here’s your ranking:
            </p>
          )}
          <p>
            <strong>#{userIndex! + 1}</strong> – {userScore.username} –{" "}
            {userScore.score} pts (Tiebreak: {userScore.tiebreaker})
          </p>
        </div>
      )}

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
            No scores available for this quiz.
          </p>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
          onClick={() => setShowFull((prev) => !prev)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>
    </div>
  );
}
