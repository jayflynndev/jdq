"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BrandButton } from "@/components/ui/BrandButton";
import {
  createQuizRecapReviewDraft,
  type QuizRecapPart,
} from "@/src/host-slides/quizRecapAdapter";
import { resolveHostSlideImageUrl } from "@/src/host-slides/supabaseImages";
import {
  loadQuizRecapPublishingFields,
  publishHostDeckRecap,
} from "@/src/host-slides/supabaseQuizRecapPublishing";
import type { QuizRecapPublishResult } from "@/src/host-slides/quizRecapPublishing";
import type {
  HostQuizRecapAccessCodes,
  WeeklyHostDeck,
} from "@/src/host-slides/types";

type QuizRecapReviewPanelProps = {
  deck: WeeklyHostDeck;
  onPublished: (result: QuizRecapPublishResult) => void;
  onAccessCodesChange: (codes: HostQuizRecapAccessCodes) => void;
};

function PartPreview({
  heading,
  part,
}: {
  heading: string;
  part: QuizRecapPart;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-violet-200/20 bg-violet-950/30 p-4">
      <h3 className="text-lg font-bold text-yellow-300">{heading}</h3>

      <div className="space-y-4">
        {part.rounds.map((round) => (
          <div key={round.round}>
            <h4 className="font-bold text-white">Round {round.round}</h4>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-violet-100/85">
              {round.questions.map((question, index) => (
                <li key={`${round.round}-${index}`}>{question}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div>
        <h4 className="font-bold text-white">Recap images</h4>
        {part.images.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {part.images.map((image) => (
              <figure
                key={`${image.label}-${image.url}`}
                className="rounded-lg border border-violet-200/20 bg-white p-2"
              >
                <div className="relative aspect-video overflow-hidden rounded bg-slate-100">
                  <Image
                    src={image.url}
                    alt={image.label}
                    fill
                    sizes="(min-width: 640px) 280px, 90vw"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <figcaption className="mt-2 text-sm font-semibold text-slate-800">
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-violet-100/65">
            No persisted picture-question images in this part.
          </p>
        )}
      </div>
    </section>
  );
}

export function QuizRecapReviewPanel({
  deck,
  onPublished,
  onAccessCodesChange,
}: QuizRecapReviewPanelProps) {
  const [part1AccessCode, setPart1AccessCode] = useState(
    deck.quizRecapAccessCodes?.part1 ?? "",
  );
  const [part2AccessCode, setPart2AccessCode] = useState(
    deck.quizRecapAccessCodes?.part2 ?? "",
  );
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loadingFields, setLoadingFields] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const draft = useMemo(
    () => createQuizRecapReviewDraft(deck, resolveHostSlideImageUrl),
    [deck],
  );

  useEffect(() => {
    if (!deck.linkedQuizRecapId) return;
    let cancelled = false;
    setLoadingFields(true);
    setPublishError(null);

    void loadQuizRecapPublishingFields(deck.linkedQuizRecapId)
      .then((fields) => {
        if (cancelled) return;
        setPart1AccessCode(fields.part1AccessCode);
        setPart2AccessCode(fields.part2AccessCode);
        onAccessCodesChange({
          part1: fields.part1AccessCode,
          part2: fields.part2AccessCode,
        });
        setYoutubeUrl(fields.youtubeUrl);
        setThumbnailUrl(fields.thumbnailUrl);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPublishError(
          error instanceof Error
            ? `Could not load existing recap settings: ${error.message}`
            : "Could not load existing recap settings.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingFields(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deck.linkedQuizRecapId, onAccessCodesChange]);

  function updatePart1AccessCode(code: string) {
    setPart1AccessCode(code);
    onAccessCodesChange({ part1: code, part2: part2AccessCode });
  }

  function updatePart2AccessCode(code: string) {
    setPart2AccessCode(code);
    onAccessCodesChange({ part1: part1AccessCode, part2: code });
  }

  async function publish() {
    setPublishing(true);
    setPublishMessage(null);
    setPublishError(null);
    try {
      const result = await publishHostDeckRecap(deck, {
        part1AccessCode,
        part2AccessCode,
        youtubeUrl,
        thumbnailUrl,
      });
      onPublished(result);
      setPublishMessage(
        result.operation === "created"
          ? "Quiz Recap created and linked successfully."
          : "Linked Quiz Recap updated successfully.",
      );
    } catch (error: unknown) {
      setPublishError(
        error instanceof Error ? error.message : "Could not publish recap.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="qhl-card space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Quiz Recap Review</h2>
        <p className="mt-1 text-sm text-violet-100/70">
          Review the question-only recap output. Answers, tiebreaks and Saturday
          Dingbats are excluded.
        </p>
        {deck.quizRecapLastPublishedAt ? (
          <p className="mt-2 text-sm font-semibold text-green-200">
            Last published:{" "}
            {new Date(deck.quizRecapLastPublishedAt).toLocaleString("en-GB")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-violet-100/65">Not published yet.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="qhl-label">Part 1 access code</span>
          <input
            className="qhl-input"
            value={part1AccessCode}
            onChange={(event) => updatePart1AccessCode(event.target.value)}
          />
        </label>
        <label>
          <span className="qhl-label">Part 2 access code</span>
          <input
            className="qhl-input"
            value={part2AccessCode}
            onChange={(event) => updatePart2AccessCode(event.target.value)}
          />
        </label>
        <label>
          <span className="qhl-label">YouTube URL</span>
          <input
            type="url"
            className="qhl-input"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </label>
        <label>
          <span className="qhl-label">Thumbnail URL</span>
          <input
            type="url"
            className="qhl-input"
            value={thumbnailUrl}
            onChange={(event) => setThumbnailUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PartPreview heading="Part 1 · Rounds 1–3" part={draft.parts.part1} />
        <PartPreview heading="Part 2 · Rounds 4–5" part={draft.parts.part2} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BrandButton
          type="button"
          onClick={() => void publish()}
          loading={publishing}
          disabled={publishing || loadingFields}
        >
          Publish to Quiz Recap
        </BrandButton>
        {loadingFields ? (
          <p className="text-sm text-violet-100/65">
            Loading existing recap settings...
          </p>
        ) : null}
        {publishMessage ? (
          <p className="text-sm font-semibold text-green-200">
            {publishMessage}
          </p>
        ) : null}
        {publishError ? (
          <p className="text-sm font-semibold text-red-200">{publishError}</p>
        ) : null}
      </div>
    </section>
  );
}
