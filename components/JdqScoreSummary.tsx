"use client";
import { useEffect, useState } from "react";
import { auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUsername } from "@/utils/fetchUsername";
import { fetchScores } from "@/utils/fetchScores";
import { calculateAverages } from "@/utils/calculateAverages";

import UserScoreTable from "@/components/UserScoreTable";
import Link from "next/link";

interface Props {
  onBack: () => void;
}

export default function JdqScoreSummary({ onBack }: Props) {
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [allTimeAverage, setAllTimeAverage] = useState(0);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const username = await fetchUsername(user.uid);
        setUsername(username);

        const scores = await fetchScores(user.uid, "JDQ");

        const averages = calculateAverages(scores);
        setWeeklyAverage(averages.weeklyAverage);
        setMonthlyAverage(averages.monthlyAverage);
        setAllTimeAverage(averages.allTimeAverage);

        //
      }
    });

    return () => unsubscribe();
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
              {weeklyAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {monthlyAverage.toFixed(2)}
            </td>
            <td className="py-2 border border-gray-300">
              {allTimeAverage.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td
              colSpan={4}
              className="border border-gray-300 bg-slate-300 text-center font-semibold py-4"
            >
              To see your position against others, head to the leaderboard page
              ➡️ {""}
              <Link href="/lb-select/jdqlb">here.</Link> ⬅️
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
