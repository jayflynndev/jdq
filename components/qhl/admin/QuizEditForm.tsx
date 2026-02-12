"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";
import type { QuizSetup } from "@/src/qhl/quizTypes";
import { SetupBuilder } from "@/components/qhl/admin/SetupBuilder";
import { normalizeYouTubeInput } from "@/src/qhl/youtube";

function toLocalInputValue(iso: string) {
  // For <input type="datetime-local"> we need "YYYY-MM-DDTHH:mm"
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toIsoFromLocal(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function QuizEditForm({ quizId }: { quizId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [youtubeInput, setYouTubeInput] = useState("");
  const [description, setDescription] = useState("");
  const [setup, setSetup] = useState<QuizSetup>([
    { title: "Part 1", rounds: [{ title: "Round 1", questions: 10 }] },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("qhl_quizzes")
        .select("name,starts_at,youtube_url,description,setup,parts_count")
        .eq("id", quizId)
        .single();

      if (cancelled) return;

      if (error) {
        console.error(error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setStartsAtLocal(toLocalInputValue(data.starts_at));
      setYouTubeInput(data.youtube_url ?? "");
      setDescription(data.description ?? "");
      setSetup(((data.setup ?? []) as QuizSetup) || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  async function save() {
    setError(null);

    const starts_at = toIsoFromLocal(startsAtLocal);
    if (!name.trim()) return setError("Title required.");
    if (!starts_at) return setError("Valid start date/time required.");
    if (!setup.length) return setError("Setup must have at least 1 part.");

    const youtube_url = normalizeYouTubeInput(youtubeInput);

    setSaving(true);

    const { error } = await supabase.rpc("qhl_admin_update_quiz", {
      p_quiz_id: quizId,
      p_name: name.trim(),
      p_starts_at: starts_at,
      p_youtube_url: youtube_url ?? "",
      p_description: description.trim() || "",
      p_setup: setup,
      p_parts_count: setup.length,
    });

    if (error) {
      console.error(error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/admin/qhl");
    router.refresh();
  }

  if (loading) {
    return <div className="p-4 text-sm opacity-70">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div>
        <div className="text-xl font-semibold">Edit quiz</div>
        <div className="text-sm opacity-70">Quiz ID: {quizId}</div>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <label className="block text-sm">
          <div className="opacity-70">Title</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <div className="opacity-70">Date & time</div>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded border px-3 py-2"
            value={startsAtLocal}
            onChange={(e) => setStartsAtLocal(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <div className="opacity-70">YouTube stream (URL or ID)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={youtubeInput}
            onChange={(e) => setYouTubeInput(e.target.value)}
          />
          <div className="mt-1 text-xs opacity-70">
            Stored as: {normalizeYouTubeInput(youtubeInput) ?? "—"}
          </div>
        </label>

        <label className="block text-sm">
          <div className="opacity-70">Description</div>
          <textarea
            className="mt-1 w-full rounded border px-3 py-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <SetupBuilder setup={setup} onChange={setSetup} />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
