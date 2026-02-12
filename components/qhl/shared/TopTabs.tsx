"use client";

export function TopTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 rounded-2xl border border-violet-200/20 bg-violet-950/25 p-2">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={
              isActive
                ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
                : "rounded-xl px-4 py-2 text-sm font-semibold text-violet-100/80 hover:bg-violet-900/40"
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
