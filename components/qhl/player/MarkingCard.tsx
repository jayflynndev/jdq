"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";
import type { TeamRow } from "@/src/qhl/teamTypes";
import type { QuizSetup } from "@/src/qhl/quizTypes";
import { MarkingSheet } from "@/components/qhl/player/MarkingSheet";
import {
  coerceMarksToPartShape,
  toggleMark,
  type MarksV1,
} from "@/src/qhl/marksV1";
import { coerceAnswersToPartShape, type AnswersV1 } from "@/src/qhl/answersV1";
import { MarkingWaitingCard } from "@/components/qhl/player/MarkingWaitingCard";

export function MarkingCard({
  quizId,
  runtime,
  myTeam,
  setup,
}: {
  quizId: string;
  runtime: QuizRuntime | null;
  myTeam: TeamRow | null;
  setup: QuizSetup | null;
}) {
  const phase = runtime?.phase;
  const partIndex = runtime?.part_index ?? 1;

  const show = phase === "MARKING" || phase === "COUNTDOWN_TO_SUBMIT_MARKS";

  const part = useMemo(() => {
    if (!setup || setup.length === 0) return null;
    const idx = Math.max(1, Math.min(partIndex, setup.length)) - 1;
    return setup[idx] ?? null;
  }, [setup, partIndex]);

  const [answersToMark, setAnswersToMark] = useState<AnswersV1 | null>(null);
  const [marks, setMarks] = useState<MarksV1>({ v: 1, rounds: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) =>
        setUserId(data.user?.id ?? null),
      );
  }, []);

  const isCaptain = !!userId && !!myTeam && myTeam.captain_user_id === userId;
  const editable = show && isCaptain;

  useEffect(() => {
    let cancelled = false;

    async function loadSheet() {
      setError(null);

      if (!myTeam || !part || !show || !isCaptain) return;

      const { data, error: rpcErr } = await supabase.rpc(
        "qhl_player_get_my_marking_sheet",
        {
          p_quiz_id: quizId,
          p_part_index: partIndex,
          p_team_id: myTeam.id,
        },
      );

      if (cancelled) return;

      if (rpcErr) {
        console.error(rpcErr);
        setError(rpcErr.message);
        setAnswersToMark(null);
        return;
      }

      const rawAnswers = data?.[0]?.answers ?? {};
      const coercedAnswers = coerceAnswersToPartShape(rawAnswers, part);
      setAnswersToMark(coercedAnswers);

      const { data: marksData, error: marksErr } = await supabase.rpc(
        "qhl_player_get_my_draft_marks",
        {
          p_quiz_id: quizId,
          p_part_index: partIndex,
          p_team_id: myTeam.id,
        },
      );

      if (marksErr) {
        console.error(marksErr);
        setMarks(coerceMarksToPartShape(null, part));
      } else {
        setMarks(coerceMarksToPartShape(marksData, part));
      }
    }

    loadSheet();
    return () => {
      cancelled = true;
    };
  }, [quizId, partIndex, myTeam, myTeam?.id, part, show, isCaptain]);

  async function saveDraft(next: MarksV1) {
    if (!myTeam || !part || !isCaptain) return;

    setSaving(true);

    const { error: rpcErr } = await supabase.rpc(
      "qhl_player_save_my_draft_marks",
      {
        p_quiz_id: quizId,
        p_part_index: partIndex,
        p_team_id: myTeam.id,
        p_marks: next,
      },
    );

    if (rpcErr) {
      console.error(rpcErr);
      setError(rpcErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
  }

  useEffect(() => {
    if (!editable) return;
    if (!myTeam) return;
    const id = setTimeout(() => saveDraft(marks), 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marks, editable, myTeam?.id]);

  if (!runtime || !show) return null;

  if (!myTeam) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-slate-900">Marking</div>
        <div className="mt-1 text-sm text-slate-600">Join a team to mark.</div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-slate-900">
          Marking{" "}
          <span className="text-slate-500 font-medium">· Part {partIndex}</span>
        </div>
        <div className="mt-1 text-sm text-slate-600">Quiz setup not found.</div>
      </div>
    );
  }

  function onSetMark(roundIdx: number, qIdx: number, value: boolean | null) {
    setMarks((cur) => toggleMark(cur, roundIdx, qIdx, value));
  }

  if (!isCaptain) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-slate-900">
            Marking{" "}
            <span className="text-slate-500 font-medium">
              · Part {partIndex}
            </span>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            Member
          </span>
        </div>
        <MarkingWaitingCard />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-900">
              Marking
              <span className="text-slate-500 font-medium">
                {" "}
                · Part {partIndex}
              </span>
            </div>

            {phase === "COUNTDOWN_TO_SUBMIT_MARKS" ? (
              <span className="rounded-full border border-yellow-300/70 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">
                Submitting soon…
              </span>
            ) : null}

            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-900">
              Captain
            </span>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            You’ll mark another team’s answers anonymously. Your identity is
            hidden to reduce bias.
          </div>
        </div>

        <button
          onClick={() => saveDraft(marks)}
          disabled={saving || !editable}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
            saving
              ? "bg-slate-200 text-slate-700"
              : editable
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {saving ? "Saving…" : editable ? "Save" : "Locked"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {answersToMark ? (
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            Answer sheet to mark
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Anonymous — you won’t see which team this belongs to.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
          Waiting for marking sheet…
        </div>
      )}

      <MarkingSheet
        part={part}
        answers={answersToMark ?? { v: 1, rounds: [] }}
        marks={marks}
        onSetMark={onSetMark}
        disabled={!editable}
      />
    </div>
  );
}
