"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import UserScoreTable from "@/components/UserScoreTable";
import Link from "next/link";
import { getWeekNumber } from "@/utils/dateUtils"; // We'll show you how if you need this utility

interface Props {
  onBack: () => void;
}

interface Score {
  id: string;
  uid: string;
  quiz_date: string;
  score: number;
  quiz_type: string;
}

function calculateAverages(scores: Score[]) {
  if (!scores.length) {
    return {
      weeklyAverage: 0,
      monthlyAverage: 0,
      allTimeAverage: 0,
    };
  }
  const today = new Date();
  const thisWeek = getWeekNumber(today);
  const thisMonth = today.getMonth() + 1;
  const thisYear = today.getFullYear();

  let weeklyScores = 0,
    weeklyCount = 0,
    monthlyScores = 0,
    monthlyCount = 0,
    allTimeScores = 0;

  scores.forEach((s) => {
    const date = new Date(s.quiz_date);
    if (getWeekNumber(date) === thisWeek && date.getFullYear() === thisYear) {
      weeklyScores += s.score;
      weeklyCount++;
    }
    if (date.getMonth() + 1 === thisMonth && date.getFullYear() === thisYear) {
      monthlyScores += s.score;
      monthlyCount++;
    }
    allTimeScores += s.score;
  });

  return {
    weeklyAverage: weeklyCount ? weeklyScores / weeklyCount : 0,
    monthlyAverage: monthlyCount ? monthlyScores / monthlyCount : 0,
    allTimeAverage: scores.length ? allTimeScores / scores.length : 0,
  };
}

export default function JdqScoreSummary({ onBack }: Props) {
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [allTimeAverage, setAllTimeAverage] = useState(0);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get username from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "");

      // Get all JDQ scores for user
      const { data: scores } = await supabase
        .from("scores")
        .select("id, uid, quiz_date, score, quiz_type")
        .eq("uid", user.id)
        .eq("quiz_type", "JDQ");

      const avgs = calculateAverages(scores || []);
      setWeeklyAverage(avgs.weeklyAverage);
      setMonthlyAverage(avgs.monthlyAverage);
      setAllTimeAverage(avgs.allTimeAverage);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow-md text-center">
      <h2 className="text-2xl font-bold mb-4">{username}&apos;s JDQ Summary</h2>
      <table className="min-w-full bg-white border-collapse text-center mb-4">
        <thead>
          <tr>
            <th className="py-2 border border-gray-300"></th>
            <th className="py-2 border border-gray-300">Weekly</th>
            <th className="py-2 border border-gray-300">Monthly</th>
            <th className="py-2 border border-gray-300">All Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 border border-gray-300">Averages</td>
            <td className="py-2 border border-gray-300">
              {loading ? "-" : weeklyAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {loading ? "-" : monthlyAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {loading ? "-" : allTimeAverage.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={4}
              className="border border-gray-300 bg-slate-300 text-center font-semibold py-4"
            >
              To see your position against others, head to the leaderboard page
              ➡️{" "}
              <Link href="/lb-select/jdqlb" className="underline text-blue-600">
                here.
              </Link>{" "}
              ⬅️
            </td>
          </tr>
        </tbody>
      </table>
      <UserScoreTable quizType="JDQ" />
      <button
        onClick={onBack}
        className="mt-4 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
