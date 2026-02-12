"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { TeamRow } from "@/src/qhl/teamTypes";

export function useMyTeam(quizId: string) {
  const [myTeam, setMyTeam] = useState<TeamRow | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setMyTeam(null);
      setLoading(false);
      return;
    }

    const { data: memberRows, error: mErr } = await supabase
      .from("qhl_team_members")
      .select("team_id")
      .eq("user_id", uid);

    if (mErr || !memberRows?.length) {
      setMyTeam(null);
      setLoading(false);
      return;
    }

    const teamIds = memberRows.map((r: { team_id: string }) => r.team_id);

    const { data: teams, error: tErr } = await supabase
      .from("qhl_teams")
      .select("*")
      .eq("quiz_id", quizId)
      .in("id", teamIds)
      .limit(1);

    if (tErr) {
      console.error(tErr);
      setMyTeam(null);
      setLoading(false);
      return;
    }

    setMyTeam((teams?.[0] as TeamRow) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  return { myTeam, loading, refresh: load };
}
