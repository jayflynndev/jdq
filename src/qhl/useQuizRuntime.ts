"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "./types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useQuizRuntime(quizId: string) {
  const [runtime, setRuntime] = useState<QuizRuntime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function run() {
      setLoading(true);

      // 1) Ensure runtime exists (reload/join-late safe)
      const { data, error } = await supabase.rpc("qhl_get_or_create_runtime", {
        p_quiz_id: quizId,
      });

      if (cancelled) return;

      if (error) {
        console.error(error);
        setRuntime(null);
        setLoading(false);
        return;
      }

      setRuntime(data ?? null);
      setLoading(false);

      // 2) Subscribe to realtime updates
      channel = supabase
        .channel(`qhl_runtime_${quizId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "qhl_quiz_runtime",
            filter: `quiz_id=eq.${quizId}`,
          },
          (payload: RealtimePostgresChangesPayload<QuizRuntime>) => {
            setRuntime((payload.new ?? null) as QuizRuntime | null);
          },
        )

        .subscribe();
    }

    run();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [quizId]);

  return { runtime, loading };
}
