// hooks/useNotifCounts.ts
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";

export type NotifCounts = {
  friend_requests: number;
  leaderboard_invites: number;
  admin_messages: number;
  total: number;
};

export function useNotifCounts(enabled: boolean) {
  const [counts, setCounts] = useState<NotifCounts>({
    friend_requests: 0,
    leaderboard_invites: 0,
    admin_messages: 0,
    total: 0,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const fetchCounts = async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;

      const { data, error } = await supabase.rpc("get_notification_counts", {
        p_user_id: uid,
      });
      console.log("notif RPC", { data, error, uid });
      if (cancelled || error || !data) return;

      const row = Array.isArray(data) ? data[0] : data;
      const fr = row?.friend_requests ?? 0;
      const lb = row?.leaderboard_invites ?? 0;
      const am = row?.admin_messages ?? 0;
      setCounts({
        friend_requests: fr,
        leaderboard_invites: lb,
        admin_messages: am,
        total: fr + lb + am,
      });
    };

    fetchCounts();

    // realtime refresh
    const ch = supabase
      .channel("profile-notifs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard_members" },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        fetchCounts
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [enabled]);

  return counts;
}
