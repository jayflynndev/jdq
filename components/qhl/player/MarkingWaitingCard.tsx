"use client";

export function MarkingWaitingCard() {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4 space-y-2">
      <div className="text-base font-semibold text-slate-900">
        Marking in progress
      </div>
      <div className="text-sm text-slate-600">
        Your team captain is currently marking another team’s answers.
      </div>
      <div className="text-sm text-slate-600">
        You’ll see results once marking is complete.
      </div>
    </div>
  );
}
