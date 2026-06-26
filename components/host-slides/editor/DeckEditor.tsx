"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import {
  FaCheck,
  FaExclamationTriangle,
  FaImage,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import { BrandButton } from "@/components/ui/BrandButton";
import { DingbatsEditor } from "@/components/host-slides/editor/DingbatsEditor";
import { QuizRecapReviewPanel } from "@/components/host-slides/editor/QuizRecapReviewPanel";
import { ReadinessSummaryPanel } from "@/components/host-slides/editor/ReadinessSummaryPanel";
import { PresenterGateButton } from "@/components/host-slides/PresenterGateButton";
import {
  createEmptyDingbatSet,
  type HostDeck,
  type HostDeckStatus,
  type HostDingbatSet,
  type HostQuestion,
  type HostQaFinding,
  type HostQaFindingStatus,
  type HostShowBlock,
  type HostBreakBlockConfig,
  type HostShowOrder,
  type HostShowScreens,
  type HostShowScreenTextSettings,
} from "@/src/host-slides/types";
import {
  loadHostDeck,
  updateHostDeck,
  updateHostDeckStatus,
} from "@/src/host-slides/supabaseDecks";
import {
  deleteHostSlideImages,
  uploadHostDingbatImage,
  uploadHostSlideImage,
} from "@/src/host-slides/supabaseImages";
import { getImageFileFromDataTransfer } from "@/src/host-slides/browserImageFiles";
import type { QuizRecapPublishResult } from "@/src/host-slides/quizRecapPublishing";
import type {
  HostImageSearchCandidate,
  HostImageSearchResult,
} from "@/src/host-slides/imageSearch";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import {
  applyHostQaFix,
  isOpenQaFinding,
} from "@/src/host-slides/qa";
import {
  HttpConnectionReviewer,
  HttpFactReviewer,
  HttpImageSuggestionProvider,
  HttpLanguageReviewer,
  PRODUCTION_REVIEW_STAGES,
  PRODUCTION_REVIEW_VERSION,
  runProductionReview,
} from "@/src/host-slides/productionReview";
import { resolveHostShowScreens } from "@/src/host-slides/showScreens";
import {
  getDefaultShowOrder,
  resolveHostShowOrder,
} from "@/src/host-slides/showOrder";

type DeckEditorProps = {
  deckId: string;
};

type QuestionEditorProps = {
  question: HostQuestion;
  questionNumber: number;
  imageSuggestion?: {
    searchTerm: string;
    imageType: string;
    orientation: "portrait" | "landscape" | "square" | "any";
    crop: string;
  };
  candidateState?: ImageCandidateState;
  onChange: (next: HostQuestion) => void;
  onImageFileSelected: (file: File) => void;
  onImageRemoved: () => void;
  onSearchImages: () => void;
  onUseImageCandidate: (candidate: HostImageSearchCandidate) => void;
};

type QuestionLocation = {
  question: HostQuestion;
  roundNumber: number;
  questionNumber: number;
};

type ImageCandidateState = {
  loading: boolean;
  importingCandidateId?: string;
  candidates: HostImageSearchCandidate[];
  message?: string;
};

type BreakShowBlock = Extract<
  HostShowBlock,
  { type: "pre_break" | "break_countdown" | "post_break" }
>;

type EditorTab =
  | "overview"
  | "show-order"
  | "show-screens"
  | "questions"
  | "qa-review"
  | "dingbats"
  | "quiz-recap";

function collectImagePaths(deck: HostDeck): Set<string> {
  const paths = new Set<string>();
  deck.rounds.forEach((round) => {
    round.questions.forEach((question) => {
      if (question.imageStoragePath) paths.add(question.imageStoragePath);
    });
  });
  if (deck.tiebreaker?.imageStoragePath) {
    paths.add(deck.tiebreaker.imageStoragePath);
  }
  if (deck.quizType === "saturday") {
    deck.dingbats?.items.forEach((item) => {
      if (item.imageStoragePath) paths.add(item.imageStoragePath);
    });
  }
  return paths;
}

function findQuestionLocation(
  deck: HostDeck,
  questionId: string,
): QuestionLocation | null {
  for (const [roundIndex, round] of deck.rounds.entries()) {
    const questionIndex = round.questions.findIndex(
      (question) => question.id === questionId,
    );
    if (questionIndex >= 0) {
      return {
        question: round.questions[questionIndex],
        roundNumber: roundIndex + 1,
        questionNumber: questionIndex + 1,
      };
    }
  }

  if (deck.tiebreaker?.id === questionId) {
    return { question: deck.tiebreaker, roundNumber: 0, questionNumber: 1 };
  }
  return null;
}

function ImageCandidateGrid({
  state,
  onUseImageCandidate,
}: {
  state?: ImageCandidateState;
  onUseImageCandidate: (candidate: HostImageSearchCandidate) => void;
}) {
  if (!state) return null;
  if (state.loading) {
    return (
      <p className="rounded-lg border border-violet-200 bg-white p-3 text-sm font-semibold text-violet-800">
        Searching candidate images...
      </p>
    );
  }
  if (state.candidates.length === 0) {
    return state.message ? (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
        {state.message}
      </p>
    ) : null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {state.candidates.map((candidate) => (
        <article
          key={candidate.id}
          className="overflow-hidden rounded-lg border border-violet-200 bg-white"
        >
          <div className="relative h-32 bg-violet-50">
            <Image
              src={candidate.thumbnailUrl}
              alt={candidate.title ?? candidate.sourceName}
              fill
              sizes="240px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-2 p-3 text-sm">
            <div>
              <p className="font-bold text-slate-900">
                {candidate.title ?? candidate.sourceName}
              </p>
              <p className="text-xs text-slate-600">
                {candidate.sourceName}
                {candidate.width && candidate.height
                  ? ` · ${candidate.width}x${candidate.height}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BrandButton
                type="button"
                size="sm"
                onClick={() => onUseImageCandidate(candidate)}
                loading={state.importingCandidateId === candidate.id}
              >
                Use This Image
              </BrandButton>
              <a
                href={candidate.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-lg border borderc px-3 text-sm font-semibold text-textc hover:bg-brand/10"
              >
                Open Source
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function QuestionEditor({
  question,
  questionNumber,
  imageSuggestion,
  candidateState,
  onChange,
  onImageFileSelected,
  onImageRemoved,
  onSearchImages,
  onUseImageCandidate,
}: QuestionEditorProps) {
  const pictureRequired = Boolean(
    question.imagePlaceholder || question.imageUrl || question.imageStoragePath,
  );
  const issues = [
    !question.prompt.trim() ? "Empty question" : null,
    !question.answer.trim() ? "Missing answer" : null,
    pictureRequired && !question.imageUrl && !question.imageStoragePath
      ? "Picture required but no image attached"
      : null,
  ].filter((issue): issue is string => issue !== null);

  function togglePictureRequired(required: boolean) {
    const next = structuredClone(question);
    if (required) {
      next.imagePlaceholder ??= "Picture required";
    } else {
      delete next.imagePlaceholder;
      delete next.imageUrl;
      delete next.imageStoragePath;
      onImageRemoved();
    }
    onChange(next);
  }

  function attachImage(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageFileSelected(file);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      onChange({
        ...question,
        imageUrl: reader.result,
        imagePlaceholder: question.imagePlaceholder ?? "Picture required",
      });
    });
    reader.readAsDataURL(file);
  }

  function removeImage() {
    const next = structuredClone(question);
    delete next.imageUrl;
    delete next.imageStoragePath;
    next.imagePlaceholder ??= "Picture required";
    onImageRemoved();
    onChange(next);
  }

  function pasteImage(event: ClipboardEvent<HTMLElement>) {
    const file = getImageFileFromDataTransfer(event.clipboardData);
    if (!file) return;
    event.preventDefault();
    attachImage(file);
  }

  function dropImage(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const file = getImageFileFromDataTransfer(event.dataTransfer);
    if (file) attachImage(file);
  }

  return (
    <article className="space-y-4 rounded-xl border borderc bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-bold text-textc">Question {questionNumber}</h3>
        {issues.length === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            <FaCheck /> Valid
          </span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {issues.map((issue) => (
              <span
                key={issue}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900"
              >
                <FaExclamationTriangle /> {issue}
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-textc">Question text</span>
        <textarea
          value={question.prompt}
          onChange={(event) =>
            onChange({ ...question, prompt: event.target.value })
          }
          className="mt-1 min-h-24 w-full rounded-lg border borderc bg-white p-3 text-slate-900 outline-none focus:ring-4 focus:ring-brand/20"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-textc">Answer text</span>
        <textarea
          value={question.answer}
          onChange={(event) =>
            onChange({ ...question, answer: event.target.value })
          }
          className="mt-1 min-h-20 w-full rounded-lg border borderc bg-white p-3 text-slate-900 outline-none focus:ring-4 focus:ring-brand/20"
        />
      </label>

      <div className="flex flex-wrap items-center gap-5">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-textc">
          <input
            type="checkbox"
            checked={pictureRequired}
            onChange={(event) => togglePictureRequired(event.target.checked)}
            className="h-4 w-4 accent-violet-600"
          />
          Picture required
        </label>
        <span className="text-sm text-textc-muted">
          Image attached:{" "}
          <strong>
            {question.imageUrl || question.imageStoragePath ? "Yes" : "No"}
          </strong>
          {pictureRequired && !question.imageUrl && !question.imageStoragePath
            ? " (placeholder only)"
            : ""}
        </span>
      </div>

      {pictureRequired ? (
        <div
          className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4 outline-none focus:ring-4 focus:ring-violet-200"
          tabIndex={0}
          onPaste={pasteImage}
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropImage}
          aria-label={`Image attachment area for question ${questionNumber}`}
        >
          <p className="text-xs font-medium text-violet-700">
            Click this area and paste an image, drag one here, or use the button.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id={`host-slide-image-${question.id}`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) attachImage(file);
                event.target.value = "";
              }}
            />
            <label
              htmlFor={`host-slide-image-${question.id}`}
              className="btn inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-600"
            >
              <FaImage />
              {question.imageUrl || question.imageStoragePath
                ? "Replace Image"
                : "Attach Image"}
            </label>
            {question.imageUrl || question.imageStoragePath ? (
              <button
                type="button"
                onClick={removeImage}
                className="btn inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <FaTrash /> Remove Image
              </button>
            ) : null}
          </div>

          {question.imageUrl ? (
            <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-violet-200 bg-white">
              <Image
                src={question.imageUrl}
                alt={`Attached preview for question ${questionNumber}`}
                fill
                sizes="320px"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : question.imageStoragePath ? (
            <p className="text-sm text-violet-800">
              Stored image: {question.imageStoragePath}
            </p>
          ) : (
            <p className="text-sm text-amber-800">
              Attach an image to clear the picture validation warning.
            </p>
          )}

          {imageSuggestion && !question.imageUrl && !question.imageStoragePath ? (
            <div className="space-y-3 rounded-lg border border-violet-200 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Suggested Search: {imageSuggestion.searchTerm}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {imageSuggestion.imageType} · {imageSuggestion.orientation} ·{" "}
                    {imageSuggestion.crop}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BrandButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        imageSuggestion.searchTerm,
                      )
                    }
                  >
                    Copy Search
                  </BrandButton>
                  <BrandButton
                    type="button"
                    size="sm"
                    onClick={onSearchImages}
                    loading={candidateState?.loading}
                  >
                    Search Images
                  </BrandButton>
                </div>
              </div>
              <ImageCandidateGrid
                state={candidateState}
                onUseImageCandidate={onUseImageCandidate}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function qaFindingLocation(finding: HostQaFinding): string {
  if (finding.roundNumber && finding.questionNumber) {
    return `Round ${finding.roundNumber} Question ${finding.questionNumber}`;
  }
  if (finding.roundNumber) return `Round ${finding.roundNumber}`;
  if (finding.targetId) return finding.targetId;
  return "Deck";
}

export function DeckEditor({ deckId }: DeckEditorProps) {
  const [deck, setDeck] = useState<HostDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [reviewRunning, setReviewRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("overview");
  const [pendingImages, setPendingImages] = useState<Map<string, File>>(
    () => new Map(),
  );
  const [pendingDingbatImages, setPendingDingbatImages] = useState<
    Map<number, File>
  >(() => new Map());
  const [imageCandidateStates, setImageCandidateStates] = useState<
    Record<string, ImageCandidateState>
  >({});
  const [persistedImagePaths, setPersistedImagePaths] = useState<Set<string>>(
    () => new Set(),
  );
  const languageReviewer = useMemo(() => new HttpLanguageReviewer(), []);
  const factReviewer = useMemo(() => new HttpFactReviewer(), []);
  const imageSuggestionProvider = useMemo(
    () => new HttpImageSuggestionProvider(),
    [],
  );
  const connectionReviewer = useMemo(() => new HttpConnectionReviewer(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const loadedDeck = await loadHostDeck(deckId);
        if (!cancelled) {
          setDeck(loadedDeck);
          setPersistedImagePaths(collectImagePaths(loadedDeck));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load deck.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const questionCount = useMemo(
    () =>
      deck?.rounds.reduce(
        (total, round) => total + round.questions.length,
        0,
      ) ?? 0,
    [deck],
  );

  const updateQuizRecapAccessCodes = useCallback(
    (codes: { part1?: string; part2?: string }) => {
      setDeck((current) =>
        current
          ? {
              ...current,
              quizRecapAccessCodes: {
                ...current.quizRecapAccessCodes,
                ...codes,
              },
            }
          : current,
      );
    },
    [],
  );

  if (loading) {
    return (
      <main className="qhl-shell">
        <div className="qhl-card text-white">Loading deck...</div>
      </main>
    );
  }

  if (!deck || loadError) {
    return (
      <main className="qhl-shell">
        <div className="qhl-card text-red-100">
          {loadError ?? "Deck not found."}
        </div>
      </main>
    );
  }

  function updateTitle(title: string) {
    setDeck((current) => (current ? { ...current, title } : current));
    setSavedMessage(null);
  }

  function updateDate(quizDate: string) {
    setDeck((current) => (current ? { ...current, quizDate } : current));
    setSavedMessage(null);
  }

  function updateConnectionExplanation(connectionExplanation: string) {
    setDeck((current) =>
      current ? { ...current, connectionExplanation } : current,
    );
    setSavedMessage(null);
  }

  function updateShowScreen<TKey extends keyof HostShowScreens>(
    screenKey: TKey,
    updates: Partial<HostShowScreens[TKey]>,
  ) {
    setDeck((current) => {
      if (!current) return current;
      const showScreens = resolveHostShowScreens(
        current.quizType,
        current.showScreens,
      );
      return {
        ...current,
        showScreens: {
          ...showScreens,
          [screenKey]: {
            ...showScreens[screenKey],
            ...updates,
          },
        },
      };
    });
    setSavedMessage(null);
  }

  function updateShowOrderBlock(blockId: string, updates: Partial<HostShowBlock>) {
    setDeck((current) => {
      if (!current) return current;
      const showOrder = resolveHostShowOrder(current);
      return {
        ...current,
        showOrder: showOrder.map((block) =>
          block.id === blockId ? ({ ...block, ...updates } as HostShowBlock) : block,
        ),
      };
    });
    setSavedMessage(null);
  }

  function updateBreakShowBlockText(
    block: BreakShowBlock,
    updates: Partial<NonNullable<HostBreakBlockConfig["textSettings"]>>,
  ) {
    const existingSettings = getBreakShowBlockTextSettings(block);
    updateShowOrderBlock(block.id, {
      config: {
        ...block.config,
        textSettings: {
          ...existingSettings,
          ...updates,
        },
      },
    } as Partial<HostShowBlock>);
  }

  function resetShowOrder() {
    setDeck((current) =>
      current
        ? {
            ...current,
            showOrder: getDefaultShowOrder(
              current.quizType,
              current.rounds.length,
            ),
          }
        : current,
    );
    setSavedMessage(null);
  }

  function updateRoundTitle(roundIndex: number, title: string) {
    setDeck((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      next.rounds[roundIndex].title = title;
      return next;
    });
    setSavedMessage(null);
  }

  function updateQuestion(
    roundIndex: number,
    questionIndex: number,
    question: HostQuestion,
  ) {
    setDeck((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      next.rounds[roundIndex].questions[questionIndex] = question;
      return next;
    });
    setSavedMessage(null);
  }

  function updateTiebreaker(question: HostQuestion) {
    setDeck((current) => {
      if (!current) return current;
      return { ...current, tiebreaker: question };
    });
    setSavedMessage(null);
  }

  function setPendingImage(questionId: string, file: File) {
    setPendingImages((current) => {
      const next = new Map(current);
      next.set(questionId, file);
      return next;
    });
  }

  function clearPendingImage(questionId: string) {
    setPendingImages((current) => {
      const next = new Map(current);
      next.delete(questionId);
      return next;
    });
  }

  function updateDingbats(dingbats: HostDingbatSet) {
    setDeck((current) => {
      if (!current || current.quizType !== "saturday") return current;
      return { ...current, dingbats };
    });
    setSavedMessage(null);
  }

  function setPendingDingbatImage(position: number, file: File) {
    setPendingDingbatImages((current) => {
      const next = new Map(current);
      next.set(position, file);
      return next;
    });
  }

  function clearPendingDingbatImage(position: number) {
    setPendingDingbatImages((current) => {
      const next = new Map(current);
      next.delete(position);
      return next;
    });
  }

  function addTiebreaker() {
    if (!deck) return;
    updateTiebreaker({
      id: `${deck.id}-tiebreaker`,
      prompt: "",
      answer: "",
    });
  }

  function applyRecapPublication(result: QuizRecapPublishResult) {
    setDeck((current) =>
      current
        ? {
            ...current,
            linkedQuizRecapId: result.recapId,
            quizRecapLastPublishedAt: result.publishedAt,
          }
        : current,
    );
  }

  async function runProductionReviewForDeck() {
    if (!deck) return;
    setReviewRunning(true);
    setSavedMessage(null);
    try {
      const review = await runProductionReview(deck, new Date().toISOString(), {
        languageReviewer,
        factReviewer,
        imageSuggestionProvider,
        connectionReviewer,
      });
      setDeck((current) => {
        if (!current || current.id !== deck.id) return current;
        return {
          ...current,
          qaFindings: review.findings,
          productionReview: {
            lastRunAt: review.completedAt,
            version: PRODUCTION_REVIEW_VERSION,
            durationMs: review.durationMs,
            stages: review.stages,
          },
        };
      });
    } finally {
      setReviewRunning(false);
    }
  }

  function applyQaFix(findingId: string) {
    setDeck((current) =>
      current ? applyHostQaFix(current, findingId) : current,
    );
    setSavedMessage(null);
  }

  function updateQaFindingStatus(
    findingId: string,
    status: HostQaFindingStatus,
  ) {
    setDeck((current) =>
      current
        ? {
            ...current,
            qaFindings: current.qaFindings?.map((finding) =>
              finding.id === findingId
                ? {
                    ...finding,
                    status,
                    updatedAt: new Date().toISOString(),
                  }
                : finding,
            ),
          }
        : current,
    );
    setSavedMessage(null);
  }

  function findImageSuggestion(questionId: string) {
    return deck?.qaFindings?.find(
      (finding) =>
        finding.source === "AI_IMAGE" &&
        finding.targetId === questionId &&
        finding.imageSuggestion,
    )?.imageSuggestion;
  }

  async function searchImageCandidates(questionId: string) {
    if (!deck) return;
    const suggestion = findImageSuggestion(questionId);
    if (!suggestion) return;
    setImageCandidateStates((current) => ({
      ...current,
      [questionId]: {
        loading: true,
        candidates: current[questionId]?.candidates ?? [],
      },
    }));
    try {
      const response = await fetch("/api/host-slides/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...suggestion,
          deckId: deck.id,
          questionId,
        }),
      });
      const result = (await response.json()) as HostImageSearchResult;
      setImageCandidateStates((current) => ({
        ...current,
        [questionId]: {
          loading: false,
          candidates: result.candidates ?? [],
          message:
            result.status === "unavailable"
              ? (result.message ?? "Image search provider is not configured.")
              : result.candidates.length === 0
                ? "No candidate images found."
                : undefined,
        },
      }));
    } catch (error: unknown) {
      setImageCandidateStates((current) => ({
        ...current,
        [questionId]: {
          loading: false,
          candidates: [],
          message:
            error instanceof Error
              ? error.message
              : "Could not search candidate images.",
        },
      }));
    }
  }

  async function importImageCandidateFromSearch(
    questionId: string,
    candidate: HostImageSearchCandidate,
  ) {
    if (!deck) return;
    const location = findQuestionLocation(deck, questionId);
    if (!location) return;
    setImageCandidateStates((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? { loading: false, candidates: [] }),
        loading: false,
        importingCandidateId: candidate.id,
      },
    }));
    try {
      const response = await fetch("/api/host-slides/import-image-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: candidate.imageUrl,
          sourceUrl: candidate.sourceUrl,
          deckId: deck.id,
          roundNumber: location.roundNumber,
          questionNumber: location.questionNumber,
          safeFilename:
            candidate.title ?? candidate.sourceName ?? candidate.id,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Could not import selected image.");
      }
      const payload = (await response.json()) as {
        imageStoragePath: string;
        imageUrl: string;
      };
      setDeck((current) => {
        if (!current) return current;
        const next = structuredClone(current);
        const nextLocation = findQuestionLocation(next, questionId);
        if (!nextLocation) return current;
        nextLocation.question.imageStoragePath = payload.imageStoragePath;
        nextLocation.question.imageUrl = payload.imageUrl;
        nextLocation.question.imagePlaceholder ??= "Picture required";
        return next;
      });
      clearPendingImage(questionId);
      setSavedMessage("Candidate image imported. Save Draft to persist it.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not import selected image.",
      );
    } finally {
      setImageCandidateStates((current) => ({
        ...current,
        [questionId]: {
          ...(current[questionId] ?? { loading: false, candidates: [] }),
          loading: false,
          importingCandidateId: undefined,
        },
      }));
    }
  }

  async function changeStatus(status: HostDeckStatus) {
    if (!deck) return;
    setStatusChanging(true);
    setSavedMessage(null);
    setSaveError(null);
    try {
      await updateHostDeckStatus(deck.id, status);
      setDeck((current) => (current ? { ...current, status } : current));
      setSavedMessage(
        status === "ready" ? "Deck marked ready." : "Deck moved back to draft.",
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "Could not update status.",
      );
    } finally {
      setStatusChanging(false);
    }
  }

  async function saveDraft() {
    if (!deck) return;
    setSaving(true);
    setSavedMessage(null);
    setSaveError(null);
    const nextDeck = structuredClone(deck);
    const newlyUploadedPaths: string[] = [];

    try {
      for (const [questionId, file] of pendingImages) {
        const location = findQuestionLocation(nextDeck, questionId);
        if (!location) continue;
        const storagePath = await uploadHostSlideImage({
          deckId: nextDeck.id,
          roundNumber: location.roundNumber,
          questionNumber: location.questionNumber,
          file,
        });
        newlyUploadedPaths.push(storagePath);
        location.question.imageStoragePath = storagePath;
      }

      if (nextDeck.quizType === "saturday") {
        nextDeck.dingbats ??= createEmptyDingbatSet();
        for (const [position, file] of pendingDingbatImages) {
          const item = nextDeck.dingbats.items.find(
            (candidate) => candidate.position === position,
          );
          if (!item) continue;
          const storagePath = await uploadHostDingbatImage({
            deckId: nextDeck.id,
            position,
            file,
          });
          newlyUploadedPaths.push(storagePath);
          item.imageStoragePath = storagePath;
        }
      }

      const savedDeck = await updateHostDeck(nextDeck);
      const savedPaths = collectImagePaths(savedDeck);
      const pathsToDelete = [...persistedImagePaths].filter(
        (path) => !savedPaths.has(path),
      );
      setDeck(savedDeck);
      setPendingImages(new Map());
      setPendingDingbatImages(new Map());
      setPersistedImagePaths(savedPaths);
      setSavedMessage("Draft saved to Supabase.");

      try {
        await deleteHostSlideImages(pathsToDelete);
      } catch (cleanupError: unknown) {
        setSaveError(
          cleanupError instanceof Error
            ? `Draft saved, but an old image could not be removed: ${cleanupError.message}`
            : "Draft saved, but an old image could not be removed.",
        );
      }
    } catch (error: unknown) {
      try {
        await deleteHostSlideImages(newlyUploadedPaths);
      } catch {
        // The database error is more useful to the editor; an orphaned upload
        // can be cleaned up later without losing the draft's current data.
      }
      setSaveError(
        error instanceof Error ? error.message : "Could not save draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeDeck = deck;
  const showScreens = resolveHostShowScreens(
    activeDeck.quizType,
    activeDeck.showScreens,
  );
  const showOrder: HostShowOrder = resolveHostShowOrder(activeDeck);
  function getBreakShowBlockTextSettings(
    block: BreakShowBlock,
  ): NonNullable<HostBreakBlockConfig["textSettings"]> {
    if (block.config.textSettings) return block.config.textSettings;

    const defaultBlock = getDefaultShowOrder(
      activeDeck.quizType,
      activeDeck.rounds.length,
    ).find(
      (candidate): candidate is BreakShowBlock => {
        if (
          candidate.type !== "pre_break" &&
          candidate.type !== "break_countdown" &&
          candidate.type !== "post_break"
        ) {
          return false;
        }
        return (
          candidate.type === block.type &&
          candidate.config.breakNumber === block.config.breakNumber
        );
      },
    );
    if (defaultBlock?.config.textSettings) return defaultBlock.config.textSettings;

    if (block.type === "pre_break") return showScreens.preBreak;
    if (block.type === "post_break") return showScreens.postBreak;
    return block.config.breakNumber === 2 && activeDeck.quizType === "saturday"
      ? showScreens.saturdayBreak2
      : showScreens.breakCountdown;
  }
  const breakShowBlocks = showOrder.filter(
    (block): block is BreakShowBlock =>
      block.type === "pre_break" ||
      block.type === "break_countdown" ||
      block.type === "post_break",
  );
  const showScreenGroups: {
    heading: string;
    description: string;
    screens: {
      key: keyof HostShowScreens;
      label: string;
      canDisable: boolean;
    }[];
  }[] = [
    {
      heading: "Opening",
      description:
        "Holding screens before the quiz title/date slide. Streamlabs handles scene switching and camera overlays.",
      screens: [
        { key: "blank", label: "Blank", canDisable: true },
        { key: "preRoll", label: "Pre-Roll", canDisable: true },
        { key: "preQuiz", label: "Pre-Quiz", canDisable: true },
      ],
    },
    {
      heading: "Mid Quiz",
      description:
        "Reset slide after Round 3 answers.",
      screens: [
        {
          key: "midQuizReset",
          label: "Mid-Quiz Reset / Round 4 Setup",
          canDisable: true,
        },
      ],
    },
    {
      heading: "Ending",
      description: "Final holding screen after the quiz flow completes.",
      screens: [{ key: "quizEnd", label: "Quiz End", canDisable: true }],
    },
  ];
  const readiness = evaluateHostDeckReadiness(activeDeck);
  const requiredPictureQuestions = activeDeck.rounds.flatMap((round) =>
    round.questions.filter(
      (question) =>
        question.imagePlaceholder ||
        question.imageUrl ||
        question.imageStoragePath,
    ),
  );
  const attachedPictureQuestions = requiredPictureQuestions.filter(
    (question) => question.imageUrl || question.imageStoragePath,
  );
  const pendingImageCount = pendingImages.size + pendingDingbatImages.size;
  const qaFindings = activeDeck.qaFindings;
  const productionReview = activeDeck.productionReview;
  const reviewStageById = new Map(
    productionReview?.stages.map((stage) => [stage.id, stage]),
  );
  const qaOpenFindings = qaFindings?.filter(isOpenQaFinding) ?? [];
  const qaOpenErrors = qaOpenFindings.filter(
    (finding) => finding.severity === "error",
  ).length;
  const qaOpenWarnings = qaOpenFindings.filter(
    (finding) => finding.severity === "warning",
  ).length;
  const qaIgnored = qaFindings?.filter(
    (finding) => finding.status === "ignored",
  ).length ?? 0;
  const qaFixed = qaFindings?.filter((finding) => finding.status === "fixed")
    .length ?? 0;
  const qaGroups = (qaFindings ?? []).reduce<
    Record<string, HostQaFinding[]>
  >((groups, finding) => {
    const key = `${finding.source} - ${finding.category}`;
    return {
      ...groups,
      [key]: [...(groups[key] ?? []), finding],
    };
  }, {});
  const isWeeklyDeck =
    activeDeck.quizType === "thursday" || activeDeck.quizType === "saturday";
  const tabs: { id: EditorTab; label: string; description: string }[] = [
    {
      id: "overview",
      label: "Overview",
      description: "Deck details, readiness, warnings, and quick status.",
    },
    {
      id: "show-order",
      label: "Show Order",
      description: "Compact presenter running order and enable switches.",
    },
    {
      id: "show-screens",
      label: "Show Screens",
      description: "Editable holding screen content and break packages.",
    },
    {
      id: "questions",
      label: "Questions",
      description: "Rounds, questions, answers, images, and tiebreak.",
    },
    {
      id: "qa-review",
      label: "Production Review",
      description: "Run the review pipeline and sign off findings.",
    },
    ...(activeDeck.quizType === "saturday"
      ? [
          {
            id: "dingbats" as const,
            label: "Dingbats",
            description: "Six Dingbat slots with images and answers.",
          },
        ]
      : []),
    ...(isWeeklyDeck
      ? [
          {
            id: "quiz-recap" as const,
            label: "Quiz Recap",
            description: "Access codes, video fields, preview, and publish.",
          },
        ]
      : []),
  ];
  const activeTabDescription =
    tabs.find((tab) => tab.id === activeTab)?.description ?? "";

  return (
    <main className="qhl-shell space-y-5">
      <section className="sticky top-[65px] z-30 -mx-4 border-b border-violet-200/15 bg-[#170827]/95 px-4 py-4 shadow-2xl backdrop-blur md:-mx-6 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="qhl-kicker">Host Deck Editor</div>
            <h1 className="mt-1 max-w-3xl truncate text-2xl font-extrabold text-white md:text-3xl">
              {activeDeck.title}
            </h1>
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-violet-100/80">
              <div>
                <dt className="sr-only">Quiz date</dt>
                <dd>{activeDeck.quizDate}</dd>
              </div>
              <div>
                <dt className="sr-only">Quiz type</dt>
                <dd className="capitalize">{activeDeck.quizType}</dd>
              </div>
              <div>
                <dt className="sr-only">Status</dt>
                <dd className="font-bold uppercase tracking-[0.14em] text-yellow-300">
                  {activeDeck.status === "ready" ? "Ready" : "Draft"}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Readiness</dt>
                <dd className="font-bold text-white">
                  Readiness {readiness.score}%
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <BrandButton
              leftIcon={<FaSave />}
              onClick={() => void saveDraft()}
              loading={saving}
              disabled={saving}
              size="sm"
            >
              Save Draft
            </BrandButton>
            <BrandButton
              variant="outline"
              size="sm"
              loading={statusChanging}
              disabled={statusChanging}
              onClick={() =>
                void changeStatus(
                  activeDeck.status === "ready" ? "draft" : "ready",
                )
              }
            >
              {activeDeck.status === "ready"
                ? "Move Back To Draft"
                : "Mark Ready"}
            </BrandButton>
            <BrandButton
              href={`/admin/host-slides/${activeDeck.id}/slides`}
              variant="outline"
              size="sm"
            >
              Preview
            </BrandButton>
            <PresenterGateButton deck={activeDeck} size="sm" />
            {isWeeklyDeck ? (
              <BrandButton
                type="button"
                variant="accent"
                size="sm"
                onClick={() => setActiveTab("quiz-recap")}
              >
                Publish Recap
              </BrandButton>
            ) : null}
          </div>
        </div>
        {(savedMessage || saveError) && (
          <div className="mx-auto mt-3 max-w-7xl">
            {savedMessage ? (
              <p className="text-sm font-semibold text-green-200">
                {savedMessage}
              </p>
            ) : null}
            {saveError ? (
              <p className="text-sm font-semibold text-red-200">{saveError}</p>
            ) : null}
          </div>
        )}
      </section>

      <section className="qhl-card space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-yellow-300 text-violet-950"
                  : "bg-white/10 text-violet-50 hover:bg-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-violet-100/70">{activeTabDescription}</p>
      </section>

      <section
        className={`qhl-card space-y-4 ${
          activeTab === "overview" ? "" : "hidden"
        }`}
      >
        <h2 className="text-xl font-bold text-white">Deck Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="qhl-label">Title</span>
            <input
              className="qhl-input"
              value={deck.title}
              onChange={(event) => updateTitle(event.target.value)}
            />
          </label>
          <label>
            <span className="qhl-label">Date</span>
            <input
              type="date"
              className="qhl-input"
              value={deck.quizDate}
              onChange={(event) => updateDate(event.target.value)}
            />
          </label>
        </div>
        <dl className="grid gap-3 text-sm text-violet-100 sm:grid-cols-3">
          <div>
            <dt className="font-bold uppercase text-violet-200/70">Quiz Type</dt>
            <dd className="mt-1 capitalize">{deck.quizType}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase text-violet-200/70">Rounds</dt>
            <dd className="mt-1">{deck.rounds.length}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase text-violet-200/70">Questions</dt>
            <dd className="mt-1">{questionCount}</dd>
          </div>
        </dl>
      </section>

      <div className={activeTab === "overview" ? "" : "hidden"}>
        <ReadinessSummaryPanel deck={deck} />
      </div>

      <section
        className={`qhl-card space-y-4 ${
          activeTab === "overview" ? "" : "hidden"
        }`}
      >
        <div>
          <h2 className="text-xl font-bold text-white">Quick Status</h2>
          <p className="mt-1 text-sm text-violet-100/70">
            Fast checks before presenting or publishing.
          </p>
        </div>
        <dl className="grid gap-3 text-sm text-violet-100 md:grid-cols-5">
          <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
            <dt className="font-bold uppercase text-violet-200/70">Images</dt>
            <dd className="mt-1 font-semibold">
              {attachedPictureQuestions.length}/{requiredPictureQuestions.length} attached
            </dd>
            {pendingImageCount > 0 ? (
              <p className="mt-1 text-xs text-yellow-200">
                {pendingImageCount} pending upload
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
            <dt className="font-bold uppercase text-violet-200/70">Tiebreak</dt>
            <dd className="mt-1 font-semibold">
              {deck.tiebreaker ? "Set" : "Not set"}
            </dd>
          </div>
          <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
            <dt className="font-bold uppercase text-violet-200/70">Recap</dt>
            <dd className="mt-1 font-semibold">
              {deck.linkedQuizRecapId ? "Published" : "Not published"}
            </dd>
            {deck.quizRecapLastPublishedAt ? (
              <p className="mt-1 text-xs text-violet-100/70">
                {new Date(deck.quizRecapLastPublishedAt).toLocaleString(
                  "en-GB",
                )}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
            <dt className="font-bold uppercase text-violet-200/70">
              Readiness
            </dt>
            <dd className="mt-1 font-semibold">{readiness.score}%</dd>
            <p className="mt-1 text-xs text-violet-100/70">
              {readiness.errors.length} errors, {readiness.warnings.length} warnings
            </p>
          </div>
          <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
            <dt className="font-bold uppercase text-violet-200/70">
              Production Review
            </dt>
            <dd className="mt-1 font-semibold">
              {productionReview ? `${qaOpenFindings.length} open` : "Not run"}
            </dd>
            <p className="mt-1 text-xs text-violet-100/70">
              {qaOpenErrors} errors, {qaOpenWarnings} warnings
            </p>
          </div>
        </dl>
      </section>

      <section
        className={`qhl-card space-y-4 ${
          activeTab === "show-order" ? "" : "hidden"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="qhl-kicker">Show Builder</div>
            <h2 className="mt-1 text-xl font-bold text-white">Show Order</h2>
            <p className="mt-1 text-sm text-violet-100/70">
              The presenter runs these blocks in order. Reordering can come
              later; V1 supports enable/disable and default reset.
            </p>
          </div>
          <BrandButton variant="outline" onClick={resetShowOrder}>
            Reset to Default Order
          </BrandButton>
        </div>

        <ol className="grid gap-2 md:grid-cols-2">
          {showOrder.map((block, index) => (
            <li
              key={`${block.id}-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200/15 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200/70">
                  {String(index + 1).padStart(2, "0")} · {block.type}
                </p>
                <p className="mt-1 font-semibold text-white">{block.label}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-violet-50">
                <input
                  type="checkbox"
                  checked={block.enabled}
                  onChange={(event) =>
                    updateShowOrderBlock(block.id, {
                      enabled: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-violet-500"
                />
                Enabled
              </label>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={`qhl-card space-y-5 ${
          activeTab === "show-screens" ? "" : "hidden"
        }`}
      >
        <div>
          <div className="qhl-kicker">Show Builder</div>
          <h2 className="mt-1 text-xl font-bold text-white">Break Packages</h2>
          <p className="mt-1 text-sm text-violet-100/70">
            Break 1 uses the Part 1 recap code. Break 2 uses the Part 2 recap
            code. Each block has its own presenter text and ticker.
          </p>
        </div>

        {[1, 2].map((breakNumber) => {
          const blocks = breakShowBlocks.filter(
            (block) => block.config.breakNumber === breakNumber,
          );
          if (blocks.length === 0) return null;

          return (
            <details
              key={breakNumber}
              className="rounded-xl border border-violet-200/15 bg-white/5 p-4"
            >
              <summary className="cursor-pointer list-none marker:hidden">
                <h3 className="inline text-lg font-bold text-white">
                  Break {breakNumber}
                </h3>
                <span className="ml-2 text-sm text-violet-100/70">
                  {breakNumber === 1
                    ? "After Round 3 questions, before the Part 1 answers."
                    : "After Round 5 questions, before the Part 2 answers."}
                </span>
              </summary>
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {blocks.map((block) => {
                  const settings = getBreakShowBlockTextSettings(block);
                  const label =
                    block.type === "pre_break"
                      ? "Pre-Break"
                      : block.type === "break_countdown"
                        ? "Break Countdown"
                        : "Post-Break";
                  return (
                    <div
                      key={block.id}
                      className="space-y-4 rounded-xl border border-violet-200/15 bg-white/5 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white">
                            Break {breakNumber} {label}
                          </h4>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-200/65">
                            {block.type}
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-violet-50">
                          <input
                            type="checkbox"
                            checked={block.enabled}
                            onChange={(event) =>
                              updateShowOrderBlock(block.id, {
                                enabled: event.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-violet-500"
                          />
                          Enabled
                        </label>
                      </div>
                      <label className="block">
                        <span className="qhl-label">Title</span>
                        <input
                          className="qhl-input"
                          value={settings.titleText}
                          onChange={(event) =>
                            updateBreakShowBlockText(block, {
                              titleText: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="qhl-label">Body</span>
                        <textarea
                          className="qhl-input min-h-24"
                          value={settings.bodyText}
                          onChange={(event) =>
                            updateBreakShowBlockText(block, {
                              bodyText: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="qhl-label">Ticker / lower-third</span>
                        <textarea
                          className="qhl-input min-h-16"
                          value={settings.tickerText}
                          onChange={(event) =>
                            updateBreakShowBlockText(block, {
                              tickerText: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </section>

      <section
        className={`qhl-card space-y-5 ${
          activeTab === "show-screens" ? "" : "hidden"
        }`}
      >
        <div>
          <div className="qhl-kicker">Show Screens</div>
          <h2 className="mt-1 text-xl font-bold text-white">
            Streamlabs Scene Slides
          </h2>
          <p className="mt-1 text-sm text-violet-100/70">
            Presenter slides for non-quiz moments. Streamlabs still handles
            camera, music, countdown timers, and scene switching.
          </p>
        </div>

        {showScreenGroups.map((group) => (
          <details
            key={group.heading}
            className="rounded-xl border border-violet-200/15 bg-white/5 p-4"
          >
            <summary className="cursor-pointer list-none marker:hidden">
              <h3 className="inline text-lg font-bold text-white">
                {group.heading}
              </h3>
              <span className="ml-2 text-sm text-violet-100/70">
                {group.description}
              </span>
            </summary>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {group.screens.map((screen) => {
                const settings = showScreens[
                  screen.key
                ] as HostShowScreenTextSettings;
                return (
                  <div
                    key={screen.key}
                    className="space-y-4 rounded-xl border border-violet-200/15 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h4 className="font-bold text-white">{screen.label}</h4>
                      {screen.canDisable ? (
                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-violet-50">
                          <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(event) =>
                              updateShowScreen(screen.key, {
                                enabled: event.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-violet-500"
                          />
                          Enabled
                        </label>
                      ) : null}
                    </div>
                    <label className="block">
                      <span className="qhl-label">Title</span>
                      <input
                        className="qhl-input"
                        value={settings.titleText}
                        onChange={(event) =>
                          updateShowScreen(screen.key, {
                            titleText: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="qhl-label">Body</span>
                      <textarea
                        className="qhl-input min-h-24"
                        value={settings.bodyText}
                        onChange={(event) =>
                          updateShowScreen(screen.key, {
                            bodyText: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="qhl-label">Ticker / lower-third</span>
                      <textarea
                        className="qhl-input min-h-16"
                        value={settings.tickerText}
                        onChange={(event) =>
                          updateShowScreen(screen.key, {
                            tickerText: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </section>

      <section className={activeTab === "questions" ? "space-y-4" : "hidden"}>
        {deck.rounds.map((round, roundIndex) => (
          <details
            key={round.id}
            className="qhl-card group"
          >
            <summary className="cursor-pointer list-none text-lg font-bold text-white marker:hidden">
              Round {roundIndex + 1}: {round.title}
              <span className="ml-2 text-sm font-normal text-violet-100/70">
                ({round.questions.length} questions)
              </span>
            </summary>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="qhl-label">Round title</span>
                <input
                  className="qhl-input"
                  value={round.title}
                  onChange={(event) =>
                    updateRoundTitle(roundIndex, event.target.value)
                  }
                />
              </label>

              {round.questions.map((question, questionIndex) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  questionNumber={questionIndex + 1}
                  imageSuggestion={findImageSuggestion(question.id)}
                  candidateState={imageCandidateStates[question.id]}
                  onChange={(next) =>
                    updateQuestion(roundIndex, questionIndex, next)
                  }
                  onImageFileSelected={(file) =>
                    setPendingImage(question.id, file)
                  }
                  onImageRemoved={() => clearPendingImage(question.id)}
                  onSearchImages={() => void searchImageCandidates(question.id)}
                  onUseImageCandidate={(candidate) =>
                    void importImageCandidateFromSearch(question.id, candidate)
                  }
                />
              ))}
            </div>
          </details>
        ))}
      </section>

      {activeTab === "dingbats" && deck.quizType === "saturday" ? (
        <DingbatsEditor
          dingbats={deck.dingbats ?? createEmptyDingbatSet()}
          onChange={updateDingbats}
          onImageFileSelected={setPendingDingbatImage}
          onImageRemoved={clearPendingDingbatImage}
        />
      ) : null}

      {(deck.quizType === "thursday" || deck.quizType === "saturday") &&
      activeTab === "questions" ? (
        <section className="qhl-card space-y-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Connection Explanation
            </h2>
            <p className="mt-1 text-sm text-violet-100/70">
              Optional presenter slide shown after the Round 4 answers. Leave
              empty to skip it.
            </p>
          </div>
          <label className="block">
            <span className="qhl-label">Explanation text</span>
            <textarea
              value={deck.connectionExplanation ?? ""}
              onChange={(event) =>
                updateConnectionExplanation(event.target.value)
              }
              placeholder="Example: The answers were all IKEA ranges, hidden numbers, silent letters..."
              className="qhl-input min-h-32"
            />
          </label>
        </section>
      ) : null}

      {activeTab === "questions" && deck.tiebreaker ? (
        <details className="qhl-card">
          <summary className="cursor-pointer list-none text-lg font-bold text-white marker:hidden">
            Tiebreaker
          </summary>
          <div className="mt-5">
            <QuestionEditor
              question={deck.tiebreaker}
              questionNumber={1}
              imageSuggestion={findImageSuggestion(deck.tiebreaker.id)}
              candidateState={imageCandidateStates[deck.tiebreaker.id]}
              onChange={updateTiebreaker}
              onImageFileSelected={(file) =>
                setPendingImage(deck.tiebreaker!.id, file)
              }
              onImageRemoved={() => clearPendingImage(deck.tiebreaker!.id)}
              onSearchImages={() =>
                void searchImageCandidates(deck.tiebreaker!.id)
              }
              onUseImageCandidate={(candidate) =>
                void importImageCandidateFromSearch(
                  deck.tiebreaker!.id,
                  candidate,
                )
              }
            />
          </div>
        </details>
      ) : activeTab === "questions" ? (
        <section className="qhl-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Tiebreak</h2>
            <p className="text-sm text-violet-100/70">Tiebreak not set</p>
          </div>
          <BrandButton variant="outline" onClick={addTiebreaker}>
            Add Tiebreak
          </BrandButton>
        </section>
      ) : null}

      {activeTab === "qa-review" ? (
        <section className="qhl-card space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="qhl-kicker">Production Review</div>
              <h2 className="mt-1 text-xl font-bold text-white">
                Review Pipeline
              </h2>
              <p className="mt-1 text-sm text-violet-100/70">
                Run the full production pipeline, then review every finding and
                suggestion before Jay signs it off.
              </p>
              {productionReview ? (
                <p className="mt-2 text-xs font-semibold text-violet-100/60">
                  Last run {new Date(productionReview.lastRunAt).toLocaleString()} ·{" "}
                  {Math.max(0.1, productionReview.durationMs / 1000).toFixed(1)}s
                </p>
              ) : null}
            </div>
            <BrandButton
              type="button"
              onClick={runProductionReviewForDeck}
              disabled={reviewRunning}
            >
              {reviewRunning ? "Running Review..." : "Run Production Review"}
            </BrandButton>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            {PRODUCTION_REVIEW_STAGES.map((stage) => {
              const result = reviewStageById.get(stage.id);
              const completed = result?.status === "completed";
              const unavailable = result?.status === "unavailable";
              const waiting = !result || result.status === "not_implemented";
              return (
                <div
                  key={stage.id}
                  className={`rounded-xl border p-4 text-sm text-violet-100 ${
                    completed
                      ? "border-green-300/25 bg-green-950/20"
                      : unavailable
                        ? "border-yellow-300/25 bg-yellow-950/15"
                        : "border-violet-200/15 bg-white/5"
                  }`}
                >
                  <div className="font-bold text-white">{stage.label}</div>
                  <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-violet-200/70">
                    {completed
                      ? "Completed"
                      : unavailable
                        ? "Unavailable"
                        : waiting
                          ? "Pending"
                          : "Needs Review"}
                  </div>
                  {result ? (
                    <p className="mt-2 text-xs text-violet-100/70">
                      {result.findingsCount} finding
                      {result.findingsCount === 1 ? "" : "s"}
                      {" · "}
                      {Math.max(0.1, result.durationMs / 1000).toFixed(1)}s
                    </p>
                  ) : null}
                  {result?.message ? (
                    <p className="mt-2 text-xs font-semibold text-yellow-100">
                      {result.message}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <dl className="grid gap-3 text-sm text-violet-100 md:grid-cols-4">
            <div className="rounded-xl border border-red-300/30 bg-red-950/30 p-4">
              <dt className="font-bold uppercase text-red-100/80">
                Open Errors
              </dt>
              <dd className="mt-1 text-2xl font-black">{qaOpenErrors}</dd>
            </div>
            <div className="rounded-xl border border-yellow-300/30 bg-yellow-950/20 p-4">
              <dt className="font-bold uppercase text-yellow-100/80">
                Open Warnings
              </dt>
              <dd className="mt-1 text-2xl font-black">{qaOpenWarnings}</dd>
            </div>
            <div className="rounded-xl border border-violet-200/15 bg-white/5 p-4">
              <dt className="font-bold uppercase text-violet-200/70">
                Ignored
              </dt>
              <dd className="mt-1 text-2xl font-black">{qaIgnored}</dd>
            </div>
            <div className="rounded-xl border border-green-300/30 bg-green-950/20 p-4">
              <dt className="font-bold uppercase text-green-100/80">
                Fixed / Accepted
              </dt>
              <dd className="mt-1 text-2xl font-black">{qaFixed}</dd>
            </div>
          </dl>

          {!productionReview ? (
            <p className="rounded-xl border border-yellow-300/30 bg-yellow-950/20 p-4 text-sm font-semibold text-yellow-100">
              Production Review has not been run for this deck yet.
            </p>
          ) : Object.keys(qaGroups).length === 0 ? (
            <p className="rounded-xl border border-green-300/30 bg-green-950/20 p-4 text-sm font-semibold text-green-100">
              Production Review has been run and no findings were detected.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(qaGroups).map(([group, findings]) => (
                <details
                  key={group}
                  open
                  className="rounded-xl border border-violet-200/15 bg-white/5 p-4"
                >
                  <summary className="cursor-pointer list-none font-bold capitalize text-white marker:hidden">
                    {group.replace(" - ", " / ")} ({findings.length})
                  </summary>
                  <div className="mt-4 space-y-3">
                    {findings.map((finding) => (
                      <article
                        key={finding.id}
                        className="rounded-xl border border-violet-200/15 bg-black/20 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-200/70">
                              {qaFindingLocation(finding)} - {finding.source} -{" "}
                              {finding.status}
                            </p>
                            <h3 className="mt-1 font-bold text-white">
                              {finding.message}
                            </h3>
                            {finding.suggestedFix ? (
                              <p className="mt-2 text-sm text-yellow-100">
                                Suggested fix:{" "}
                                {finding.suggestedFix.description}
                              </p>
                            ) : null}
                            {typeof finding.confidence === "number" ? (
                              <p className="mt-2 text-sm text-violet-100/70">
                                Confidence: {Math.round(finding.confidence * 100)}%
                              </p>
                            ) : null}
                            {finding.imageSuggestion ? (
                              <div className="mt-3 rounded-lg border border-violet-200/15 bg-white/5 p-3 text-sm text-violet-50">
                                <p>
                                  Suggested Search:{" "}
                                  <strong>
                                    {finding.imageSuggestion.searchTerm}
                                  </strong>
                                </p>
                                <p className="mt-1 text-violet-100/70">
                                  {finding.imageSuggestion.imageType} ·{" "}
                                  {finding.imageSuggestion.orientation} ·{" "}
                                  {finding.imageSuggestion.crop}
                                </p>
                                {finding.targetId ? (
                                  <div className="mt-3">
                                    <ImageCandidateGrid
                                      state={imageCandidateStates[finding.targetId]}
                                      onUseImageCandidate={(candidate) =>
                                        void importImageCandidateFromSearch(
                                          finding.targetId!,
                                          candidate,
                                        )
                                      }
                                    />
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {finding.imageSuggestion ? (
                              <BrandButton
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void navigator.clipboard.writeText(
                                    finding.imageSuggestion!.searchTerm,
                                  )
                                }
                              >
                                Copy Search
                              </BrandButton>
                            ) : null}
                            {finding.imageSuggestion && finding.targetId ? (
                              <BrandButton
                                type="button"
                                size="sm"
                                onClick={() =>
                                  void searchImageCandidates(finding.targetId!)
                                }
                                loading={
                                  imageCandidateStates[finding.targetId]
                                    ?.loading
                                }
                              >
                                Find Images
                              </BrandButton>
                            ) : null}
                            {finding.suggestedFix &&
                            isOpenQaFinding(finding) ? (
                              <BrandButton
                                type="button"
                                size="sm"
                                onClick={() => applyQaFix(finding.id)}
                              >
                                Apply Fix
                              </BrandButton>
                            ) : null}
                            {finding.status !== "ignored" ? (
                              <BrandButton
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQaFindingStatus(finding.id, "ignored")
                                }
                              >
                                Ignore
                              </BrandButton>
                            ) : null}
                            {finding.status !== "fixed" ? (
                              <BrandButton
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQaFindingStatus(finding.id, "fixed")
                                }
                              >
                                Mark Fixed
                              </BrandButton>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {(deck.quizType === "thursday" || deck.quizType === "saturday") &&
      activeTab === "quiz-recap" ? (
        <QuizRecapReviewPanel
          deck={deck}
          onPublished={applyRecapPublication}
          onAccessCodesChange={updateQuizRecapAccessCodes}
        />
      ) : null}
    </main>
  );
}
