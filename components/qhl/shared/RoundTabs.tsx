"use client";

export function RoundTabs({
  roundsCount,
  selectedRoundIndex,
  onSelect,
  labels,
}: {
  roundsCount: number;
  selectedRoundIndex: number; // 0-based
  onSelect: (roundIndex: number) => void;
  labels?: (string | undefined)[];
}) {
  const safeCount = Math.max(1, Math.floor(roundsCount || 1));

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: safeCount }, (_, i) => i).map((idx) => {
        const active = idx === selectedRoundIndex;
        const label = labels?.[idx]?.trim() || `Round ${idx + 1}`;

        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition border",
              active
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
