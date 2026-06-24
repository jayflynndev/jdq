"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandButton } from "@/components/ui/BrandButton";
import { Modal } from "@/components/ui/Modal";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { getPresenterGateDecision } from "@/src/host-slides/presenterGate";
import type { HostDeck } from "@/src/host-slides/types";

export function PresenterGateButton({
  deck,
  size = "md",
}: {
  deck: HostDeck;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);
  const readiness = evaluateHostDeckReadiness(deck);
  const presenterUrl = `/host-slides/${deck.id}/present`;

  function requestPresentation() {
    if (getPresenterGateDecision(readiness) === "present") {
      router.push(presenterUrl);
      return;
    }
    setShowReview(true);
  }

  function presentAnyway() {
    setShowReview(false);
    router.push(presenterUrl);
  }

  return (
    <>
      <BrandButton
        type="button"
        variant="accent"
        size={size}
        onClick={requestPresentation}
      >
        Present
      </BrandButton>

      <Modal
        open={showReview}
        onClose={() => setShowReview(false)}
        title="Presenter Readiness Check"
        size="lg"
      >
        <div className="space-y-5 text-textc">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-violet-50 p-3">
              <p className="text-xs font-bold uppercase text-violet-700">
                Readiness
              </p>
              <p className="mt-1 text-2xl font-extrabold text-violet-950">
                {readiness.score}%
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-xs font-bold uppercase text-red-700">Errors</p>
              <p className="mt-1 text-2xl font-extrabold text-red-900">
                {readiness.errors.length}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-bold uppercase text-amber-700">
                Warnings
              </p>
              <p className="mt-1 text-2xl font-extrabold text-amber-900">
                {readiness.warnings.length}
              </p>
            </div>
          </div>

          <p className="text-sm text-textc-muted">
            {readiness.passedChecks} of {readiness.totalChecks} factual checks
            passed.
          </p>

          <section>
            <h4 className="font-bold text-red-800">Errors</h4>
            {readiness.errors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                {readiness.errors.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-textc-muted">No errors.</p>
            )}
          </section>

          <section>
            <h4 className="font-bold text-amber-800">Warnings</h4>
            {readiness.warnings.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                {readiness.warnings.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>{issue.message}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-textc-muted">No warnings.</p>
            )}
          </section>

          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            These checks are advisory. You can return to the editor or present
            this deck anyway.
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <BrandButton
              href={`/admin/host-slides/${deck.id}`}
              variant="outline"
            >
              Return to Editor
            </BrandButton>
            <BrandButton type="button" variant="accent" onClick={presentAnyway}>
              Present Anyway
            </BrandButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
