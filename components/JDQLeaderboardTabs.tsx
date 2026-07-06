"use client";

import AllTimeLeaderboard from "./leaderboards/AllTimeLeaderboard";
import DailyLeaderboard from "./leaderboards/DailyLeaderboard";
import { LeaderboardTabsShell } from "./leaderboards/LeaderboardTabsShell";
import MonthlyLeaderboard from "./leaderboards/MonthlyLeaderboard";
import WeeklyLeaderboard from "./leaderboards/WeeklyLeaderboard";

interface LeaderboardTabsProps {
  quizType: "JDQ" | "JVQ";
}

type ViewKey = "daily" | "weekly" | "monthly" | "allTime";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "allTime", label: "All Time" },
];

export default function JDQLeaderboardTabs({ quizType }: LeaderboardTabsProps) {
  return (
    <LeaderboardTabsShell
      views={VIEWS}
      defaultView="daily"
      ariaLabel="JDQ views"
      tip="Tip: results update after a brief pause to keep things speedy."
    >
      {({ selectedView, debouncedUsername }) => (
        <>
          <div
            role="tabpanel"
            hidden={selectedView !== "daily"}
            aria-labelledby="tab-daily"
          >
            <DailyLeaderboard
              quizType={quizType}
              searchedUsername={debouncedUsername}
            />
          </div>

          <div
            role="tabpanel"
            hidden={selectedView !== "weekly"}
            aria-labelledby="tab-weekly"
          >
            <WeeklyLeaderboard searchedUsername={debouncedUsername} />
          </div>

          <div
            role="tabpanel"
            hidden={selectedView !== "monthly"}
            aria-labelledby="tab-monthly"
          >
            <MonthlyLeaderboard
              quizType={quizType}
              searchedUsername={debouncedUsername}
            />
          </div>

          <div
            role="tabpanel"
            hidden={selectedView !== "allTime"}
            aria-labelledby="tab-allTime"
          >
            <AllTimeLeaderboard
              quizType={quizType}
              searchedUsername={debouncedUsername}
            />
          </div>
        </>
      )}
    </LeaderboardTabsShell>
  );
}
