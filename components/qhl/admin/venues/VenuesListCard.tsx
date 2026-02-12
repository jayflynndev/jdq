"use client";

import type { VenueRow } from "./AdminVenuesPage";

export function VenuesListCard({
  venues,
  loading,
  onRefresh,
}: {
  venues: VenueRow[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="qhl-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-white">Venues</div>
        <button
          onClick={onRefresh}
          className="qhl-btn-secondary px-3 py-2 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-violet-100/80">Loading…</div>
      ) : venues.length === 0 ? (
        <div className="text-sm text-violet-100/80">No venues yet.</div>
      ) : (
        <div className="space-y-2">
          {venues.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-violet-200/30 bg-violet-950/30 p-3"
            >
              <div className="font-semibold text-violet-50">{v.name}</div>
              <div className="text-xs text-violet-100/75">
                {v.is_private ? "Private" : "Public"} • Team cap: {v.team_cap}
              </div>
              <div className="text-xs text-violet-100/60">ID: {v.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
