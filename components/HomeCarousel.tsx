"use client";
import { useState } from "react";
import dummyData from "../data/dummyData.json";
import Leaderboard from "./Leaderboard";
export default function HomeCaurosel() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const today = new Date();
  const startOfDay = new Date(selectedDate);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <div className="mx-auto mt-10 max-w-screen-lg">
      <h2 className="text-4xl font-bold text-white">Latest Quiz Scores</h2>
      <p className="text-2xl text-white">
        Take a look at the latest leaderboards, from recent days, series or the
        overall year scoreboard!
      </p>
      <div className="mt-4 flex w-full gap-4 pb-5 snap-x overflow-x-auto ">
        <div className="min-w-[80%] md:min-w-[40%]">
          <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4">Leaderboards</h1>
            <div className="mb-8">
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Select Date for Daily Leaderboard:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Leaderboard
                title="Daily Leaderboard"
                data={dummyData}
                startDate={startOfDay}
                endDate={new Date(selectedDate)}
              />
              <Leaderboard
                title="Weekly Leaderboard"
                data={dummyData}
                period={5}
              />
              <Leaderboard
                title="Monthly Leaderboard"
                data={dummyData}
                startDate={startOfMonth}
                endDate={endOfMonth}
                isMonthly={true}
              />
              <Leaderboard title="All-Time Leaderboard" data={dummyData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
