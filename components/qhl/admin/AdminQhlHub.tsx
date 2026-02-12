"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { QuizListCard } from "@/components/qhl/admin/QuizListCard";

export type QhlQuizRow = {
  id: string;
  name: string;
  parts_count: number;
  starts_at: string | null;
  created_at: string;
  archived_at: string | null;
};

export function AdminQhlHub() {
  const [quizzes, setQuizzes] = useState<QhlQuizRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("qhl_quizzes")
      .select("id,name,parts_count,starts_at,created_at,archived_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setQuizzes([]);
      setLoading(false);
      return;
    }

    setQuizzes((data ?? []) as QhlQuizRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="qhl-shell space-y-5">
      <div className="qhl-hero">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="qhl-kicker">Admin Console</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              QHL Command Hub
            </h1>
            <div className="mt-2 max-w-2xl text-sm text-violet-100/85 md:text-base">
              Create quiz formats, manage rounds, and launch live sessions.
            </div>
          </div>

          <Link
            href="/admin/qhl/quizzes/new"
            className="qhl-btn-primary self-start"
          >
            Create Quiz
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <QuizListCard quizzes={quizzes} loading={loading} onRefresh={load} />
      </div>
    </div>
  );
}
