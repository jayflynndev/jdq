// components/leaderboards/JVQUnifiedLeaderboard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/supabaseClient";
import { fetchScoresByType } from "@/utils/fetchScoresByType";

export type View =
  | "lastThursday"
  | "lastSaturday"
  | "thursday"
  | "saturday"
  | "combined";

type Row = {
  username: string;
  averageScore: number;
  averageTiebreaker: number;
  entries?: number;
  score?: number | null;
  tiebreaker?: number | null;
};

type Score = {
  username?: string;
  user_id?: string;
  score?: number | null;
  tiebreaker?: number | null;
  dayType?: string | null | undefined;
};

function mostRecentWeekdayAt(hour: number, min: number, weekday: number) {
  // weekday: Sun=0 .. Sat=6
  const now = new Date();
  const d = new Date(now);
  const diff = (d.getDay() + 7 - weekday) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(hour, min, 0, 0);
  return d;
}
function nextWeekdayMidnight(after: Date) {
  const n = new Date(after);
  n.setDate(after.getDate() + 7);
  n.setHours(0, 0, 0, 0);
  return n;
}

type CacheEntry = {
  rows: Row[];
  loaded: boolean;
  loading: boolean;
  quizDateString: string | null;
  visibleWindow: boolean;
};

const MIN_ENTRIES_JVQ = 5;
const ALL_VIEWS: View[] = [
  "lastThursday",
  "lastSaturday",
  "thursday",
  "saturday",
  "combined",
];

export default function JVQUnifiedLeaderboard({
  view,
  searchedUsername,
}: {
  view: View;
  searchedUsername?: string;
}) {
  // Per-view cache
  const [cache, setCache] = useState<Record<View, CacheEntry>>(() => {
    const base: CacheEntry = {
      rows: [],
      loaded: false,
      loading: false,
      quizDateString: null,
      visibleWindow: true,
    };
    return {
      lastThursday: { ...base },
      lastSaturday: { ...base },
      thursday: { ...base },
      saturday: { ...base },
      combined: { ...base },
    };
  });

  const saveData =
    typeof navigator !== "undefined" && (navigator as any).connection?.saveData;

  const setEntry = (v: View, updater: (prev: CacheEntry) => CacheEntry) =>
    setCache((c) => ({ ...c, [v]: updater(c[v]) }));

  // DAILY loaders
  const loadDaily = async (v: View, weekday: number) => {
    setEntry(v, (p) => ({ ...p, loading: true }));

    const lastQuiz = mostRecentWeekdayAt(20, 30, weekday); // 20:30 local
    const nextMidnight = nextWeekdayMidnight(lastQuiz);
    const now = new Date();
    const show = now >= lastQuiz && now < nextMidnight;
    const dateStr = lastQuiz.toISOString().slice(0, 10);

    if (!show) {
      setEntry(v, (p) => ({
        ...p,
        loading: false,
        loaded: true,
        visibleWindow: false,
        quizDateString: dateStr,
        rows: [],
      }));
      return;
    }

    const data = await fetchScoresByType("JVQ", { date: dateStr });
    const sorted = [...data].sort((a, b) => {
      const as = a.score ?? -Infinity;
      const bs = b.score ?? -Infinity;
      if (bs !== as) return bs - as;
      const at = a.tiebreaker ?? Number.POSITIVE_INFINITY;
      const bt = b.tiebreaker ?? Number.POSITIVE_INFINITY;
      return at - bt;
    });
    const seen = new Set<string>();
    const uniqueBest = sorted.filter((r) => {
      if (seen.has(r.user_id)) return false;
      seen.add(r.user_id);
      return true;
    });

    const rows: Row[] = uniqueBest.map((r) => ({
      username: r.username ?? "Unknown",
      score: r.score,
      tiebreaker: r.tiebreaker,
      averageScore: 0,
      averageTiebreaker: 0,
      entries: undefined,
    }));

    setEntry(v, (p) => ({
      ...p,
      rows,
      loaded: true,
      loading: false,
      quizDateString: dateStr,
      visibleWindow: true,
    }));
  };

  // ALL-TIME loaders
  async function aggregateAllTimeOnClient(
    dayTypes: string[] | null
  ): Promise<Row[]> {
    const all = await fetchScoresByType("JVQ");
    const filtered =
      dayTypes && dayTypes.length
        ? all.filter((s) =>
            dayTypes
              .map((x) => x.toLowerCase())
              .includes((s.dayType ?? "").toLowerCase())
          )
        : all;

    const byUser = new Map<string, Score[]>();
    for (const s of filtered) {
      const key = s.username || "Unknown";
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(s);
    }

    const out: Row[] = [];
    for (const [username, list] of byUser) {
      const scores = list.map((x) => x.score ?? 0);
      const tbs = list.map((x) => x.tiebreaker ?? Number.POSITIVE_INFINITY);
      const entries = list.length;

      const avgScore = scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      const finiteTb = tbs.filter(Number.isFinite) as number[];
      const avgTb = finiteTb.length
        ? finiteTb.reduce((a, b) => a + b, 0) / finiteTb.length
        : Number.POSITIVE_INFINITY;

      out.push({
        username,
        averageScore: Math.round(avgScore * 100) / 100,
        averageTiebreaker: Number.isFinite(avgTb)
          ? Math.round(avgTb * 100) / 100
          : 999999,
        entries,
      });
    }

    const atLeastMin = out.filter((r) => (r.entries ?? 0) >= MIN_ENTRIES_JVQ);
    atLeastMin.sort(
      (a, b) =>
        b.averageScore - a.averageScore ||
        a.averageTiebreaker - b.averageTiebreaker ||
        a.username.localeCompare(b.username)
    );
    return atLeastMin;
  }

  const loadAllTime = async (v: View, dayTypes: string[] | null) => {
    setEntry(v, (p) => ({ ...p, loading: true }));

    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_quiz_type: "JVQ",
      p_date_from: null,
      p_date_to: null,
      p_day_types: dayTypes,
      p_start_date: null,
      p_min_entries: 0,
    });

    if (error) {
      const rows = await aggregateAllTimeOnClient(dayTypes);
      setEntry(v, (p) => ({
        ...p,
        rows,
        loaded: true,
        loading: false,
        quizDateString: null,
        visibleWindow: true,
      }));
      return;
    }

    const mapped: Row[] = (data ?? []).map((r: any) => ({
      username: r.username ?? "Unknown",
      averageScore: Number(r.avg_score ?? 0),
      averageTiebreaker:
        r.avg_tiebreaker === null ? 999999 : Number(r.avg_tiebreaker),
      entries: Number(r.entries ?? 0),
    }));

    const filtered = mapped
      .filter((r) => (r.entries ?? 0) >= MIN_ENTRIES_JVQ)
      .sort(
        (a, b) =>
          b.averageScore - a.averageScore ||
          a.averageTiebreaker - b.averageTiebreaker ||
          a.username.localeCompare(b.username)
      );

    const rows =
      filtered.length > 0 ? filtered : await aggregateAllTimeOnClient(dayTypes);

    setEntry(v, (p) => ({
      ...p,
      rows,
      loaded: true,
      loading: false,
      quizDateString: null,
      visibleWindow: true,
    }));
  };

  // Load current view if not loaded yet
  useEffect(() => {
    const current = cache[view];
    if (current.loaded || current.loading) return;

    if (view === "lastThursday") loadDaily(view, 4);
    else if (view === "lastSaturday") loadDaily(view, 6);
    else if (view === "thursday") loadAllTime(view, ["Thursday"]);
    else if (view === "saturday") loadAllTime(view, ["Saturday"]);
    else loadAllTime(view, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Background prefetch others once
  const prefetchedRef = useRef(false);
  useEffect(() => {
    if (prefetchedRef.current) return;
    const id = setTimeout(async () => {
      prefetchedRef.current = true;
      if (saveData) return;

      const order = ALL_VIEWS.filter((v) => v !== view).concat(view);
      let delay = 0;
      for (const v of order) {
        const entry = cache[v];
        if (entry.loaded || entry.loading) continue;
        setTimeout(() => {
          if (v === "lastThursday") loadDaily(v, 4);
          else if (v === "lastSaturday") loadDaily(v, 6);
          else if (v === "thursday") loadAllTime(v, ["Thursday"]);
          else if (v === "saturday") loadAllTime(v, ["Saturday"]);
          else loadAllTime(v, null);
        }, delay);
        delay += 250;
      }
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render from cache
  const entry = cache[view];
  const rows = entry.rows;
  const loading = entry.loading && !entry.loaded;
  const isDaily = view === "lastThursday" || view === "lastSaturday";

  // JDQ-style highlight (no filtering)
  const hasSearch = !!searchedUsername?.trim();
  const lcQuery = (searchedUsername ?? "").toLowerCase();
  const exactIndex = useMemo(() => {
    if (!hasSearch) return null;
    const idx = rows.findIndex(
      (r) => (r.username ?? "").toLowerCase() === lcQuery
    );
    return idx === -1 ? null : idx;
  }, [rows, hasSearch, lcQuery]);
  const exactRow = exactIndex != null ? rows[exactIndex] : null;

  const [showFull, setShowFull] = useState(false);
  const visibleRows = showFull ? rows : rows.slice(0, 10);

  const renderPos = (rank: number) => {
    const medal =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
    return (
      <span className="inline-flex items-center gap-2">
        {medal && <span aria-hidden>{medal}</span>}
        <span className="font-semibold">#{rank}</span>
      </span>
    );
  };

  // Daily window not open yet
  if (isDaily && entry.loaded && !entry.visibleWindow) {
    return (
      <div className="text-center text-lg font-semibold text-black/90">
        Scores will begin to show after the live quiz has finished.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search highlight summary */}
      {hasSearch && exactRow && (
        <div className="mb-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-card">
          {exactIndex! < 10 ? (
            <p className="mb-1 font-bold">
              🎉 You’re in the top 10{isDaily ? "" : " all-time"}!
            </p>
          ) : (
            <p className="mb-1 font-bold">
              Here’s your{isDaily ? " quiz" : " all-time"} ranking:
            </p>
          )}
          {isDaily ? (
            <p>
              <strong>#{exactIndex! + 1}</strong> — {exactRow.username} —{" "}
              {exactRow.score ?? "—"} pts (Tiebreak:{" "}
              {exactRow.tiebreaker ?? "—"})
            </p>
          ) : (
            <p>
              <strong>#{exactIndex! + 1}</strong> — {exactRow.username} —{" "}
              {exactRow.averageScore.toFixed(2)} avg (Tiebreak avg:{" "}
              {Number.isFinite(exactRow.averageTiebreaker)
                ? exactRow.averageTiebreaker
                : "—"}
              ) • {exactRow.entries ?? 0} entries
            </p>
          )}
        </div>
      )}

      {/* Top-right toolbar (matches JDQ) */}
      <div className="mb-4 flex justify-end">
        <button
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-card hover:opacity-90"
          onClick={() => setShowFull((p) => !p)}
        >
          {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
        </button>
      </div>

      {/* Table */}
      {loading && <div className="text-xs text-white/80">Updating…</div>}
      <div className="overflow-x-auto rounded-lg border borderc bg-white shadow-card">
        <table className="min-w-full table-fixed text-black">
          <thead className="sticky top-0 z-10 bg-surface-subtle">
            <tr className="text-textc">
              <th className="w-28 px-4 py-2 text-left">Position</th>
              <th className="px-4 py-2 text-left">Username</th>
              {isDaily ? (
                <>
                  <th className="w-24 px-4 py-2 text-right">Score</th>
                  <th className="w-28 px-4 py-2 text-right">Tiebreak</th>
                </>
              ) : (
                <>
                  <th className="w-28 px-4 py-2 text-right">Avg Score</th>
                  <th className="w-32 px-4 py-2 text-right">Avg Tiebreak</th>
                  <th className="w-24 px-4 py-2 text-right">Entries</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((u, i) => {
              const absoluteIndex = rows.findIndex(
                (r) => (r.username ?? "") === (u.username ?? "")
              );
              const rank = (absoluteIndex >= 0 ? absoluteIndex : i) + 1;
              const topBg =
                rank === 1
                  ? "bg-amber-50"
                  : rank === 2
                  ? "bg-zinc-50"
                  : rank === 3
                  ? "bg-orange-50"
                  : "";
              const isExact =
                hasSearch && (u.username ?? "").toLowerCase() === lcQuery;

              return (
                <tr
                  key={`${u.username}-${i}`}
                  className={[
                    "border-t border-gray-200 transition-colors hover:bg-surface-subtle/60",
                    topBg,
                    isExact ? "ring-2 ring-brand/50" : "",
                  ].join(" ")}
                >
                  <td className="w-28 px-4 py-2 text-left">
                    {renderPos(rank)}
                  </td>
                  <td
                    className={`px-4 py-2 ${rank <= 3 ? "font-semibold" : ""}`}
                  >
                    {u.username}
                  </td>
                  {isDaily ? (
                    <>
                      <td className="px-4 py-2 text-right">{u.score ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        {u.tiebreaker ?? "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-right">
                        {u.averageScore.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {Number.isFinite(u.averageTiebreaker)
                          ? u.averageTiebreaker
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">{u.entries ?? 0}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {entry.loaded && rows.length === 0 && (
          <p className="p-4 text-center text-textc-muted">
            {isDaily
              ? "No scores available for this quiz."
              : "No scores match the criteria."}
          </p>
        )}
      </div>
    </div>
  );
}
