"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUsername } from "@/utils/fetchUsername";
import { fetchScores } from "@/utils/fetchScores";
import { calculateAveragesJVQ } from "@/utils/calculateAveragesJVQ";
import { fetchLeaderboardData } from "@/utils/fetchLeaderboardData";
import UserScoreTable from "@/components/UserScoreTable";
import Link from "next/link";

interface Props {
  onBack: () => void;
}

export default function JvqScoreSummary({ onBack }: Props) {
  const [thursdayAverage, setThursdayAverage] = useState(0);
  const [saturdayAverage, setSaturdayAverage] = useState(0);
  const [combinedAverage, setCombinedAverage] = useState(0);
  const [username, setUsername] = useState("");

  // Helper function to get last X day (4 = Thursday, 6 = Saturday)
  const getLast = (targetDay: number): { str: string; date: Date } => {
    const d = new Date();
    const diff = (d.getDay() + 7 - targetDay) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0); // normalize to midnight
    return { str: d.toISOString().split("T")[0], date: d };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const name = await fetchUsername(user.uid);
      setUsername(name);

      const scores = await fetchScores(user.uid, "JVQ");
      const avgs = calculateAveragesJVQ(scores);
      setThursdayAverage(avgs.thursdayAverage);
      setSaturdayAverage(avgs.saturdayAverage);
      setCombinedAverage(avgs.combinedAverage);

      const { str: lastThuStr, date: lastThuDate } = getLast(4);
      const { date: lastSatDate } = getLast(6);

      const {} = await fetchLeaderboardData(
        lastThuStr,
        lastThuDate,
        lastSatDate,
        lastSatDate,
        new Date(0),
        new Date()
      );
    });

    return () => unsubscribe();
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
              ➡️ {""}
              <Link href="/lb-select/jvpqlb">here.</Link> ⬅️
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
