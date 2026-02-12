"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

type VenueRow = {
  id: string;
  name: string;
  is_private: boolean;
  team_cap: number;
};

type QuizVenueRow = {
  id: string;
  quiz_id: string;
  venue_id: string;
  team_cap: number;
  access_code: string | null;
  created_at: string;
  venue?: VenueRow;
};

export function QuizVenuesCard({ quizId }: { quizId: string }) {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [quizVenues, setQuizVenues] = useState<QuizVenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [teamCapOverride, setTeamCapOverride] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: vData, error: vErr }, { data: qvData, error: qvErr }] =
      await Promise.all([
        supabase
          .from("qhl_venues")
          .select("id,name,is_private,team_cap")
          .order("created_at", { ascending: false }),
        supabase
          .from("qhl_quiz_venues")
          .select("id,quiz_id,venue_id,team_cap,access_code,created_at")
          .eq("quiz_id", quizId)
          .order("created_at", { ascending: false }),
      ]);

    if (vErr) console.error(vErr);
    if (qvErr) console.error(qvErr);

    setVenues((vData ?? []) as VenueRow[]);
    setQuizVenues((qvData ?? []) as QuizVenueRow[]);
    setLoading(false);
  }, [quizId]);

  useEffect(() => {
    load();
  }, [load]);

  const venueById = useMemo(() => {
    const map = new Map<string, VenueRow>();
    venues.forEach((v) => map.set(v.id, v));
    return map;
  }, [venues]);

  const quizVenuesWithVenue = useMemo(() => {
    return quizVenues.map((qv) => ({
      ...qv,
      venue: venueById.get(qv.venue_id),
    }));
  }, [quizVenues, venueById]);

  async function addVenueToQuiz() {
    if (!selectedVenueId) return;

    const override =
      teamCapOverride.trim() === "" ? null : Number(teamCapOverride);

    const { error } = await supabase.rpc("qhl_admin_add_venue_to_quiz", {
      p_quiz_id: quizId,
      p_venue_id: selectedVenueId,
      p_team_cap_override:
        override && Number.isFinite(override) ? override : null,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setSelectedVenueId("");
    setTeamCapOverride("");
    await load();
  }

  async function regenerateCode(quizVenueId: string) {
    const { error } = await supabase.rpc(
      "qhl_admin_regenerate_quiz_venue_code",
      {
        p_quiz_venue_id: quizVenueId,
      },
    );
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    await load();
  }

  async function removeVenue(quizVenueId: string) {
    const { error } = await supabase
      .from("qhl_quiz_venues")
      .delete()
      .eq("id", quizVenueId);
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="qhl-card space-y-3">
      <div className="text-lg font-bold text-white">Venues in this quiz</div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <label className="block flex-1 text-sm">
          <div className="qhl-label">Add venue</div>
          <select
            className="qhl-input"
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
          >
            <option value="">Select a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.is_private ? "(Private)" : "(Public)"}
              </option>
            ))}
          </select>
        </label>

        <label className="block w-full text-sm md:w-56">
          <div className="qhl-label">Team cap override</div>
          <input
            className="qhl-label"
            value={teamCapOverride}
            onChange={(e) => setTeamCapOverride(e.target.value)}
            placeholder="e.g. 10"
          />
        </label>

        <button
          onClick={addVenueToQuiz}
          disabled={!selectedVenueId}
          className="qhl-btn-primary"
        >
          Add
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-violet-100/80">Loading…</div>
      ) : quizVenuesWithVenue.length === 0 ? (
        <div className="text-sm text-violet-100/80">
          No venues added to this quiz yet.
        </div>
      ) : (
        <div className="space-y-2">
          {quizVenuesWithVenue.map((qv) => (
            <div
              key={qv.id}
              className="rounded-xl border border-violet-200/30 bg-violet-950/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-violet-50">
                    {qv.venue?.name ?? qv.venue_id}
                  </div>
                  <div className="text-xs text-violet-100/75">
                    Team cap: {qv.team_cap} •{" "}
                    {qv.venue?.is_private ? "Private" : "Public"}
                  </div>
                  {qv.venue?.is_private && (
                    <div className="mt-1 text-sm text-violet-100/85">
                      Access code:{" "}
                      <span className="font-mono font-semibold text-yellow-100">
                        {qv.access_code ?? "—"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {qv.venue?.is_private && (
                    <button
                      onClick={() => regenerateCode(qv.id)}
                      className="qhl-btn-secondary px-3 py-2 text-sm"
                    >
                      Regenerate code
                    </button>
                  )}
                  <button
                    onClick={() => removeVenue(qv.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/25"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
