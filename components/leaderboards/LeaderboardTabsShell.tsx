"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useDebounced } from "@/hooks/useDebounced";

type ViewOption<T extends string> = {
  key: T;
  label: string;
};

type LeaderboardTabsShellProps<T extends string> = {
  views: ViewOption<T>[];
  defaultView: T;
  ariaLabel: string;
  tip: string;
  children: (props: { selectedView: T; debouncedUsername: string }) => ReactNode;
};

export function LeaderboardTabsShell<T extends string>({
  views,
  defaultView,
  ariaLabel,
  tip,
  children,
}: LeaderboardTabsShellProps<T>) {
  const [selectedView, setSelectedView] = useState<T>(defaultView);
  const [searchedUsername, setSearchedUsername] = useState("");
  const debouncedUsername = useDebounced(searchedUsername);

  const clearDisabled = useMemo(
    () => searchedUsername.trim().length === 0,
    [searchedUsername],
  );

  return (
    <div className="w-full">
      <div className="flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search username"
            value={searchedUsername}
            onChange={(event) => setSearchedUsername(event.target.value)}
            className="w-full rounded-lg border borderc bg-white px-4 py-2 pr-16 text-sm placeholder:text-textc-muted focus:outline-none focus:ring-4 focus:ring-brand/20"
            aria-label="Search for a username"
          />
          <button
            type="button"
            onClick={() => setSearchedUsername("")}
            disabled={clearDisabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border borderc px-2 py-1 text-xs hover:bg-brand/10 disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        <Link
          href="/lb-select"
          className="inline-flex items-center justify-center rounded-lg border borderc px-3 py-2 text-sm hover:bg-brand/10"
        >
          {"<-"} Leaderboards Home
        </Link>
      </div>

      <div className="px-3">
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="relative inline-flex w-full overflow-x-auto rounded-lg border borderc bg-surface-subtle p-1"
        >
          <div className="mx-auto flex min-w-max gap-1">
            {views.map(({ key, label }) => {
              const active = selectedView === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedView(key)}
                  className={[
                    "rounded-md px-3 py-2 text-sm transition",
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

      <div className="p-4 sm:p-6">
        <div className="min-h-[320px] rounded-lg border borderc bg-white p-4 shadow-card">
          {children({ selectedView, debouncedUsername })}
        </div>
        <p className="mt-2 text-xs text-textc-muted">{tip}</p>
      </div>
    </div>
  );
}
