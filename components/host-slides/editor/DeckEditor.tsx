"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import {
  createEmptyDingbatSet,
  type HostDeck,
  type HostDingbatSet,
  type HostQuestion,
} from "@/src/host-slides/types";
import {
  loadHostDeck,
  updateHostDeck,
} from "@/src/host-slides/supabaseDecks";
import {
  deleteHostSlideImages,
  uploadHostDingbatImage,
  uploadHostSlideImage,
} from "@/src/host-slides/supabaseImages";
import { getImageFileFromDataTransfer } from "@/src/host-slides/browserImageFiles";

type DeckEditorProps = {
  deckId: string;
};

type QuestionEditorProps = {
  question: HostQuestion;
  questionNumber: number;
  onChange: (next: HostQuestion) => void;
  onImageFileSelected: (file: File) => void;
  onImageRemoved: () => void;
};

type QuestionLocation = {
  question: HostQuestion;
  roundNumber: number;
  questionNumber: number;
};

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

function QuestionEditor({
  question,
  questionNumber,
  onChange,
  onImageFileSelected,
  onImageRemoved,
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
        </div>
      ) : null}
    </article>
  );
}

export function DeckEditor({ deckId }: DeckEditorProps) {
  const [deck, setDeck] = useState<HostDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<Map<string, File>>(
    () => new Map(),
  );
  const [pendingDingbatImages, setPendingDingbatImages] = useState<
    Map<number, File>
  >(() => new Map());
  const [persistedImagePaths, setPersistedImagePaths] = useState<Set<string>>(
    () => new Set(),
  );

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

  return (
    <main className="qhl-shell space-y-5">
      <section className="qhl-hero">
        <div className="qhl-kicker">Host Deck Editor</div>
        <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
          {deck.title}
        </h1>
        <p className="mt-2 text-violet-100/80">
          Review and correct this local draft before presenting it.
        </p>
      </section>

      <section className="qhl-card space-y-4">
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

      <section className="space-y-4">
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
                  onChange={(next) =>
                    updateQuestion(roundIndex, questionIndex, next)
                  }
                  onImageFileSelected={(file) =>
                    setPendingImage(question.id, file)
                  }
                  onImageRemoved={() => clearPendingImage(question.id)}
                />
              ))}
            </div>
          </details>
        ))}
      </section>

      {deck.quizType === "saturday" ? (
        <DingbatsEditor
          dingbats={deck.dingbats ?? createEmptyDingbatSet()}
          onChange={updateDingbats}
          onImageFileSelected={setPendingDingbatImage}
          onImageRemoved={clearPendingDingbatImage}
        />
      ) : null}

      {deck.tiebreaker ? (
        <details className="qhl-card">
          <summary className="cursor-pointer list-none text-lg font-bold text-white marker:hidden">
            Tiebreaker
          </summary>
          <div className="mt-5">
            <QuestionEditor
              question={deck.tiebreaker}
              questionNumber={1}
              onChange={updateTiebreaker}
              onImageFileSelected={(file) =>
                setPendingImage(deck.tiebreaker!.id, file)
              }
              onImageRemoved={() => clearPendingImage(deck.tiebreaker!.id)}
            />
          </div>
        </details>
      ) : (
        <section className="qhl-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Tiebreak</h2>
            <p className="text-sm text-violet-100/70">Tiebreak not set</p>
          </div>
          <BrandButton variant="outline" onClick={addTiebreaker}>
            Add Tiebreak
          </BrandButton>
        </section>
      )}

      <section className="qhl-card flex flex-wrap items-center gap-3">
        <BrandButton
          leftIcon={<FaSave />}
          onClick={() => void saveDraft()}
          loading={saving}
          disabled={saving}
        >
          Save Draft
        </BrandButton>
        <BrandButton
          href={`/admin/host-slides/${deck.id}/slides`}
          variant="outline"
        >
          Preview Slides
        </BrandButton>
        <BrandButton href={`/host-slides/${deck.id}/present`} variant="accent">
          Present
        </BrandButton>
        {savedMessage ? (
          <p className="text-sm font-semibold text-green-200">{savedMessage}</p>
        ) : null}
        {saveError ? (
          <p className="text-sm font-semibold text-red-200">{saveError}</p>
        ) : null}
      </section>
    </main>
  );
}
