"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { DeckActions } from "@/components/host-slides/DeckActions";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import type { HostDeck, HostDeckStatus } from "@/src/host-slides/types";

export function DeckList({
  decks,
  onDelete,
  onStatusChange,
  statusChangingDeckId,
  sectionId = "prepared-decks",
  title = "Prepared Decks",
  description = "Saved Host Slides decks.",
}: {
  decks: readonly HostDeck[];
  onDelete?: (deck: HostDeck) => void;
  onStatusChange?: (deck: HostDeck, status: HostDeckStatus) => void;
  statusChangingDeckId?: string | null;
  sectionId?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section id={sectionId} className="space-y-4 scroll-mt-20">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-violet-100/75">{description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {decks.map((deck) => {
          const readiness = evaluateHostDeckReadiness(deck);
          const missingImageCount = readiness.errors.filter(
            (issue) =>
              issue.code === "picture_image_missing" ||
              issue.code === "dingbat_image_missing",
          ).length;
          const tiebreakerSet = !readiness.warnings.some(
            (issue) => issue.code === "tiebreak_missing",
          );
          const questionCount = deck.rounds.reduce(
            (total, round) => total + round.questions.length,
            0,
          );

          return (
            <Card key={deck.id} hover={false}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                      {deck.quizType}
                    </p>
                    <h3 className="text-lg font-bold text-textc">
                      {deck.title}
                    </h3>
                  </div>
                  <Badge variant={deck.status === "ready" ? "gold" : "neutral"}>
                    {deck.status === "ready" ? "Ready" : "Draft"}
                  </Badge>
                </div>

                <p className="text-sm text-textc-muted">
                  {deck.rounds.length} rounds · {questionCount} questions
                </p>

                <dl className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                  <div>
                    <dt className="font-semibold">Readiness</dt>
                    <dd>{readiness.score}%</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Errors</dt>
                    <dd>{readiness.errors.length}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Warnings</dt>
                    <dd>{readiness.warnings.length}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Tiebreak</dt>
                    <dd>{tiebreakerSet ? "Set" : "Not set"}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      readiness.isReady
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {readiness.isReady ? "Ready" : "Needs Attention"}{" "}
                    {readiness.score}%
                  </span>
                  {missingImageCount > 0 ? (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                      Missing Images
                    </span>
                  ) : null}
                  {!tiebreakerSet ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                      Missing Tiebreak
                    </span>
                  ) : null}
                </div>

                {deck.status === "ready" ? (
                  <p className="text-xs font-medium text-green-800">
                    I have approved this deck
                  </p>
                ) : null}

                <DeckActions deck={deck} />
                {onStatusChange ? (
                  <button
                    type="button"
                    onClick={() =>
                      onStatusChange(
                        deck,
                        deck.status === "ready" ? "draft" : "ready",
                      )
                    }
                    disabled={statusChangingDeckId === deck.id}
                    className="rounded-lg border border-violet-300 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
                  >
                    {statusChangingDeckId === deck.id
                      ? "Updating..."
                      : deck.status === "ready"
                        ? "Move Back To Draft"
                        : "Mark Ready"}
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(deck)}
                    className="text-sm font-semibold text-red-700 hover:underline"
                  >
                    Delete Deck
                  </button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
