"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/supabaseClient";
import { fetchPrivateLeaderboardStandings } from "@/utils/fetchPrivateLeaderboardStandings";

/* ---------------- helpers ---------------- */
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type Standing = {
  user_id: string;
  username: string;
  total: number;
  avg: number;
  avg_tb: number;
  entries: number;
};

const rowTint = (idx: number) =>
  idx === 0
    ? "bg-yellow-50"
    : idx === 1
    ? "bg-gray-50"
    : idx === 2
    ? "bg-amber-50"
    : "";
const medal = (idx: number) =>
  idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";

/* ---------------- page ---------------- */
export default function LeaderboardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [me, setMe] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [name, setName] = useState<string>("");
  const [headerScope, setHeaderScope] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>(null);

  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  // new UI state
  const [searchedUsername, setSearchedUsername] = useState("");
  const debouncedSearch = useDebounced(searchedUsername, 400);
  const [showFull, setShowFull] = useState(false);

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp.user) {
      toast.error("Please sign in to view this leaderboard");
      router.push("/login");
      return;
    }
    const myId = userResp.user.id;
    setMe(myId);

    const { standings: s, ctx } = await fetchPrivateLeaderboardStandings(id);
    if (!ctx) {
      toast.error("Leaderboard not found");
      setLoading(false);
      return;
    }

    setIsOwner(ctx.owner_id === myId);
    setName(ctx.name);
    setStartDate(ctx.start_date);

    if (ctx.quiz_type === "JDQ") {
      const pretty =
        (ctx.jdq_scope === "weekly" && "Weekly") ||
        (ctx.jdq_scope === "monthly" && "Monthly") ||
        "All-time";
      setHeaderScope(`JDQ · ${pretty}`);
    } else {
      const days = (
        ctx.jvq_days && ctx.jvq_days.length ? ctx.jvq_days : ["combined"]
      )
        .map((d) =>
          d === "combined"
            ? "Combined"
            : d === "thursday"
            ? "Thursday"
            : d === "saturday"
            ? "Saturday"
            : d
        )
        .join(" & ");
      const period = (ctx.jvq_scope === "monthly" && "Monthly") || "All-time";
      setHeaderScope(`JVQ · ${days} · ${period}`);
    }

    setStandings(s);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const removeMember = async (userId: string) => {
    const ok = confirm("Remove this member from the leaderboard?");
    if (!ok || !id) return;
    const { error } = await supabase
      .from("leaderboard_members")
      .delete()
      .eq("leaderboard_id", id)
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Member removed");
      await loadAll();
    }
  };

  const leaveBoard = async () => {
    if (!id || !me) return;
    const ok = confirm("Leave this leaderboard?");
    if (!ok) return;
    const { error } = await supabase
      .from("leaderboard_members")
      .delete()
      .eq("leaderboard_id", id)
      .eq("user_id", me);
    if (error) toast.error(error.message);
    else {
      toast.success("You left the leaderboard");
      router.push("/leaderboards/mine");
    }
  };

  // search highlight (don’t filter; just highlight + summary)
  const highlightIndex = useMemo(() => {
    if (!debouncedSearch.trim()) return null;
    const idx = standings.findIndex(
      (u) => u.username?.toLowerCase() === debouncedSearch.trim().toLowerCase()
    );
    return idx >= 0 ? idx : null;
  }, [standings, debouncedSearch]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back / header */}
        <div className="mb-4">
          <Link
            href="/leaderboards/mine"
            className="rounded-md border borderc px-3 py-2 text-sm hover:bg-brand/10"
          >
            ← My Leaderboards
          </Link>
        </div>

        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-textc">{name}</h1>
            <div className="text-sm text-textc-muted">
              {headerScope}
              {startDate
                ? ` · from ${new Date(startDate).toLocaleDateString()}`
                : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={leaveBoard}
                className="rounded-md border borderc px-3 py-2 text-sm hover:bg-brand/10"
              >
                Leave
              </button>
            )}
          </div>
        </header>

        {/* Search bar */}
        <div className="mb-3">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search username"
              value={searchedUsername}
              onChange={(e) => setSearchedUsername(e.target.value)}
              className="w-full rounded-lg border borderc bg-white px-10 py-2 text-sm placeholder:text-textc-muted focus:outline-none focus:ring-4 focus:ring-brand/20"
              aria-label="Search for a username"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              🔎
            </span>
            <button
              type="button"
              onClick={() => setSearchedUsername("")}
              disabled={!searchedUsername.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border borderc px-2 py-1 text-xs hover:bg-brand/10 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Highlight summary */}
        {highlightIndex !== null && standings[highlightIndex] && (
          <div className="mb-4 rounded bg-green-100 p-4 text-black shadow">
            <p className="font-bold mb-1">
              {highlightIndex < 10
                ? "🎉 They’re in the top 10:"
                : "Here’s their ranking:"}
            </p>
            <p>
              <strong>#{highlightIndex + 1}</strong> —{" "}
              {standings[highlightIndex].username} —{" "}
              {standings[highlightIndex].avg.toFixed(2)} avg (Tiebreak avg:{" "}
              {standings[highlightIndex].avg_tb.toFixed(1)}) —{" "}
              {standings[highlightIndex].entries} entries
            </p>
          </div>
        )}

        {/* Table card */}
        <section className="rounded-lg border border-white/40 bg-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b borderc bg-surface-subtle px-3 py-2">
            <div className="text-sm font-medium text-textc">Standings</div>
            <button
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
              onClick={() => setShowFull((p) => !p)}
            >
              {showFull ? "Hide Full Leaderboard" : "Show Full Leaderboard"}
            </button>
          </div>

          {standings.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">No scores yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-subtle text-textc-muted">
                  <tr className="text-left">
                    <th className="px-3 py-2 rounded-tl-lg">Position</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2 text-right">Avg Score</th>
                    <th className="px-3 py-2 text-right">Avg Tiebreak</th>
                    <th className="px-3 py-2 text-right">Entries</th>
                    <th className="px-3 py-2 text-right rounded-tr-lg"></th>
                  </tr>
                </thead>
                <tbody>
                  {(showFull ? standings : standings.slice(0, 10)).map(
                    (s, i) => {
                      const isHit =
                        debouncedSearch.trim() &&
                        s.username?.toLowerCase() ===
                          debouncedSearch.trim().toLowerCase();
                      return (
                        <tr
                          key={s.user_id}
                          className={`border-t border-gray-200 ${rowTint(i)} ${
                            isHit ? "bg-green-100 font-semibold" : ""
                          }`}
                        >
                          <td className="px-3 py-2 font-semibold">
                            {medal(i)} #{i + 1}
                          </td>
                          <td className="px-3 py-2">{s.username}</td>
                          <td className="px-3 py-2 text-right">
                            {s.avg.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {s.avg_tb.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right">{s.entries}</td>
                          <td className="px-3 py-2 text-right">
                            {isOwner && me !== s.user_id && (
                              <button
                                onClick={() => removeMember(s.user_id)}
                                className="rounded border px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            )}
                            {!isOwner && me === s.user_id && (
                              <button
                                onClick={leaveBoard}
                                className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                              >
                                Leave
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
              {!showFull && standings.length > 10 && (
                <div className="px-3 py-2 text-xs text-textc-muted">
                  Showing top 10 — click “Show Full Leaderboard” to see all.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
