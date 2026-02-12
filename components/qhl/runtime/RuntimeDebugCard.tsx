"use client";

import type { QuizRuntime } from "@/src/qhl/types";

export function RuntimeDebugCard({ runtime }: { runtime: QuizRuntime | null }) {
  if (!runtime) {
    return (
      <div className="rounded-xl border p-4">
        <div className="text-sm opacity-70">Runtime</div>
        <div className="mt-2">No runtime loaded.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm opacity-70">Runtime</div>
      <div className="mt-2 grid gap-1 text-sm">
        <div>
          <span className="opacity-70">Phase:</span> {runtime.phase}
        </div>
        <div>
          <span className="opacity-70">Part:</span> {runtime.part_index}
        </div>
        <div>
          <span className="opacity-70">Countdown:</span>{" "}
          {runtime.countdown_ends_at ?? "—"}
        </div>
        <div>
          <span className="opacity-70">Updated:</span> {runtime.updated_at}
        </div>
      </div>
    </div>
  );
}
