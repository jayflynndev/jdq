"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

export function CreateQuizCard({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [partsCount, setPartsCount] = useState(1);
  const [startsAt, setStartsAt] = useState<string>(""); // optional datetime-local
  const [saving, setSaving] = useState(false);

  const partsCountSafe = useMemo(() => {
    if (!Number.isFinite(partsCount)) return 1;
    return Math.max(1, Math.floor(partsCount));
  }, [partsCount]);

  async function createQuiz() {
    setSaving(true);

    const payload: {
      name: string;
      parts_count: number;
      starts_at?: string | null;
    } = {
      name: name.trim() || "Untitled Quiz",
      parts_count: partsCountSafe,
    };

    // startsAt is "YYYY-MM-DDTHH:mm" local; simplest: store as text->timestamptz by letting Postgres parse
    if (startsAt.trim()) payload.starts_at = startsAt;

    const { data, error } = await supabase
      .from("qhl_quizzes")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    // Ensure runtime row exists when quiz is created (nice + deterministic)
    await supabase.rpc("qhl_get_or_create_runtime", { p_quiz_id: data.id });

    onCreated();
    setName("");
    setPartsCount(1);
    setStartsAt("");

    // Jump straight into control room
    router.push(`/admin/qhl/quizzes/${data.id}`);

    setSaving(false);
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="font-medium">Create quiz</div>

      <div className="space-y-2">
        <label className="block text-sm">
          <div className="opacity-70">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Saturday Night Quiz"
          />
        </label>

        <label className="block text-sm">
          <div className="opacity-70">Parts count</div>
          <input
            type="number"
            min={1}
            value={partsCount}
            onChange={(e) => setPartsCount(Number(e.target.value))}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <div className="opacity-70">Starts at (optional)</div>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <button
        onClick={createQuiz}
        disabled={saving}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-40"
      >
        {saving ? "Creating…" : "Create & open control room"}
      </button>
    </div>
  );
}
