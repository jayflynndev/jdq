"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/supabaseClient";
import CreateLeaderboardModal from "@/components/leaderboards/CreateLeaderboardModal";
import { fetchPrivateLeaderboardStandings } from "@/utils/fetchPrivateLeaderboardStandings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { BrandButton } from "@/components/ui/BrandButton";

type Leaderboard = {
  id: string;
  owner_id: string;
  name: string;
  quiz_type: "JDQ" | "JVQ";
  jdq_scope: "weekly" | "monthly" | "all_time" | null;
  jvq_days: string[] | null;
  jvq_scope: "monthly" | "all_time" | null;
  start_date: string | null;
  updated_at: string;
};

type SnapshotRow = { username: string; avg: number; entries: number };

const JDQ_LABEL: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  all_time: "All-time",
};
const JVQ_PERIOD_LABEL: Record<string, string> = {
  monthly: "Monthly",
  all_time: "All-time",
};
const DAY_LABEL: Record<string, string> = {
  thursday: "Thursday",
  saturday: "Saturday",
  combined: "Combined",
};

function niceDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function scopeLine(b: Leaderboard) {
  if (b.quiz_type === "JDQ") {
    const scope = JDQ_LABEL[b.jdq_scope || "all_time"] || "All-time";
    return `JDQ · ${scope}${
      b.start_date ? ` · from ${niceDate(b.start_date)}` : ""
    }`;
  }
  const days = (
    b.jvq_days && b.jvq_days.length ? b.jvq_days : ["combined"]
  ).map((d) => DAY_LABEL[d] || d);
  const dayText = days.includes("Combined") ? "Combined" : days.join(" & ");
  const period = JVQ_PERIOD_LABEL[b.jvq_scope || "all_time"] || "All-time";
  return `JVQ · ${dayText} · ${period}${
    b.start_date ? ` · from ${niceDate(b.start_date)}` : ""
  }`;
}

export default function LeaderboardsWidget() {
  const [openCreate, setOpenCreate] = useState(false);
  const [boards, setBoards] = useState<Leaderboard[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotRow[]>>({});

  useEffect(() => {
    (async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) return;

      const { data: owned } = await supabase
        .from("leaderboards")
        .select(
          "id, owner_id, name, quiz_type, jdq_scope, jvq_days, jvq_scope, start_date, updated_at"
        )
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      const { data: memberRows } = await supabase
        .from("leaderboard_members")
        .select("leaderboard_id")
        .eq("user_id", user.id);

      let memberBoards: Leaderboard[] = [];
      const ids = (memberRows || [])
        .map((r: any) => r.leaderboard_id)
        .filter(Boolean);

      if (ids.length) {
        const { data: b } = await supabase
          .from("leaderboards")
          .select(
            "id, owner_id, name, quiz_type, jdq_scope, jvq_days, jvq_scope, start_date, updated_at"
          )
          .in("id", ids)
          .order("updated_at", { ascending: false });
        memberBoards = (b || []) as Leaderboard[];
      }

      const map = new Map<string, Leaderboard>();
      for (const b of [...(owned || []), ...memberBoards]) map.set(b.id, b);
      const top2 = Array.from(map.values())
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        .slice(0, 2);

      setBoards(top2);

      const entries = await Promise.all(
        top2.map(async (lb) => {
          const { standings } = await fetchPrivateLeaderboardStandings(lb.id);
          const top3 = (standings || []).slice(0, 3).map((s) => ({
            username: s.username,
            avg: s.avg,
            entries: s.entries,
          }));
          return [lb.id, top3] as const;
        })
      );
      setSnapshots(Object.fromEntries(entries));
    })();
  }, []);

  return (
    <Card hover={false}>
      <CardHeader className="gap-2 sm:flex sm:items-center sm:justify-between">
        <div>
          <CardTitle>Your Leaderboards</CardTitle>
          <CardDescription>Recent boards & top-3 at a glance</CardDescription>
        </div>
        <div className="flex gap-2">
          <Link
            href="/leaderboards/mine"
            className="btn rounded-lg border borderc px-3 py-2 text-sm hover:bg-brand/10"
          >
            See all my leaderboards
          </Link>
          <BrandButton onClick={() => setOpenCreate(true)} size="sm">
            Create Leaderboard
          </BrandButton>
        </div>
      </CardHeader>

      <CardContent>
        {boards.length === 0 ? (
          <p className="text-sm text-textc-muted">
            You don’t have any leaderboards yet. Create one to get started.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {boards.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border borderc p-4 bg-white dark:bg-surface-inverted/60 shadow-card"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-base md:text-lg font-semibold text-textc">
                    {b.name}
                  </div>
                  <Link
                    href={`/leaderboards/${b.id}`}
                    className="rounded-md border borderc px-3 py-1.5 text-xs md:text-sm hover:bg-brand/10"
                  >
                    Open
                  </Link>
                </div>

                <div className="mb-3 text-xs md:text-sm text-textc-muted">
                  {scopeLine(b)}
                </div>

                {snapshots[b.id]?.length ? (
                  <div className="overflow-x-auto rounded-md border borderc">
                    <table className="w-full text-xs md:text-sm">
                      <thead className="bg-surface-subtle text-textc-muted">
                        <tr>
                          <th className="text-left font-medium px-2 py-1.5">
                            Pos
                          </th>
                          <th className="text-left font-medium px-2 py-1.5">
                            User
                          </th>
                          <th className="text-right font-medium px-2 py-1.5">
                            Avg
                          </th>
                          <th className="text-right font-medium px-2 py-1.5">
                            Entries
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshots[b.id].map((row, idx) => (
                          <tr key={idx} className="border-t borderc">
                            <td className="py-1.5 px-2">#{idx + 1}</td>
                            <td className="py-1.5 px-2">{row.username}</td>
                            <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                              {row.avg.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                              {row.entries}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-textc-muted italic">
                    No scores yet
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CreateLeaderboardModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(id) => {
          window.location.href = `/leaderboards/${id}`;
        }}
      />
    </Card>
  );
}
