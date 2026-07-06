"use client";

import JVQUnifiedLeaderboard from "@/components/leaderboards/JVQUnifiedLeaderboard";
import { LeaderboardTabsShell } from "@/components/leaderboards/LeaderboardTabsShell";

type View =
  | "lastThursday"
  | "lastSaturday"
  | "thursday"
  | "saturday"
  | "combined";

const VIEWS: { key: View; label: string }[] = [
  { key: "lastThursday", label: "Last Thursday" },
  { key: "lastSaturday", label: "Last Saturday" },
  { key: "thursday", label: "All-time Thursday" },
  { key: "saturday", label: "All-time Saturday" },
  { key: "combined", label: "All-time Combined" },
];

export default function JVQLeaderboardTabs() {
  return (
    <LeaderboardTabsShell
      views={VIEWS}
      defaultView="lastThursday"
      ariaLabel="JVQ views"
      tip="Tip: tabs pre-load in the background, so switching is instant."
    >
      {({ selectedView, debouncedUsername }) => (
        <JVQUnifiedLeaderboard
          view={selectedView}
          searchedUsername={debouncedUsername}
        />
      )}
    </LeaderboardTabsShell>
  );
}
