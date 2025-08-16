"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import DailyLeaderboard from "./leaderboards/DailyLeaderboard";
import WeeklyLeaderboard from "./leaderboards/WeeklyLeaderboard";
import MonthlyLeaderboard from "./leaderboards/MonthlyLeaderboard";
import AllTimeLeaderboard from "./leaderboards/AllTimeLeaderboard";

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

/** simple debounce hook */
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function JDQLeaderboardTabs({ quizType }: LeaderboardTabsProps) {
  const [selectedView, setSelectedView] = useState<ViewKey>("daily");
  const [searchedUsername, setSearchedUsername] = useState("");
  const debouncedUsername = useDebounced(searchedUsername, 400);

  const clearDisabled = useMemo(
    () => searchedUsername.trim().length === 0,
    [searchedUsername]
  );

  return (
    <div className="w-full">
      {/* Top bar: search + back to selector */}
      <div className="flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search username"
            value={searchedUsername}
            onChange={(e) => setSearchedUsername(e.target.value)}
            className="
              w-full rounded-lg border borderc bg-white px-10 py-2 text-sm
              placeholder:text-textc-muted focus:outline-none focus:ring-4 focus:ring-brand/20
            "
            aria-label="Search for a username"
          />
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none"
            aria-hidden
          >
            🔎
          </span>
          <button
            type="button"
            onClick={() => setSearchedUsername("")}
            disabled={clearDisabled}
            className="
              absolute right-2 top-1/2 -translate-y-1/2 rounded-md border borderc px-2 py-1 text-xs
              hover:bg-brand/10 disabled:opacity-50
            "
          >
            Clear
          </button>
        </div>

        <Link
          href="/lb-select"
          className="
            inline-flex items-center justify-center rounded-lg border borderc px-3 py-2 text-sm
            hover:bg-brand/10
          "
        >
          ← Leaderboards Home
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-3">
        <div
          role="tablist"
          aria-label="JDQ views"
          className="relative inline-flex w-full overflow-x-auto rounded-lg border borderc bg-surface-subtle p-1"
        >
          <div className="mx-auto flex min-w-max gap-1">
            {VIEWS.map(({ key, label }) => {
              const active = selectedView === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedView(key)}
                  className={[
                    "px-3 py-2 text-sm rounded-md transition",
                    active
                      ? "bg-brand text-white shadow-card"
                      : "text-textc hover:bg-brand/10",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panels: keep mounted, toggle visibility */}
      <div className="p-4 sm:p-6">
        <div className="rounded-lg border borderc bg-white p-4 shadow-card min-h-[320px]">
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
        </div>

        <p className="mt-2 text-xs text-textc-muted">
          Tip: results update after a brief pause to keep things speedy.
        </p>
      </div>
    </div>
  );
}
