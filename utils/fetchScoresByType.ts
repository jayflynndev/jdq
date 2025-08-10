// utils/fetchScoresByType.ts
import { supabase } from "@/supabaseClient";

export type Score = {
  user_id: string;
  username: string;
  quizDate: string; // 'YYYY-MM-DD'
  score: number | null;
  tiebreaker: number | null;
  quizType: string;
};

type FetchOpts =
  | { date: string } // exact date
  | { from: string; to: string } // inclusive range
  | undefined;

export async function fetchScoresByType(
  quizType: string,
  opts?: FetchOpts
): Promise<Score[]> {
  let q = supabase
    .from("scores")
    .select("uid, quiz_date, score, tiebreaker, quiz_type, profiles(username)")
    .eq("quiz_type", quizType); // values are 'JDQ' | 'JVQ'

  if (opts && "date" in opts) {
    q = q.eq("quiz_date", opts.date);
  } else if (opts && "from" in opts && "to" in opts) {
    q = q.gte("quiz_date", opts.from).lte("quiz_date", opts.to);
  }

  const { data, error } = await q;
  if (error) {
    console.error("Supabase error:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    user_id: row.uid,
    username: row.profiles?.username ?? "Unknown",
    quizDate: row.quiz_date,
    score: row.score,
    tiebreaker: row.tiebreaker,
    quizType: row.quiz_type,
  }));
}
