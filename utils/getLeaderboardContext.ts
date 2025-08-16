import { supabase } from "@/supabaseClient";

export type LeaderboardCtx = {
  id: string;
  name: string;
  owner_id: string;
  quiz_type: "JDQ" | "JVQ";
  jdq_scope: "weekly" | "monthly" | "all_time" | null;
  jvq_days: string[] | null; // ["thursday"] | ["saturday"] | ["combined"] | combinations (we'll treat 1 only)
  jvq_scope: "monthly" | "all_time" | null;
  start_date: string | null; // "YYYY-MM-DD" or null
  members: { user_id: string; username: string }[];
};

export async function getLeaderboardContext(
  id: string
): Promise<LeaderboardCtx | null> {
  // board
  const { data: lb, error: lbErr } = await supabase
    .from("leaderboards")
    .select(
      "id, owner_id, name, quiz_type, jdq_scope, jvq_days, jvq_scope, start_date"
    )
    .eq("id", id)
    .single();
  if (lbErr || !lb) return null;

  // members (RPC avoids RLS recursion)
  const { data: mems, error: memErr } = await supabase.rpc(
    "get_leaderboard_members",
    { p_leaderboard_id: id }
  );
  if (memErr) return null;

  return {
    id: lb.id,
    owner_id: lb.owner_id,
    name: lb.name,
    quiz_type: lb.quiz_type,
    jdq_scope: lb.jdq_scope,
    jvq_days: lb.jvq_days,
    jvq_scope: lb.jvq_scope,
    start_date: lb.start_date,
    members: (mems || []).map((m: any) => ({
      user_id: m.user_id,
      username: m.username,
    })),
  };
}
