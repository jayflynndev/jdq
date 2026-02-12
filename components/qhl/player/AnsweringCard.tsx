"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";
import type { TeamRow } from "@/src/qhl/teamTypes";
import type { QuizSetup } from "@/src/qhl/quizTypes";
import { AnswerSheet } from "@/components/qhl/player/AnswerSheet";
import { useTeamSuggestions } from "@/src/qhl/useTeamSuggestions";
import { SuggestionsCard } from "@/components/qhl/player/SuggestionsCard";

import {
  coerceAnswersToPartShape,
  setAnswer,
  type AnswersV1,
} from "@/src/qhl/answersV1";

export function AnsweringCard({
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

  const showSheet = phase === "ANSWERING" || phase === "COUNTDOWN_TO_LOCK";
  const isEditable = showSheet;

  const part = useMemo(() => {
    if (!setup || !Array.isArray(setup) || setup.length === 0) return null;
    const idx = Math.max(1, Math.min(partIndex, setup.length)) - 1;
    return setup[idx] ?? null;
  }, [setup, partIndex]);

  const [answers, setAnswersState] = useState<AnswersV1>({ v: 1, rounds: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestionsEnabled =
    !!myTeam && (phase === "ANSWERING" || phase === "COUNTDOWN_TO_LOCK");

  const { map: suggestionsMap } = useTeamSuggestions({
    quizId,
    teamId: myTeam?.id ?? null,
    partIndex,
    enabled: suggestionsEnabled,
  });

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) =>
        setUserId(data.user?.id ?? null),
      );
  }, []);

  const isCaptain = !!userId && !!myTeam && myTeam.captain_user_id === userId;

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      setError(null);

      if (!myTeam || !part || !isCaptain) return;

      const { data, error: rpcErr } = (await supabase.rpc(
        "qhl_player_get_my_draft_answers",
        {
          p_quiz_id: quizId,
          p_part_index: partIndex,
          p_team_id: myTeam.id,
        },
      )) as { data: AnswersV1 | null; error: Error | null };

      if (cancelled) return;

      if (rpcErr) {
        console.error(rpcErr);
        setAnswersState(coerceAnswersToPartShape(null, part));
        return;
      }

      setAnswersState(coerceAnswersToPartShape(data ?? null, part));
    }

    loadDraft();
    return () => {
      cancelled = true;
    };
  }, [quizId, myTeam, myTeam?.id, partIndex, part, isCaptain]);

  async function saveDraft(next: AnswersV1) {
    if (!myTeam || !isCaptain) return;
    setSaving(true);

    const { error: rpcErr } = await supabase.rpc(
      "qhl_player_save_draft_answers",
      {
        p_quiz_id: quizId,
        p_team_id: myTeam.id,
        p_part_index: partIndex,
        p_answers: next,
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
    if (!isEditable) return;
    if (!myTeam || !isCaptain) return;

    const id = setTimeout(() => {
      saveDraft(answers);
    }, 600);

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, isEditable, myTeam?.id]);

  if (!runtime || !showSheet) return null;

  if (!myTeam) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-slate-900">Answering</div>
        <div className="mt-1 text-sm text-slate-600">
          Join a team to submit answers.
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-base font-semibold text-slate-900">
          Answering (Part {partIndex})
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Quiz setup not found yet.
        </div>
      </div>
    );
  }

  function onChange(roundIdx: number, qIdx: number, value: string) {
    setAnswersState((cur) => setAnswer(cur, roundIdx, qIdx, value));
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-900">
              Answering
              <span className="text-slate-500 font-medium">
                {" "}
                · Part {partIndex}
              </span>
            </div>

            {phase === "COUNTDOWN_TO_LOCK" ? (
              <span className="rounded-full border border-yellow-300/70 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">
                Locking soon…
              </span>
            ) : null}

            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium",
                isCaptain
                  ? "border-violet-200 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-slate-50 text-slate-700",
              ].join(" ")}
            >
              {isCaptain ? "Captain" : "Member"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span>
              Team:{" "}
              <span className="font-medium text-slate-900">{myTeam.name}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Join code:{" "}
              <span className="font-mono rounded-md border bg-slate-50 px-2 py-1 text-slate-900">
                {myTeam.join_code}
              </span>
            </span>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => saveDraft(answers)}
          disabled={saving || !isEditable || !isCaptain}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
            saving
              ? "bg-slate-200 text-slate-700"
              : !isEditable
                ? "bg-slate-100 text-slate-500"
                : !isCaptain
                  ? "bg-slate-100 text-slate-500"
                  : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")}
          title={
            !isCaptain
              ? "Only the captain can save the team answers"
              : undefined
          }
        >
          {saving ? "Saving…" : isEditable ? "Save" : "Locked"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {isCaptain ? (
        <AnswerSheet
          part={part}
          answers={answers}
          onChange={onChange}
          disabled={!isEditable}
          suggestionsMap={suggestionsMap}
        />
      ) : (
        <SuggestionsCard
          quizId={quizId}
          teamId={myTeam.id}
          partIndex={partIndex}
          setup={setup ?? []}
          enabled={showSheet}
        />
      )}
    </div>
  );
}
