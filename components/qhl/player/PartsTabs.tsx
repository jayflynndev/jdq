"use client";

export function PartsTabs({
  partsCount,
  selectedPartIndex,
  onSelect,
}: {
  partsCount: number;
  selectedPartIndex: number;
  onSelect: (partIndex: number) => void;
}) {
  const safeCount = Math.max(1, Math.floor(partsCount || 1));

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: safeCount }, (_, i) => i + 1).map((p) => {
        const active = p === selectedPartIndex;
        return (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium transition border",
              active
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            Part {p}
          </button>
        );
      })}
    </div>
  );
}
