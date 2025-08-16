// utils/fetchLeaderboard.ts
"use client";
import { supabase } from "@/supabaseClient";
import { monthWindow, weekWindow } from "./dateWindows";

export type LBRow = {
  username: string;
  avg_score: number | null;
  avg_tiebreaker: number | null;
  entries: number;
};

type QuizType = "JDQ" | "JVQ";

type BaseParams = {
  quizType: QuizType;
  // Optional cut-off for old scores (e.g., private LB start date)
  startDate?: string | null; // 'YYYY-MM-DD'
  minEntries?: number; // default 20
};

type RangeParams = BaseParams & {
  from?: string | null; // 'YYYY-MM-DD'
  to?: string | null; // 'YYYY-MM-DD'
};

type JVQParams = RangeParams & {
  days?: ("Thursday" | "Saturday")[] | "Combined" | null;
};

// Low-level call to the RPC
export async function getLeaderboardRPC(params: {
  quizType: QuizType;
  from?: string | null;
  to?: string | null;
  dayTypes?: string[] | null; // e.g. ['Thursday','Saturday']
  startDate?: string | null;
  minEntries?: number; // default 20
}): Promise<LBRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_quiz_type: params.quizType,
    p_date_from: params.from ?? null,
    p_date_to: params.to ?? null,
    p_day_types: params.dayTypes ?? null,
    p_start_date: params.startDate ?? null,
    p_min_entries: params.minEntries ?? 20,
  });
  if (error) {
    console.error("get_leaderboard RPC error:", error);
    return [];
  }
  return (data ?? []) as LBRow[];
}

/* ---------- JDQ convenience ---------- */
// All-time JDQ
export async function fetchJDQAllTime(opts: BaseParams) {
  return getLeaderboardRPC({
    quizType: "JDQ",
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}
// Monthly JDQ (month of "at" or current month)
export async function fetchJDQMonthly(opts: BaseParams & { at?: Date }) {
  const { from, to } = monthWindow(opts.at);
  return getLeaderboardRPC({
    quizType: "JDQ",
    from,
    to,
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}
// Weekly JDQ (week of "at" or current week)
export async function fetchJDQWeekly(opts: BaseParams & { at?: Date }) {
  const { from, to } = weekWindow(opts.at);
  return getLeaderboardRPC({
    quizType: "JDQ",
    from,
    to,
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}

/* ---------- JVQ convenience ---------- */
// Normalise days -> string[]
function normalizeJVQDays(days: JVQParams["days"]): string[] | null {
  if (!days) return null;
  if (days === "Combined") return ["Thursday", "Saturday"];
  return days;
}
// All-time JVQ (optionally Thursday/Saturday/Combined)
export async function fetchJVQAllTime(opts: JVQParams) {
  return getLeaderboardRPC({
    quizType: "JVQ",
    dayTypes: normalizeJVQDays(opts.days ?? "Combined"),
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}
// Monthly JVQ (by month; days can be 'Thursday'|'Saturday'|'Combined')
export async function fetchJVQMonthly(opts: JVQParams & { at?: Date }) {
  const { from, to } = monthWindow(opts.at);
  return getLeaderboardRPC({
    quizType: "JVQ",
    from,
    to,
    dayTypes: normalizeJVQDays(opts.days ?? "Combined"),
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}
// Weekly JVQ (by ISO week)
export async function fetchJVQWeekly(opts: JVQParams & { at?: Date }) {
  const { from, to } = weekWindow(opts.at);
  return getLeaderboardRPC({
    quizType: "JVQ",
    from,
    to,
    dayTypes: normalizeJVQDays(opts.days ?? "Combined"),
    startDate: opts.startDate ?? null,
    minEntries: opts.minEntries,
  });
}
