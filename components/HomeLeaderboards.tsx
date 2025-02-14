"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase/config";

import HomeLeaderboard from "./HomeLeaderboard";

type DataItem = {
  username: string;
  score: number;
  tiebreaker: number;
};

export default function Leaderboards() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyData, setDailyData] = useState<DataItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<DataItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<DataItem[]>([]);
  const [allTimeData, setAllTimeData] = useState<DataItem[]>([]);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date(), []);
  const startOfDay = new Date(selectedDate);
  const startOfWeek = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return start;
  }, [today]);
  const startOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const endOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 1, 0),
    [today]
  );
  const startOfAllTime = useMemo(() => new Date(0), []);

  const getFirstDateOfWeek = () => {
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    return {
      date: firstDayOfWeek.getDate(),
      month: firstDayOfWeek.toLocaleString("default", { month: "long" }),
    };
  };

  const getMonthName = () => {
    return today.toLocaleString("default", { month: "long" });
  };

  const getOrdinalSuffix = (date: number) => {
    if (date > 3 && date < 21) return "th";
    switch (date % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const firstDateOfWeek = getFirstDateOfWeek();
  const monthName = getMonthName();
  const firstDateOfWeekWithSuffix = `${firstDateOfWeek.date}${getOrdinalSuffix(
    firstDateOfWeek.date
  )}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch daily data
        const dailyQuery = query(
          collection(db, "scores"),
          where("quizDate", "==", selectedDate)
        );
        const dailySnapshot = await getDocs(dailyQuery);
        const dailyScores = dailySnapshot.docs.map(
          (doc) =>
            doc.data() as {
              username: string;
              score: number;
              tiebreaker: number;
            }
        );
        setDailyData(dailyScores);

        // Fetch weekly data
        const weeklyQuery = query(
          collection(db, "scores"),
          where("quizDate", ">=", startOfWeek.toISOString().split("T")[0]),
          where("quizDate", "<=", today.toISOString().split("T")[0])
        );
        const weeklySnapshot = await getDocs(weeklyQuery);
        const weeklyScores = weeklySnapshot.docs.map(
          (doc) =>
            doc.data() as {
              username: string;
              score: number;
              tiebreaker: number;
            }
        );
        const weeklyAggregated = aggregateScores(weeklyScores, 5);
        setWeeklyData(weeklyAggregated);

        // Fetch monthly data
        const monthlyQuery = query(
          collection(db, "scores"),
          where("quizDate", ">=", startOfMonth.toISOString().split("T")[0]),
          where("quizDate", "<=", endOfMonth.toISOString().split("T")[0])
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const monthlyScores = monthlySnapshot.docs.map(
          (doc) =>
            doc.data() as {
              username: string;
              score: number;
              tiebreaker: number;
            }
        );
        const monthlyAggregated = aggregateScores(monthlyScores);
        setMonthlyData(monthlyAggregated);

        // Fetch all-time data
        const allTimeQuery = query(
          collection(db, "scores"),
          where("quizDate", ">=", startOfAllTime.toISOString().split("T")[0])
        );
        const allTimeSnapshot = await getDocs(allTimeQuery);
        const allTimeScores = allTimeSnapshot.docs.map(
          (doc) =>
            doc.data() as {
              username: string;
              score: number;
              tiebreaker: number;
            }
        );
        const allTimeAggregated = aggregateScores(allTimeScores);
        setAllTimeData(allTimeAggregated);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
      }
    };

    fetchData();
  }, [
    selectedDate,
    endOfMonth,
    startOfAllTime,
    startOfMonth,
    startOfWeek,
    today,
  ]);

  const aggregateScores = (
    scores: { username: string; score: number; tiebreaker: number }[],
    maxScores = Infinity
  ) => {
    const userScores: {
      [key: string]: {
        totalScore: number;
        totalTiebreaker: number;
        count: number;
      };
    } = {};

    scores.forEach((score) => {
      const { username, score: userScore, tiebreaker } = score;
      if (!userScores[username]) {
        userScores[username] = { totalScore: 0, totalTiebreaker: 0, count: 0 };
      }
      if (userScores[username].count < maxScores) {
        userScores[username].totalScore += userScore;
        userScores[username].totalTiebreaker += tiebreaker;
        userScores[username].count += 1;
      }
    });

    return Object.keys(userScores)
      .map((username) => {
        const { totalScore, totalTiebreaker, count } = userScores[username];
        return {
          username,
          score: totalScore / count,
          tiebreaker: totalTiebreaker / count,
        };
      })
      .sort((a, b) => {
        if (a.score === b.score) {
          return a.tiebreaker - b.tiebreaker;
        }
        return b.score - a.score;
      });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <label className="block text-lg font-medium text-black mb-2">
          Select Date for Daily Leaderboard:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded"
        />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HomeLeaderboard
          title="Daily Leaderboard"
          data={dailyData}
          startDate={startOfDay}
          endDate={startOfDay}
        />
        <HomeLeaderboard
          title={`W/C: ${firstDateOfWeekWithSuffix} ${firstDateOfWeek.month}`}
          data={weeklyData}
          startDate={startOfWeek}
          endDate={today}
        />
        <HomeLeaderboard
          title={`${monthName} Leaderboard`}
          data={monthlyData}
          startDate={startOfMonth}
          endDate={endOfMonth}
        />
        <HomeLeaderboard
          title="All-Time Leaderboard"
          data={allTimeData}
          startDate={startOfAllTime}
          endDate={today}
        />
      </div>
    </div>
  );
}
