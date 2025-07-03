"use client";

import { useState } from "react";
import LastThursdayLeaderboard from "./leaderboards/LastThursdayLeaderboard";
import LastSaturdayLeaderboard from "./leaderboards/LastSaturdayLeaderboard";
import ThursdayLeaderboard from "./leaderboards/ThursdayLeaderboard";
import SaturdayLeaderboard from "./leaderboards/SaturdayLeaderboard";
import CombinedJVQLeaderboard from "./leaderboards/CombinedJVQLeaderboard";

export default function JVQLeaderboardTabs() {
  const [selectedView, setSelectedView] = useState<
    "lastThursday" | "lastSaturday" | "thursday" | "saturday" | "combined"
  >("lastThursday");

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
          [
            "lastThursday",
            "lastSaturday",
            "thursday",
            "saturday",
            "combined",
          ] as const
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
            {
              {
                lastThursday: "Last Thursday Quiz",
                lastSaturday: "Last Saturday Quiz",
                thursday: "Thursday Leaderboard",
                saturday: "Saturday Leaderboard",
                combined: "Combined Leaderboard",
              }[view]
            }
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white text-black rounded-lg shadow-md p-6">
        {selectedView === "lastThursday" && (
          <LastThursdayLeaderboard searchedUsername={searchedUsername} />
        )}
        {selectedView === "lastSaturday" && (
          <LastSaturdayLeaderboard searchedUsername={searchedUsername} />
        )}
        {selectedView === "thursday" && (
          <ThursdayLeaderboard searchedUsername={searchedUsername} />
        )}
        {selectedView === "saturday" && (
          <SaturdayLeaderboard searchedUsername={searchedUsername} />
        )}
        {selectedView === "combined" && (
          <CombinedJVQLeaderboard searchedUsername={searchedUsername} />
        )}
      </div>
    </div>
  );
}
