"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";

type TabKey = "VENUE" | "TOP10" | "BEST_VENUE";

type Top10Row = { team_id: string; team_name: string; total_points: number };

type VenueRow = {
  venue_id: string;
  venue_name: string;
  team_id: string;
  team_name: string;
  total_points: number;
};

type VenueAvgRow = {
  venue_id: string;
  venue_name: string;
  teams_count: number;
  avg_total_points: number;
};

function TabPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition border",
        active
          ? "border-yellow-300/70 bg-yellow-300/85 text-black shadow-sm"
          : "border-violet-200/35 bg-violet-900/45 text-violet-50 hover:bg-violet-900/60",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function RowLine({
  rank,
  name,
  right,
  subtle,
}: {
  rank: number;
  name: string;
  right: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-200/30 bg-violet-950/35 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-8 text-center text-sm font-semibold text-violet-200/75">
          {rank}
        </div>
        <div
          className={[
            "truncate",
            subtle ? "text-violet-100/85" : "font-semibold text-violet-50",
          ].join(" ")}
        >
          {name}
        </div>
      </div>
      <div className="shrink-0 font-mono text-sm text-violet-50">{right}</div>
    </div>
  );
}

export function LeaderboardsCard({
  quizId,
  runtime,
}: {
  quizId: string;
  runtime: QuizRuntime | null;
}) {
  const show =
    runtime?.phase === "SHOW_LEADERBOARD" || runtime?.phase === "ENDED";

  const [activeTab, setActiveTab] = useState<TabKey>("VENUE");

  const [loading, setLoading] = useState(false);
  const [top10, setTop10] = useState<Top10Row[]>([]);
  const [byVenue, setByVenue] = useState<VenueRow[]>([]);
  const [venueAvg, setVenueAvg] = useState<VenueAvgRow[]>([]);

  async function load() {
    setLoading(true);

    const [top10Res, byVenueRes, venueAvgRes] = await Promise.all([
      supabase.rpc("qhl_get_leaderboard_global_top10", { p_quiz_id: quizId }),
      supabase.rpc("qhl_get_leaderboard_by_venue", { p_quiz_id: quizId }),
      supabase.rpc("qhl_get_venue_battle_leaderboard", { p_quiz_id: quizId }),
    ]);

    if (top10Res.error) console.error(top10Res.error);
    if (byVenueRes.error) console.error(byVenueRes.error);
    if (venueAvgRes.error) console.error(venueAvgRes.error);

    setTop10((top10Res.data ?? []) as Top10Row[]);
    setByVenue((byVenueRes.data ?? []) as VenueRow[]);
    setVenueAvg((venueAvgRes.data ?? []) as VenueAvgRow[]);

    setLoading(false);
  }

  useEffect(() => {
    if (!show) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, quizId]);

  const venueGroups = useMemo(() => {
    const map = new Map<string, { venueName: string; rows: VenueRow[] }>();
    for (const r of byVenue) {
      const key = r.venue_id;
      if (!map.has(key)) map.set(key, { venueName: r.venue_name, rows: [] });
      map.get(key)!.rows.push(r);
    }
    return Array.from(map.entries()).map(([venueId, v]) => ({
      venueId,
      venueName: v.venueName,
      rows: v.rows,
    }));
  }, [byVenue]);

  if (!show) return null;

  return (
    <div className="qhl-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-white">Leaderboards</div>
          <div className="mt-1 text-sm text-violet-100/80">
            Venue • Top 10 • Best Venue
          </div>
        </div>

        <button
          onClick={load}
          className="qhl-btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabPill
          active={activeTab === "VENUE"}
          label="Venue"
          onClick={() => setActiveTab("VENUE")}
        />
        <TabPill
          active={activeTab === "TOP10"}
          label="Top 10"
          onClick={() => setActiveTab("TOP10")}
        />
        <TabPill
          active={activeTab === "BEST_VENUE"}
          label="Best Venue"
          onClick={() => setActiveTab("BEST_VENUE")}
        />
      </div>

      {activeTab === "VENUE" && (
        <div className="space-y-4">
          {venueGroups.length === 0 ? (
            <div className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4 text-sm text-violet-100/80">
              No venue scores yet.
            </div>
          ) : (
            venueGroups.map((g) => (
              <div
                key={g.venueId}
                className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-sm font-semibold text-white">
                    {g.venueName}
                  </div>
                  <div className="text-xs text-slate-600">
                    {g.rows.length} teams
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {g.rows.map((r, idx) => (
                    <RowLine
                      key={r.team_id}
                      rank={idx + 1}
                      name={r.team_name}
                      right={r.total_points}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "TOP10" && (
        <div className="space-y-2">
          {top10.length === 0 ? (
            <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
              No scores yet.
            </div>
          ) : (
            top10.map((r, idx) => (
              <RowLine
                key={r.team_id}
                rank={idx + 1}
                name={r.team_name}
                right={r.total_points}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "BEST_VENUE" && (
        <div className="space-y-2">
          {venueAvg.length === 0 ? (
            <div className="rounded-2xl border border-violet-200/30 bg-violet-950/30 p-4 text-sm text-violet-100/80">
              No venue averages yet.
            </div>
          ) : (
            venueAvg.map((v, idx) => (
              <RowLine
                key={v.venue_id}
                rank={idx + 1}
                name={v.venue_name}
                right={Number(v.avg_total_points).toFixed(2)}
                subtle
              />
            ))
          )}
          {venueAvg.length > 0 ? (
            <div className="text-xs text-violet-100/75">
              “Best Venue” is ranked by average team score (not total points).
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
