"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import UserScoreTable from "@/components/UserScoreTable";
import Link from "next/link";

// Utility to get averages for JVQ scores
function calculateAveragesJVQ(scores: Score[]) {
  if (!scores.length) {
    return { thursdayAverage: 0, saturdayAverage: 0, combinedAverage: 0 };
  }
  let thursdayScores = 0,
    thursdayCount = 0;
  let saturdayScores = 0,
    saturdayCount = 0;
  let allScores = 0;

  scores.forEach((s) => {
    if (s.day_type === "Thursday") {
      thursdayScores += s.score;
      thursdayCount++;
    }
    if (s.day_type === "Saturday") {
      saturdayScores += s.score;
      saturdayCount++;
    }
    allScores += s.score;
  });

  return {
    thursdayAverage: thursdayCount ? thursdayScores / thursdayCount : 0,
    saturdayAverage: saturdayCount ? saturdayScores / saturdayCount : 0,
    combinedAverage: scores.length ? allScores / scores.length : 0,
  };
}

interface Score {
  quiz_date: string;
  score: number;
  tiebreaker: number;
  day_type?: string;
}

interface Props {
  onBack: () => void;
}

export default function JvqScoreSummary({ onBack }: Props) {
  const [thursdayAverage, setThursdayAverage] = useState(0);
  const [saturdayAverage, setSaturdayAverage] = useState(0);
  const [combinedAverage, setCombinedAverage] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Username from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "");

      // Get JVQ scores for user
      const { data: scores } = await supabase
        .from("scores")
        .select("quiz_date, score, tiebreaker, day_type")
        .eq("uid", user.id)
        .eq("quiz_type", "JVQ");

      const avgs = calculateAveragesJVQ(scores || []);
      setThursdayAverage(avgs.thursdayAverage);
      setSaturdayAverage(avgs.saturdayAverage);
      setCombinedAverage(avgs.combinedAverage);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow-md text-center">
      <h2 className="text-2xl font-bold mb-4">{username}&apos;s JVQ Summary</h2>
      <table className="min-w-full bg-white border-collapse text-center mb-4">
        <thead>
          <tr>
            <th className="py-2 border border-gray-300"></th>
            <th className="py-2 border border-gray-300">Thursday</th>
            <th className="py-2 border border-gray-300">Saturday</th>
            <th className="py-2 border border-gray-300">Combined</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 border border-gray-300">Averages</td>
            <td className="py-2 border border-gray-300">
              {thursdayAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {saturdayAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {combinedAverage.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={4}
              className="border border-gray-300 bg-slate-300 text-center font-semibold py-4"
            >
              To see your position against others, head to the leaderboard page
              ➡️{" "}
              <Link
                href="/lb-select/jvpqlb"
                className="underline text-blue-600"
              >
                here.
              </Link>{" "}
              ⬅️
            </td>
          </tr>
        </tbody>
      </table>
      <UserScoreTable quizType="JVQ" />
      <button
        onClick={onBack}
        className="mt-4 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
