"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchLeaderboardData } from "@/utils/fetchLeaderboardData";
import Leaderboard from "./Leaderboard";

type DataItem = {
  username: string;
  score: number;
  tiebreaker: number;
  quizzesPlayed?: number;
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
        const { dailyData, weeklyData, monthlyData, allTimeData } =
          await fetchLeaderboardData(
            selectedDate,
            startOfWeek,
            startOfMonth,
            endOfMonth,
            startOfAllTime,
            today
          );
        setDailyData(dailyData);
        setWeeklyData(weeklyData);
        setMonthlyData(monthlyData);
        setAllTimeData(allTimeData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
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
        <Leaderboard
          title="Daily Leaderboard"
          data={dailyData}
          startDate={startOfDay}
          endDate={startOfDay}
          showQuizzesPlayed={false}
        />
        <Leaderboard
          title={`W/C: ${firstDateOfWeekWithSuffix} ${firstDateOfWeek.month}`}
          data={weeklyData}
          startDate={startOfWeek}
          endDate={today}
          showQuizzesPlayed={true}
        />
        <Leaderboard
          title={`${monthName} Leaderboard`}
          data={monthlyData}
          startDate={startOfMonth}
          endDate={endOfMonth}
          showQuizzesPlayed={true}
        />
        <Leaderboard
          title="All-Time Leaderboard"
          data={allTimeData}
          startDate={startOfAllTime}
          endDate={today}
          showQuizzesPlayed={true}
        />
      </div>
    </div>
  );
}
