"use client";
import { useState } from "react";
import DailyLeaderboard from "./leaderboards/DailyLeaderboard";
import WeeklyLeaderboard from "./leaderboards/WeeklyLeaderboard";
import MonthlyLeaderboard from "./leaderboards/MonthlyLeaderboard";
import AllTimeLeaderboard from "./leaderboards/AllTimeLeaderboard";

interface LeaderboardTabsProps {
  quizType: "JDQ" | "JVQ";
}

export default function LeaderboardTabs({ quizType }: LeaderboardTabsProps) {
  const [selectedView, setSelectedView] = useState<
    "daily" | "weekly" | "monthly" | "allTime"
  >("daily");
  const [searchedUsername, setSearchedUsername] = useState("");

  return (
    <div className="w-full">
      {/* Username Search */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search for a username"
          value={searchedUsername}
          onChange={(e) => setSearchedUsername(e.target.value)}
          className="px-4 py-2 rounded shadow w-full max-w-md text-black"
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-center flex-wrap gap-4 mb-8">
        {(
          ["daily", "weekly", "monthly", "allTime"] as Array<
            "daily" | "weekly" | "monthly" | "allTime"
          >
        ).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded font-bold transition ${
              selectedView === view
                ? "bg-white text-black shadow"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {view === "daily" && "Daily"}
            {view === "weekly" && "Weekly"}
            {view === "monthly" && "Monthly"}
            {view === "allTime" && "All Time"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white text-black rounded-lg shadow-md p-6">
        {selectedView === "daily" && (
          <DailyLeaderboard
            quizType={quizType}
            searchedUsername={searchedUsername}
          />
        )}
        {selectedView === "weekly" && (
          <WeeklyLeaderboard
            quizType={quizType}
            searchedUsername={searchedUsername}
          />
        )}
        {selectedView === "monthly" && (
          <MonthlyLeaderboard
            quizType={quizType}
            searchedUsername={searchedUsername}
          />
        )}
        {selectedView === "allTime" && (
          <AllTimeLeaderboard
            quizType={quizType}
            searchedUsername={searchedUsername}
          />
        )}
      </div>
    </div>
  );
}
