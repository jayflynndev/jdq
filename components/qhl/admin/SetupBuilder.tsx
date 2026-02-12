"use client";

import type { QuizSetup } from "@/src/qhl/quizTypes";

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function SetupBuilder({
  setup,
  onChange,
}: {
  setup: QuizSetup;
  onChange: (next: QuizSetup) => void;
}) {
  function setPartsCount(count: number) {
    const nextCount = clampInt(count, 1, 20);
    const next: QuizSetup = [...setup];

    while (next.length < nextCount) {
      next.push({
        title: `Part ${next.length + 1}`,
        rounds: [{ title: "Round 1", questions: 10 }],
      });
    }
    while (next.length > nextCount) {
      next.pop();
    }
    onChange(next);
  }

  function updatePartTitle(partIdx: number, title: string) {
    const next = setup.map((p, i) => (i === partIdx ? { ...p, title } : p));
    onChange(next);
  }

  function addRound(partIdx: number) {
    const next = setup.map((p, i) => {
      if (i !== partIdx) return p;
      const rounds = [
        ...p.rounds,
        { title: `Round ${p.rounds.length + 1}`, questions: 10 },
      ];
      return { ...p, rounds };
    });
    onChange(next);
  }

  function removeRound(partIdx: number, roundIdx: number) {
    const next = setup.map((p, i) => {
      if (i !== partIdx) return p;
      const rounds = p.rounds.filter((_, r) => r !== roundIdx);
      return {
        ...p,
        rounds: rounds.length ? rounds : [{ title: "Round 1", questions: 10 }],
      };
    });
    onChange(next);
  }

  function updateRound(
    partIdx: number,
    roundIdx: number,
    patch: { title?: string; questions?: number },
  ) {
    const next = setup.map((p, i) => {
      if (i !== partIdx) return p;
      const rounds = p.rounds.map((r, ri) => {
        if (ri !== roundIdx) return r;
        return {
          ...r,
          ...(patch.title !== undefined ? { title: patch.title } : null),
          ...(patch.questions !== undefined
            ? { questions: clampInt(patch.questions, 1, 50) }
            : null),
        };
      });
      return { ...p, rounds };
    });
    onChange(next);
  }

  return (
    <div className="qhl-card space-y-4">
      <div className="text-lg font-bold text-white">Quiz setup</div>

      <label className="block text-sm">
        <div className="qhl-label">Number of parts</div>
        <input
          type="number"
          min={1}
          max={20}
          className="qhl-input"
          value={setup.length}
          onChange={(e) => setPartsCount(Number(e.target.value))}
        />
      </label>

      <div className="space-y-4">
        {setup.map((part, partIdx) => (
          <div key={partIdx} className="rounded-2xl border border-violet-200/20 bg-violet-950/35 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold uppercase tracking-wide text-violet-100">Part {partIdx + 1}</div>
              <button className="qhl-btn-secondary" onClick={() => addRound(partIdx)}>
                Add round
              </button>
            </div>

            <label className="block text-sm">
              <div className="qhl-label">Part title (optional)</div>
              <input
                className="qhl-input"
                value={part.title ?? ""}
                onChange={(e) => updatePartTitle(partIdx, e.target.value)}
                placeholder={`Part ${partIdx + 1}`}
              />
            </label>

            <div className="space-y-3">
              {part.rounds.map((round, roundIdx) => (
                <div key={roundIdx} className="rounded-xl border border-violet-200/20 bg-violet-900/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-violet-100">Round {roundIdx + 1}</div>
                    <button
                      className="inline-flex items-center justify-center rounded-xl border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => removeRound(partIdx, roundIdx)}
                      disabled={part.rounds.length <= 1}
                      title={part.rounds.length <= 1 ? "At least 1 round required" : "Remove round"}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="block text-sm">
                      <div className="qhl-label">Round title (optional)</div>
                      <input
                        className="qhl-input"
                        value={round.title ?? ""}
                        onChange={(e) =>
                          updateRound(partIdx, roundIdx, {
                            title: e.target.value,
                          })
                        }
                        placeholder={`Round ${roundIdx + 1}`}
                      />
                    </label>

                    <label className="block text-sm">
                      <div className="qhl-label">Questions in round</div>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="qhl-input"
                        value={round.questions}
                        onChange={(e) =>
                          updateRound(partIdx, roundIdx, {
                            questions: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-violet-100/70">
        No question text is stored here. This setup only defines answer-sheet shape.
      </div>
    </div>
  );
}

