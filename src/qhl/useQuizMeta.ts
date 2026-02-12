"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizMeta, QuizSetup } from "@/src/qhl/quizTypes";

export function useQuizMeta(quizId: string) {
  const [meta, setMeta] = useState<QuizMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("qhl_quizzes")
        .select("parts_count, setup, youtube_url")
        .eq("id", quizId)
        .single();

      if (cancelled) return;

      if (error) {
        console.error(error);
        setMeta(null);
        setLoading(false);
        return;
      }

      setMeta({
        parts_count: Math.max(1, Math.floor(data.parts_count ?? 1)),
        setup: (data.setup ?? []) as QuizSetup,
        youtube_url: data.youtube_url ?? null,
      });

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  return { meta, loading };
}
