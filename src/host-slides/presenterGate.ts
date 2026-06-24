import type { HostReadinessResult } from "@/src/host-slides/readiness";

export type PresenterGateDecision = "present" | "review";

export function getPresenterGateDecision(
  readiness: HostReadinessResult,
): PresenterGateDecision {
  return readiness.score === 100 ? "present" : "review";
}
