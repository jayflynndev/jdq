"use client";
import { useEffect, useState } from "react";
import { auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { fetchScores } from "@/utils/fetchScores";

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

export default function UserScoreTable() {
  const [scores, setScores] = useState<Score[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const data = await fetchScores(user.uid);
        const sorted = data.sort(
          (a, b) =>
            new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime()
        );
        setScores(sorted);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayedScores = showAll ? scores : scores.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Your Past JDQ Scores</h2>
      <table className="min-w-full bg-white border-collapse text-center">
        <thead>
          <tr>
            <th className="py-2 border border-gray-300">Date</th>
            <th className="py-2 border border-gray-300">Score</th>
            <th className="py-2 border border-gray-300">Tiebreaker</th>
          </tr>
        </thead>
        <tbody>
          {displayedScores.map((score, index) => (
            <tr key={index}>
              <td className="py-2 border border-gray-300">{score.quizDate}</td>
              <td className="py-2 border border-gray-300">
                {score.score.toFixed(2)}
              </td>
              <td className="py-2 border border-gray-300">
                {score.tiebreaker.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {scores.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-blue-500 hover:underline"
        >
          {showAll ? "Show Less" : "Show All"}
        </button>
      )}
    </div>
  );
}
