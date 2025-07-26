"use client";
import React, { useEffect, useState } from "react";
import {
  fetchLiveLeaderboardData,
  fetchCombinedLeaderboardData,
} from "@/utils/fetchLiveLeaderboardData";

export const AdminStatsPanel: React.FC<{
  quiz: any;
  currentPart: number;
  currentPubId: string;
  quizStatus: string;
}> = ({ quiz, currentPart, currentPubId, quizStatus }) => {
  const quizId = quiz.id;
  const [leaderboard, setLeaderboard] = useState<{
    pubEntries: any[];
    allEntries: any[];
    pubAverages: any[];
    funnyAnswers: any[];
    overallAverage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizStatus !== "leaderboard") return;

    setLoading(true);

    // If last part of a multi-part quiz, show combined leaderboard
    const isMultiPart = quiz.parts && quiz.parts.length > 1;
    const isLastPart = currentPart === quiz.parts.length;

    const fetchData = async () => {
      let data;
      if (isMultiPart && isLastPart) {
        // Fetch combined leaderboard for ALL parts
        data = await fetchCombinedLeaderboardData(quizId, currentPubId);
      } else {
        // Fetch leaderboard for this single part
        data = await fetchLiveLeaderboardData(
          quizId,
          currentPart,
          currentPubId
        );
      }
      setLeaderboard({
        ...data,
        overallAverage:
          typeof data.overallAverage === "string"
            ? parseFloat(data.overallAverage)
            : data.overallAverage,
        funnyAnswers: data.funnyAnswers ?? [],
      });

      setLoading(false);
    };

    fetchData();
  }, [quiz, quizId, currentPart, currentPubId, quizStatus]);

  // --- UI rendering ---

  return (
    <div className="bg-yellow-100 rounded-xl p-6 shadow">
      <h4 className="text-lg font-bold mb-4 text-purple-700">
        Scores & Averages
      </h4>
      {loading || !leaderboard ? (
        <div className="text-center text-gray-500 py-6">Loading scores…</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* Top 10 Users */}
          <div>
            <div className="font-semibold mb-2 text-purple-700">
              Top 10 Users
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-800">
              {leaderboard.allEntries.length === 0 ? (
                <li>No scores yet.</li>
              ) : (
                leaderboard.allEntries.map((u, i) => (
                  <li key={u.name + u.pubName}>
                    <span className={i < 3 ? "font-bold text-purple-700" : ""}>
                      {u.name}
                    </span>
                    {" — "}
                    <span>
                      {u.score} pts ({u.pubName})
                    </span>
                  </li>
                ))
              )}
            </ol>
          </div>
          {/* Top 3 Pubs by Average */}
          <div>
            <div className="font-semibold mb-2 text-purple-700">
              Top 3 Pubs (Avg)
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-800">
              {leaderboard.pubAverages.length === 0 ? (
                <li>No pub scores yet.</li>
              ) : (
                leaderboard.pubAverages.slice(0, 3).map((p, i) => (
                  <li key={p.name}>
                    <span className={i < 3 ? "font-bold text-purple-700" : ""}>
                      {p.name}
                    </span>
                    {" — "}
                    <span>{p.score.toFixed(2)}</span>
                  </li>
                ))
              )}
            </ol>
          </div>
          {/* Overall Average */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm text-gray-500 mb-1">Overall Avg Score</div>
            <div className="text-4xl font-extrabold text-purple-800">
              {leaderboard.overallAverage
                ? leaderboard.overallAverage.toFixed(2)
                : "No data yet."}
            </div>
          </div>
        </div>
      )}
      {/* Funny Answers Section */}
      {leaderboard?.funnyAnswers && leaderboard.funnyAnswers.length > 0 && (
        <div className="mt-8">
          <h5 className="text-lg font-bold text-purple-700 mb-2">
            Funny Answers
          </h5>
          <ul className="space-y-1">
            {leaderboard.funnyAnswers.map((fa, i) => (
              <li key={i}>
                <span className="font-semibold">
                  {fa.round} Q{fa.question + 1}:
                </span>{" "}
                <span className="text-gray-800">{fa.answer}</span>{" "}
                <span className="text-gray-500">({fa.team})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
