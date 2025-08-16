"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import Link from "next/link";
import UserScoreTable from "@/components/UserScoreTable";
import { Card, CardContent } from "@/components/ui/Card";
import { BrandButton } from "@/components/ui/BrandButton";

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

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
}

function calculateAverages(scores: Score[]) {
  if (!scores.length)
    return { weeklyAverage: 0, monthlyAverage: 0, allTimeAverage: 0 };
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
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUsername(profile?.username || "");
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
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <CardContent className="pt-4">
          <h2 className="font-heading text-2xl mb-2 text-center">
            {username}&apos;s JDQ Summary
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-center">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="py-2 px-2 border-b"></th>
                  <th className="py-2 px-2 border-b">Weekly</th>
                  <th className="py-2 px-2 border-b">Monthly</th>
                  <th className="py-2 px-2 border-b">All Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 border-b">Averages</td>
                  <td className="py-2 border-b">
                    {loading ? "-" : weeklyAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border-b">
                    {loading ? "-" : monthlyAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border-b">
                    {loading ? "-" : allTimeAverage.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-3 text-sm bg-surface-subtle">
                    To see your position against others, go to{" "}
                    <Link
                      href="/lb-select/jdqlb"
                      className="underline text-brand"
                    >
                      the JDQ leaderboard
                    </Link>
                    .
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserScoreTable quizType="JDQ" />

      <div className="flex justify-center">
        <BrandButton variant="outline" onClick={onBack}>
          Back to Dashboard
        </BrandButton>
      </div>
    </div>
  );
}
