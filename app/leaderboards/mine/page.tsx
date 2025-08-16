"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import toast from "react-hot-toast";
import CreateLeaderboardModal from "@/components/leaderboards/CreateLeaderboardModal";
import { fetchPrivateLeaderboardStandings } from "@/utils/fetchPrivateLeaderboardStandings";

type QuizType = "JDQ" | "JVQ";
type JDQScope = "weekly" | "monthly" | "all_time";
type JVQScope = "monthly" | "all_time";

type Leaderboard = {
  id: string;
  owner_id: string;
  name: string;
  quiz_type: QuizType;
  jdq_scope: JDQScope | null;
  jvq_days: string[] | null;
  jvq_scope: JVQScope | null;
  start_date: string | null;
  updated_at: string;
};

type SnapshotRow = { username: string; avg: number; entries: number };

function MiniTable({ rows }: { rows: SnapshotRow[] | undefined }) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-textc-muted italic">No scores yet</p>;
  }
  const tint = (i: number) =>
    i === 0
      ? "bg-yellow-50"
      : i === 1
      ? "bg-gray-50"
      : i === 2
      ? "bg-amber-50"
      : "";
  const medal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
  return (
    <div className="overflow-x-auto rounded-md border borderc">
      <table className="w-full text-sm">
        <thead className="bg-surface-subtle text-textc-muted">
          <tr>
            <th className="text-left font-medium px-2 py-1.5">Pos</th>
            <th className="text-left font-medium px-2 py-1.5">User</th>
            <th className="text-right font-medium px-2 py-1.5">Avg</th>
            <th className="text-right font-medium px-2 py-1.5">Entries</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.username}-${i}`}
              className={`border-t borderc ${tint(i)}`}
            >
              <td className="py-1.5 px-2">
                {medal(i)} #{i + 1}
              </td>
              <td className="py-1.5 px-2">{r.username}</td>
              <td className="py-1.5 px-2 text-right">{r.avg.toFixed(2)}</td>
              <td className="py-1.5 px-2 text-right">{r.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MyLeaderboardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [created, setCreated] = useState<Leaderboard[]>([]);
  const [memberOf, setMemberOf] = useState<Leaderboard[]>([]);
  const [openCreate, setOpenCreate] = useState(false);

  // previews + member counts
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotRow[]>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);

    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp.user) {
      setCreated([]);
      setMemberOf([]);
      setSnapshots({});
      setMemberCounts({});
      setLoading(false);
      return;
    }
    const uid = userResp.user.id;

    const { data: owned } = await supabase
      .from("leaderboards")
      .select(
        "id, owner_id, name, quiz_type, jdq_scope, jvq_days, jvq_scope, start_date, updated_at"
      )
      .eq("owner_id", uid)
      .order("updated_at", { ascending: false });

    const { data: myRows } = await supabase
      .from("leaderboard_members")
      .select("leaderboard_id")
      .eq("user_id", uid);

    const ids = (myRows || [])
      .map((r: { leaderboard_id: string }) => r.leaderboard_id)
      .filter(Boolean);

    let memberBoards: Leaderboard[] = [];
    if (ids.length) {
      const { data: boards } = await supabase
        .from("leaderboards")
        .select(
          "id, owner_id, name, quiz_type, jdq_scope, jvq_days, jvq_scope, start_date, updated_at"
        )
        .in("id", ids)
        .neq("owner_id", uid)
        .order("updated_at", { ascending: false });
      memberBoards = (boards || []) as Leaderboard[];
    }

    const createdList = (owned || []) as Leaderboard[];
    setCreated(createdList);
    setMemberOf(memberBoards);

    // --- snapshots (top 3) ---
    const allBoards = [...createdList, ...memberBoards];
    const snapshotPairs = await Promise.all(
      allBoards.map(async (b) => {
        const { standings } = await fetchPrivateLeaderboardStandings(b.id);
        const top3 =
          (standings || []).slice(0, 3).map((s) => ({
            username: s.username,
            avg: s.avg,
            entries: s.entries,
          })) ?? [];
        return [b.id, top3] as const;
      })
    );
    setSnapshots(Object.fromEntries(snapshotPairs));

    // --- member counts (distinct users per board, include owner) ---
    if (allBoards.length) {
      const allIds = allBoards.map((b) => b.id);

      let counts: Record<string, number> = {};
      if (allIds.length) {
        const { data: mcData, error: mcErr } = await supabase.rpc(
          "member_counts",
          {
            board_ids: allIds,
          }
        );
        if (!mcErr && mcData) {
          counts = Object.fromEntries(
            mcData.map(
              (r: { leaderboard_id: string; member_count: number }) => [
                r.leaderboard_id,
                r.member_count,
              ]
            )
          );
        }
      }
      setMemberCounts(counts);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.rpc("clear_notifications", {
          p_user_id: u.user.id,
          p_scope: "leaderboards",
        });
        window.dispatchEvent(new Event("notif-refresh"));
      }
    })();
  }, [load]);

  const deleteLeaderboard = async (id: string) => {
    if (!confirm("Delete this leaderboard? This cannot be undone.")) return;
    const { error } = await supabase.from("leaderboards").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Leaderboard deleted");
      setCreated((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const renderCard = (b: Leaderboard, isOwner: boolean) => (
    <li
      key={b.id}
      className="rounded-xl border border-white/40 bg-white shadow-card p-4"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-textc">{b.name}</div>
          <div className="text-sm text-textc-muted">
            {b.quiz_type} • {memberCounts[b.id] ?? 0}{" "}
            {memberCounts[b.id] === 1 ? "member" : "members"}
            {b.start_date
              ? ` · from ${new Date(b.start_date).toLocaleDateString()}`
              : ""}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/leaderboards/${b.id}`}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Open
          </Link>
          {isOwner && (
            <button
              onClick={() => deleteLeaderboard(b.id)}
              className="rounded-md border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* preview table */}
      <MiniTable rows={snapshots[b.id]} />
    </li>
  );

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-52 rounded bg-surface-subtle" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-40 rounded bg-surface-subtle" />
              <div className="h-40 rounded bg-surface-subtle" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-textc">My Leaderboards</h1>
          <button
            onClick={() => setOpenCreate(true)}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Create Leaderboard
          </button>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-textc">
            Created by you
          </h2>
          {created.length === 0 ? (
            <p className="text-sm text-textc-muted">
              You haven’t created any leaderboards yet.
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {created.map((b) => renderCard(b, true))}
            </ul>
          )}
        </section>

        {memberOf.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-textc">
              You are a member
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {memberOf.map((b) => renderCard(b, false))}
            </ul>
          </section>
        )}

        <CreateLeaderboardModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={(id) => router.push(`/leaderboards/${id}`)}
        />
      </div>
    </main>
  );
}
