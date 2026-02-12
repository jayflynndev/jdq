"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/supabaseClient";

export function CreateVenueCard({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [teamCap, setTeamCap] = useState(10);
  const [saving, setSaving] = useState(false);

  const teamCapSafe = useMemo(
    () => Math.max(1, Math.floor(teamCap || 10)),
    [teamCap],
  );

  async function createVenue() {
    setSaving(true);

    const { error } = await supabase.from("qhl_venues").insert({
      name: name.trim() || "Untitled Venue",
      is_private: isPrivate,
      team_cap: teamCapSafe,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setIsPrivate(false);
    setTeamCap(10);
    onCreated();
    setSaving(false);
  }

  return (
    <div className="qhl-card space-y-3">
      <div className="text-lg font-bold text-white">Create venue</div>

      <label className="block text-sm">
        <div className="qhl-label">Name</div>
        <input
          className="qhl-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Patreon Arms"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-violet-100/90">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        Private venue (requires access code per quiz)
      </label>

      <label className="block text-sm">
        <div className="qhl-label">Team cap (default)</div>
        <input
          type="number"
          min={1}
          className="qhl-input"
          value={teamCap}
          onChange={(e) => setTeamCap(Number(e.target.value))}
        />
      </label>

      <button
        onClick={createVenue}
        disabled={saving}
        className="qhl-btn-primary"
      >
        {saving ? "Creating…" : "Create venue"}
      </button>
    </div>
  );
}
