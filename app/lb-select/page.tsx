"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";

type Row = { username: string; avg: number; entries: number };

function MiniTable({ rows }: { rows: Row[] }) {
  if (!rows?.length) {
    return <p className="text-sm text-textc-muted italic">No scores yet</p>;
  }
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
            <tr key={i} className="border-t borderc">
              <td className="py-1.5 px-2">
                {i === 0 && "🥇 "}
                {i === 1 && "🥈 "}
                {i === 2 && "🥉 "}#{i + 1}
              </td>
              <td className="py-1.5 px-2">{r.username}</td>
              <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                {r.avg.toFixed(2)}
              </td>
              <td className="py-1.5 px-2 text-right font-mono tabular-nums">
                {r.entries}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type JDQVariant = "weekly" | "monthly" | "all_time";
type JVQVariant = {
  days: ("Thursday" | "Saturday")[];
  scope: "monthly" | "all_time";
  label: string;
};

const JDQ_ROTATIONS: { key: JDQVariant; label: string }[] = [
  { key: "weekly", label: "JDQ · Weekly" },
  { key: "monthly", label: "JDQ · Monthly" },
  { key: "all_time", label: "JDQ · All-time" },
];

const JVQ_ROTATIONS: JVQVariant[] = [
  { days: ["Thursday"], scope: "all_time", label: "JVQ · Thursday · All-time" },
  { days: ["Saturday"], scope: "all_time", label: "JVQ · Saturday · All-time" },
  {
    days: ["Thursday", "Saturday"],
    scope: "all_time",
    label: "JVQ · Combined · All-time",
  },
];

function Rotator<T>({
  items,
  render,
  intervalMs = 30000,
  controls,
}: {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  intervalMs?: number;
  controls?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!items.length) return;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      intervalMs
    );
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [items.length, intervalMs]);

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {render(items[idx], idx)}
      {controls && (
        <div className="flex items-center justify-end gap-2">
          <button
            className="rounded-md border borderc px-2 py-1 text-sm hover:bg-brand/10"
            onClick={() => setIdx((i) => (i - 1 + items.length) % items.length)}
            aria-label="Previous"
          >
            ◀
          </button>
          <button
            className="rounded-md border borderc px-2 py-1 text-sm hover:bg-brand/10"
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            aria-label="Next"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default function GlobalLeaderboardSelectPage() {
  const [jdqData, setJdqData] = useState<Record<JDQVariant, Row[]>>({
    weekly: [],
    monthly: [],
    all_time: [],
  });
  const [jvqData, setJvqData] = useState<Record<string, Row[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sortRows = (rows: Row[]) =>
      [...rows].sort(
        (a, b) =>
          // avg desc, then tiebreak asc, then username asc
          b.avg - a.avg ||
          (a as any).avg_tiebreaker - (b as any).avg_tiebreaker ||
          a.username.localeCompare(b.username)
      );

    const filterByMinEntries = (rows: Row[], min: number) =>
      rows.filter((r) => (r.entries ?? 0) >= min);

    (async () => {
      // ---------- JDQ ----------
      const jdqEntries = await Promise.all(
        JDQ_ROTATIONS.map(async ({ key }) => {
          // Ask for more than 5 so we can filter then take top 5.
          // Weekly doesn't need many, but harmless to keep consistent.
          const { data, error } = await supabase.rpc("global_jdq_standings", {
            p_scope: key,
            p_start_date: null,
            p_limit: key === "weekly" ? 50 : 200, // bigger for monthly/all-time
          });
          if (error) return [key, []] as const;

          const min = key === "all_time" ? 20 : key === "monthly" ? 5 : 0;

          const filtered = filterByMinEntries(data || [], min);
          const sorted = sortRows(filtered).slice(0, 5);

          return [key, sorted] as const;
        })
      );

      // ---------- JVQ ----------
      const jvqEntries = await Promise.all(
        JVQ_ROTATIONS.map(async (v) => {
          const { data, error } = await supabase.rpc("global_jvq_standings", {
            p_days: v.days,
            p_scope: v.scope, // all_time
            p_start_date: null,
            p_limit: 200, // get plenty, then filter
          });
          if (error) return [v.label, []] as const;

          const filtered = filterByMinEntries(data || [], 5); // min 5 for all JVQ all-time variants
          const sorted = sortRows(filtered).slice(0, 5);

          return [v.label, sorted] as const;
        })
      );

      setJdqData(Object.fromEntries(jdqEntries) as Record<JDQVariant, Row[]>);
      setJvqData(Object.fromEntries(jvqEntries) as Record<string, Row[]>);
      setLoading(false);
    })();
  }, []);

  const btnLink =
    "inline-flex items-center justify-center rounded-lg bg-brand text-white shadow-card px-3 py-2 text-sm hover:opacity-90";

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-white">
          <h1 className="font-heading text-3xl">Global leaderboards</h1>
          <p className="text-black/80">
            Pick JDQ or JVQ and peek at the current top tables.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* JDQ */}
          <Card hover={false} className="bg-white shadow-card">
            <CardHeader className="sm:flex sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>JDQ</CardTitle>
                <CardDescription>
                  Daily Quiz — weekly, monthly, all-time
                </CardDescription>
              </div>
              <Link href="/lb-select/jdqlb" className={btnLink}>
                Open JDQ global boards
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-5 w-1/3 bg-surface-subtle rounded" />
                  <div className="h-28 w-full bg-surface-subtle rounded" />
                </div>
              ) : (
                <Rotator
                  items={JDQ_ROTATIONS}
                  controls
                  render={(item) => (
                    <>
                      <div className="font-semibold text-textc">
                        {item.label}
                      </div>
                      <MiniTable rows={jdqData[item.key]} />
                    </>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* JVQ */}
          <Card hover={false} className="bg-white shadow-card">
            <CardHeader className="sm:flex sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>JVQ</CardTitle>
                <CardDescription>
                  Live Show — Thursday & Saturday
                </CardDescription>
              </div>
              <Link href="/lb-select/jvpqlb" className={btnLink}>
                Open JVQ global boards
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-5 w-1/3 bg-surface-subtle rounded" />
                  <div className="h-28 w-full bg-surface-subtle rounded" />
                </div>
              ) : (
                <Rotator
                  items={JVQ_ROTATIONS}
                  controls
                  render={(item) => (
                    <>
                      <div className="font-semibold text-textc">
                        {item.label}
                      </div>
                      <MiniTable rows={jvqData[item.label] || []} />
                    </>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
