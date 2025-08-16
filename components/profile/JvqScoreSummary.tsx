"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import Link from "next/link";
import UserScoreTable from "@/components/UserScoreTable";
import { Card, CardContent } from "@/components/ui/Card";
import { BrandButton } from "@/components/ui/BrandButton";

interface Score {
  quiz_date: string;
  score: number;
  tiebreaker: number;
  day_type?: string;
}
interface Props {
  onBack: () => void;
}

function calculateAveragesJVQ(scores: Score[]) {
  if (!scores.length)
    return { thursdayAverage: 0, saturdayAverage: 0, combinedAverage: 0 };
  let thursdayScores = 0,
    thursdayCount = 0,
    saturdayScores = 0,
    saturdayCount = 0,
    allScores = 0;
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

export default function JvqScoreSummary({ onBack }: Props) {
  const [thursdayAverage, setThursdayAverage] = useState(0);
  const [saturdayAverage, setSaturdayAverage] = useState(0);
  const [combinedAverage, setCombinedAverage] = useState(0);
  const [username, setUsername] = useState("");

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
        .select("quiz_date, score, tiebreaker, day_type")
        .eq("uid", user.id)
        .eq("quiz_type", "JVQ");
      const avgs = calculateAveragesJVQ(scores || []);
      setThursdayAverage(avgs.thursdayAverage);
      setSaturdayAverage(avgs.saturdayAverage);
      setCombinedAverage(avgs.combinedAverage);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Card hover={false}>
        <CardContent className="pt-4">
          <h2 className="font-heading text-2xl mb-2 text-center">
            {username}&apos;s JVQ Summary
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-center">
              <thead className="bg-surface-subtle">
                <tr>
                  <th className="py-2 px-2 border-b"></th>
                  <th className="py-2 px-2 border-b">Thursday</th>
                  <th className="py-2 px-2 border-b">Saturday</th>
                  <th className="py-2 px-2 border-b">Combined</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 border-b">Averages</td>
                  <td className="py-2 border-b">
                    {thursdayAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border-b">
                    {saturdayAverage.toFixed(2)}
                  </td>
                  <td className="py-2 border-b">
                    {combinedAverage.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-3 text-sm bg-surface-subtle">
                    To see your position against others, go to{" "}
                    <Link
                      href="/lb-select/jvpqlb"
                      className="underline text-brand"
                    >
                      the JVQ leaderboard
                    </Link>
                    .
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserScoreTable quizType="JVQ" />

      <div className="flex justify-center">
        <BrandButton variant="outline" onClick={onBack}>
          Back to Dashboard
        </BrandButton>
      </div>
    </div>
  );
}
