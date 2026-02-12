"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

type Row = {
  quiz_id: string;
  name: string;
  starts_at: string;
  phase: string | null;
};

type Tone = "live" | "upcoming" | "ended" | "other";

function humanPhase(phase: string): string {
  const map: Record<string, string> = {
    PRE_QUIZ: "Getting ready",
    COUNTDOWN_TO_ANSWERING: "Next question soon",
    ANSWERING: "Answering open",
    COUNTDOWN_TO_LOCK: "Closing answers",
    ANSWERS_FINALISING: "Checking answers",
    ANSWERS_READY_TO_SWAP: "Preparing marking",
    SWAPPING: "Swapping sheets",
    MARKING: "Marking",
    COUNTDOWN_TO_SUBMIT_MARKS: "Submitting scores",
    MARKS_FINALISING: "Finalising scores",
    SCORES_READY: "Scores ready",
    LEADERBOARD_PREPARING: "Preparing leaderboard",
    LEADERBOARD_READY: "Leaderboard ready",
    SHOW_LEADERBOARD: "Leaderboard",
    ENDED: "Ended",
  };

  return map[phase] ?? "In progress";
}

function statusFrom(row: Row): { label: string; hint: string; tone: Tone } {
  const now = Date.now();
  const starts = row.starts_at ? new Date(row.starts_at).getTime() : NaN;

  if (row.phase === "ENDED") {
    return { label: "Ended", hint: "Results available", tone: "ended" };
  }

  if (row.phase) {
    const livePhases = new Set([
      "PRE_QUIZ",
      "COUNTDOWN_TO_ANSWERING",
      "ANSWERING",
      "COUNTDOWN_TO_LOCK",
      "ANSWERS_FINALISING",
      "ANSWERS_READY_TO_SWAP",
      "SWAPPING",
      "MARKING",
      "COUNTDOWN_TO_SUBMIT_MARKS",
      "MARKS_FINALISING",
      "SCORES_READY",
      "LEADERBOARD_PREPARING",
      "LEADERBOARD_READY",
      "SHOW_LEADERBOARD",
    ]);

    if (livePhases.has(row.phase)) {
      return { label: "Live", hint: humanPhase(row.phase), tone: "live" };
    }

    return { label: row.phase, hint: row.phase, tone: "other" };
  }

  if (!Number.isNaN(starts)) {
    if (starts > now) {
      return { label: "Upcoming", hint: "Not started yet", tone: "upcoming" };
    }
    return { label: "Waiting", hint: "Quiz not live yet", tone: "other" };
  }

  return { label: "Unknown", hint: "No runtime info", tone: "other" };
}

function formatStarts(startsAt: string) {
  const d = new Date(startsAt);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({
  label,
  hint,
  tone,
}: {
  label: string;
  hint: string;
  tone: Tone;
}) {
  const pill = useMemo(() => {
    switch (tone) {
      case "live":
        return {
          wrap: "border-yellow-300/60 bg-yellow-300/25 text-yellow-50",
          dot: "bg-yellow-200",
        };
      case "upcoming":
        return {
          wrap: "border-violet-200/40 bg-violet-200/10 text-violet-50",
          dot: "bg-violet-200",
        };
      case "ended":
        return {
          wrap: "border-violet-200/30 bg-violet-200/10 text-violet-100",
          dot: "bg-violet-200/70",
        };
      default:
        return {
          wrap: "border-violet-300/35 bg-violet-200/5 text-violet-100",
          dot: "bg-violet-200/70",
        };
    }
  }, [tone]);

  return (
    <div className="text-right">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${pill.wrap}`}
      >
        <span className={`h-2 w-2 rounded-full ${pill.dot}`} />
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xs text-violet-100/70">{hint}</div>
    </div>
  );
}

export function QuizLobbyList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase.rpc("qhl_player_list_quizzes_lobby");

    if (error) {
      console.error("Lobby load error:", error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("qhl_lobby_runtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qhl_quiz_runtime" },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="qhl-card">
        <div className="text-sm text-violet-100/80">Loading quizzes...</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="qhl-card">
        <div className="text-sm text-violet-100/80">No quizzes yet.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {rows.map((r) => {
        const s = statusFrom(r);

        return (
          <div
            key={r.quiz_id}
            className="qhl-card transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-base font-bold tracking-tight text-white md:text-lg">
                  {r.name}
                </div>
                <div className="mt-1 text-sm text-violet-100/80">
                  <span className="text-violet-200/70">Starts:</span>{" "}
                  {formatStarts(r.starts_at)}
                </div>
              </div>

              <StatusPill label={s.label} hint={s.hint} tone={s.tone} />
            </div>

            <div className="mt-4 flex justify-end">
              <Link
                className="qhl-btn-primary"
                href={`/qhl/players/qhl/${r.quiz_id}`}
              >
                Open Lobby
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
