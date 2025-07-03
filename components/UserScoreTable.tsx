// components/UserScoreTable.tsx
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

interface UserScoreTableProps {
  quizType: "JDQ" | "JVQ";
}

export default function UserScoreTable({ quizType }: UserScoreTableProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // fetchScores now takes quizType as second argument
        const data = await fetchScores(user.uid, quizType);
        // sort descending by date
        const sorted = data.sort(
          (a, b) =>
            new Date(b.quizDate).getTime() - new Date(a.quizDate).getTime()
        );
        setScores(sorted);
      }
    });

    return () => unsubscribe();
  }, [quizType]);

  const displayedScores = showAll ? scores : scores.slice(0, 5);

  // Column definitions
  const headers =
    quizType === "JDQ"
      ? ["Date", "Score", "Tiebreaker"]
      : ["Date", "Day", "Score", "Tiebreaker"];

  const renderRow = (score: Score, idx: number) => {
    const cells = [
      <td key="date" className="py-2 border border-gray-300">
        {score.quizDate}
      </td>,
    ];

    if (quizType === "JVQ") {
      const day = new Date(score.quizDate).getDay();
      const label = day === 4 ? "Thu" : day === 6 ? "Sat" : "";
      cells.push(
        <td key="day" className="py-2 border border-gray-300">
          {label}
        </td>
      );
    }

    cells.push(
      <td key="score" className="py-2 border border-gray-300">
        {score.score}
      </td>,
      <td key="tb" className="py-2 border border-gray-300">
        {score.tiebreaker}
      </td>
    );

    return <tr key={idx}>{cells}</tr>;
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Your Past {quizType} Scores</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-collapse text-center">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="py-2 border border-gray-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{displayedScores.map((s, i) => renderRow(s, i))}</tbody>
        </table>
      </div>

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
