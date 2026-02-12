"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type {
  TeamSuggestionRow,
  SuggestionsMap,
} from "@/src/qhl/suggestionsTypes";

function keyOf(r: number, q: number) {
  return `${r}:${q}`;
}

export function useTeamSuggestions({
  quizId,
  teamId,
  partIndex,
  enabled,
}: {
  quizId: string;
  teamId: string | null;
  partIndex: number;
  enabled: boolean;
}) {
  const [rows, setRows] = useState<TeamSuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!teamId) return;
    setLoading(true);

    const { data, error } = await supabase.rpc(
      "qhl_player_list_team_suggestions",
      {
        p_quiz_id: quizId,
        p_team_id: teamId,
        p_part_index: partIndex,
      },
    );

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as TeamSuggestionRow[]);

    setLoading(false);
  }

  useEffect(() => {
    if (!enabled || !teamId) return;

    let cancelled = false;

    // Immediately clear so Part 2 doesn't show stale Part 1 suggestions
    setRows([]);

    // Force an immediate load for the new part
    (async () => {
      if (!cancelled) await load();
    })();

    const channel = supabase
      .channel(`qhl_suggestions_${quizId}_${teamId}_${partIndex}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "qhl_team_suggestions",
        },
        (payload: { new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const row =
            ((payload.new as Record<string, unknown> | null) ??
              (payload.old as Record<string, unknown> | null)) ||
            null;
          if (!row) return;

          const rowTeamId = row.team_id;
          const rowQuizId = row.quiz_id;

          const rawPart = (row as Record<string, unknown>).part_index;
          const rowPartIndex =
            typeof rawPart === "number"
              ? rawPart
              : typeof rawPart === "string"
                ? Number(rawPart)
                : NaN;

          const matches =
            typeof rowTeamId === "string" &&
            typeof rowQuizId === "string" &&
            Number.isFinite(rowPartIndex) &&
            rowTeamId === teamId &&
            rowQuizId === quizId &&
            rowPartIndex === partIndex;

          if (matches && !cancelled) load();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, quizId, teamId, partIndex]);

  const map: SuggestionsMap = useMemo(() => {
    const m: SuggestionsMap = {};
    for (const s of rows) {
      const k = keyOf(s.round_index, s.question_index);
      if (!m[k]) m[k] = [];
      m[k].push(s);
    }
    return m;
  }, [rows]);

  return { rows, map, loading, refresh: load };
}
