// utils/fetchPrivateLeaderboardStandings.ts
import { supabase } from "@/supabaseClient";
import { getLeaderboardContext } from "./getLeaderboardContext";

export type PrivateStanding = {
  user_id: string;
  username: string;
  total: number; // kept for backward-compat
  avg: number; // ← use this
  entries: number; // ← and this
  avg_tb: number; // ← and this (average tiebreak)
};

function isoWeekStart(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // 1..7, Mon..Sun
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function fetchPrivateLeaderboardStandings(
  leaderboardId: string
): Promise<{
  standings: PrivateStanding[];
  ctx: Awaited<ReturnType<typeof getLeaderboardContext>>;
}> {
  const ctx = await getLeaderboardContext(leaderboardId);
  if (!ctx) return { standings: [], ctx: null as any };

  const memberIds = ctx.members.map((m) => m.user_id);
  if (memberIds.length === 0) return { standings: [], ctx };

  // Build date window
  const today = new Date();
  let fromDate: string | null = null;
  if (ctx.quiz_type === "JDQ") {
    if (ctx.jdq_scope === "weekly") fromDate = toYMD(isoWeekStart(today));
    else if (ctx.jdq_scope === "monthly") fromDate = toYMD(monthStart(today));
  } else {
    if (ctx.jvq_scope === "monthly") fromDate = toYMD(monthStart(today));
  }
  if (ctx.start_date) {
    if (!fromDate) fromDate = ctx.start_date;
    else
      fromDate = toYMD(
        new Date(
          Math.max(
            new Date(fromDate).getTime(),
            new Date(ctx.start_date).getTime()
          )
        )
      );
  }

  // Base query
  let q = supabase
    .from("scores")
    .select("uid, score, tiebreaker, quiz_date, quiz_type, day_type")
    .eq("quiz_type", ctx.quiz_type)
    .in("uid", memberIds);

  if (fromDate) q = q.gte("quiz_date", fromDate);

  // JVQ day filter
  if (ctx.quiz_type === "JVQ") {
    const days = (ctx.jvq_days || []).map((s) => s.toLowerCase());
    const wantCombined = days.includes("combined");
    const wantThu = days.includes("thursday");
    const wantSat = days.includes("saturday");
    if (!wantCombined) {
      const allowed: string[] = [];
      if (wantThu) allowed.push("Thursday");
      if (wantSat) allowed.push("Saturday");
      if (allowed.length) q = q.in("day_type", allowed);
      else
        return {
          standings: ctx.members.map((m) => ({
            user_id: m.user_id,
            username: m.username,
            total: 0,
            avg: 0,
            entries: 0,
            avg_tb: 0,
          })),
          ctx,
        };
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error("scores fetch error", error);
    return { standings: [], ctx };
  }

  // Aggregate per user
  const agg = new Map<
    string,
    { total: number; count: number; tb_sum: number }
  >();
  for (const row of data || []) {
    const uid = row.uid as string;
    const sc = Number(row.score ?? 0);
    const tb = Number(row.tiebreaker ?? 0);
    const cur = agg.get(uid) || { total: 0, count: 0, tb_sum: 0 };
    cur.total += sc;
    cur.count += 1;
    cur.tb_sum += tb;
    agg.set(uid, cur);
  }

  // Compose standings (everyone listed, 0s if no entries)
  const standings: PrivateStanding[] = ctx.members.map((m) => {
    const a = agg.get(m.user_id) || { total: 0, count: 0, tb_sum: 0 };
    const avg = a.count ? a.total / a.count : 0;
    const avg_tb = a.count ? a.tb_sum / a.count : 0;
    return {
      user_id: m.user_id,
      username: m.username,
      total: a.total,
      avg: Number(avg.toFixed(2)),
      entries: a.count,
      avg_tb: Number(avg_tb.toFixed(1)),
    };
  });

  // Sort like globals: avg desc → avg_tb asc → username
  standings.sort(
    (a, b) =>
      b.avg - a.avg ||
      a.avg_tb - b.avg_tb ||
      a.username.localeCompare(b.username)
  );

  return { standings, ctx };
}
