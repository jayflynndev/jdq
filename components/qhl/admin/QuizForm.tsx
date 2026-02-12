"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";
import type { QuizSetup } from "@/src/qhl/quizTypes";
import { normalizeYouTubeInput } from "@/src/qhl/youtube";
import { SetupBuilder } from "@/components/qhl/admin/SetupBuilder";

function toIsoFromLocal(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function QuizForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [youtubeInput, setYouTubeInput] = useState("");
  const [description, setDescription] = useState("");

  const [setup, setSetup] = useState<QuizSetup>([
    { title: "Part 1", rounds: [{ title: "Round 1", questions: 10 }] },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partsCount = setup.length;

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    const startsIso = toIsoFromLocal(startsAtLocal);
    if (!startsIso) return false;
    if (partsCount < 1) return false;
    if (
      setup.some(
        (p) =>
          !p.rounds?.length ||
          p.rounds.some((r) => !r.questions || r.questions < 1),
      )
    ) {
      return false;
    }
    return true;
  }, [name, startsAtLocal, partsCount, setup]);

  async function save() {
    setError(null);
    if (!canSave) {
      setError("Please complete title, start date/time, and setup.");
      return;
    }

    const starts_at = toIsoFromLocal(startsAtLocal);
    if (!starts_at) {
      setError("Invalid start date/time.");
      return;
    }

    const youtube_url = normalizeYouTubeInput(youtubeInput);

    setSaving(true);

    const { error: insertErr } = await supabase
      .from("qhl_quizzes")
      .insert({
        name: name.trim(),
        starts_at,
        youtube_url,
        description: description.trim() || null,
        setup,
        parts_count: partsCount,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error(insertErr);
      setError(insertErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/admin/qhl");
    router.refresh();
  }

  return (
    <div className="qhl-shell max-w-4xl space-y-5">
      <div className="qhl-hero">
        <div className="qhl-kicker">Admin Builder</div>
        <div className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Create Quiz
        </div>
        <div className="mt-2 text-sm text-violet-100/85 md:text-base">
          Define quiz structure here. Question text remains on your YouTube
          stream.
        </div>
      </div>

      <div className="qhl-card space-y-4">
        <label className="block text-sm">
          <div className="qhl-label">Title</div>
          <input
            className="qhl-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Quiz Hub Live - Saturday Night"
          />
        </label>

        <label className="block text-sm">
          <div className="qhl-label">Date and time</div>
          <input
            type="datetime-local"
            className="qhl-input"
            value={startsAtLocal}
            onChange={(e) => setStartsAtLocal(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <div className="qhl-label">YouTube live stream (URL or video ID)</div>
          <input
            className="qhl-input"
            value={youtubeInput}
            onChange={(e) => setYouTubeInput(e.target.value)}
            placeholder="Paste URL or ID"
          />
          <div className="mt-1 text-xs text-violet-100/70">
            Stored as: {normalizeYouTubeInput(youtubeInput) ?? "-"}
          </div>
        </label>

        <label className="block text-sm">
          <div className="qhl-label">Description (optional)</div>
          <textarea
            className="qhl-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <SetupBuilder setup={setup} onChange={setSetup} />

      {error ? (
        <div className="rounded-xl border border-rose-300/40 bg-rose-400/15 px-4 py-3 text-sm font-medium text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        onClick={save}
        disabled={saving || !canSave}
        className="qhl-btn-primary"
      >
        {saving ? "Saving..." : "Create Quiz"}
      </button>
    </div>
  );
}
