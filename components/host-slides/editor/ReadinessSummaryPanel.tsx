import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import type { HostDeck } from "@/src/host-slides/types";

export function ReadinessSummaryPanel({ deck }: { deck: HostDeck }) {
  const readiness = evaluateHostDeckReadiness(deck);

  return (
    <section className="qhl-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Readiness Summary</h2>
          <p className="mt-1 text-sm text-violet-100/70">
            {readiness.passedChecks} of {readiness.totalChecks} factual checks
            passed. This does not block editing, presenting, or publishing.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${
            readiness.isReady
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {readiness.isReady ? "Ready" : "Needs Attention"} {readiness.score}%
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-violet-950/35 p-3">
          <p className="text-xs font-bold uppercase text-violet-200/70">
            Readiness
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {readiness.score}%
          </p>
        </div>
        <div className="rounded-lg bg-red-950/30 p-3">
          <p className="text-xs font-bold uppercase text-red-200/70">Errors</p>
          <p className="mt-1 text-2xl font-extrabold text-red-100">
            {readiness.errors.length}
          </p>
        </div>
        <div className="rounded-lg bg-amber-950/30 p-3">
          <p className="text-xs font-bold uppercase text-amber-200/70">
            Warnings
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-100">
            {readiness.warnings.length}
          </p>
        </div>
      </div>

      {readiness.errors.length > 0 ? (
        <div className="rounded-xl border border-red-300/30 bg-red-950/25 p-4">
          <h3 className="font-bold text-red-100">Errors</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-100/85">
            {readiness.errors.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-950/25 p-4">
          <h3 className="font-bold text-amber-100">Warnings</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/85">
            {readiness.warnings.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {readiness.errors.length === 0 && readiness.warnings.length === 0 ? (
        <p className="text-sm font-semibold text-green-200">
          All Phase 1 factual readiness checks pass.
        </p>
      ) : null}
    </section>
  );
}
