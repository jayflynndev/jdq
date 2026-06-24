"use client";

import { useMemo, useState } from "react";
import { FaFileImport, FaFileWord, FaFlask, FaSave } from "react-icons/fa";
import { BrandButton } from "@/components/ui/BrandButton";
import { Card, CardContent } from "@/components/ui/Card";
import {
  HostDeckParseError,
  parseJayQuizText,
} from "@/src/host-slides/jayQuizTextParser";
import { createRepresentativeJayQuizText } from "@/src/host-slides/jayQuizTextParser.fixture";
import type { HostDeck } from "@/src/host-slides/types";
import { validateHostDeck } from "@/src/host-slides/validation";
import { createHostDeck } from "@/src/host-slides/supabaseDecks";
import {
  DocxImportError,
  extractTextFromDocx,
} from "@/src/host-slides/docxTextExtractor";

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
        Step {step}
      </p>
      <h2 className="mt-1 text-xl font-bold text-textc">{title}</h2>
    </div>
  );
}

export function ImportReview() {
  const [sourceText, setSourceText] = useState("");
  const [parsedDeck, setParsedDeck] = useState<HostDeck | null>(null);
  const [draftDeck, setDraftDeck] = useState<HostDeck | null>(null);
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [extractingDocx, setExtractingDocx] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [docxPreview, setDocxPreview] = useState<{
    fileName: string;
    title: string;
    quizDate: string;
  } | null>(null);
  const [docxExtractedText, setDocxExtractedText] = useState<string | null>(
    null,
  );

  const validation = useMemo(
    () => (parsedDeck ? validateHostDeck(parsedDeck) : null),
    [parsedDeck],
  );
  const questionCount = useMemo(
    () =>
      parsedDeck?.rounds.reduce(
        (total, round) => total + round.questions.length,
        0,
      ) ?? 0,
    [parsedDeck],
  );

  function updateSourceText(value: string) {
    setSourceText(value);
    setParsedDeck(null);
    setDraftDeck(null);
    setParsingWarnings([]);
    setSaveError(null);
    setDocxError(null);
    setDocxPreview(null);
    setDocxExtractedText(null);
  }

  function loadSampleQuiz() {
    updateSourceText(createRepresentativeJayQuizText());
  }

  function parseText(text: string): HostDeck | null {
    setParsedDeck(null);
    setDraftDeck(null);
    setParsingWarnings([]);

    try {
      const deck = parseJayQuizText(text, {
        strictStandardShape: false,
      });
      setParsedDeck(deck);
      return deck;
    } catch (error: unknown) {
      const message =
        error instanceof HostDeckParseError || error instanceof Error
          ? error.message
          : "The quiz text could not be parsed.";
      setParsingWarnings([message]);
      return null;
    }
  }

  function parseSource() {
    setDocxError(null);
    void parseText(sourceText);
  }

  async function importDocx(file: File) {
    setExtractingDocx(true);
    setDocxError(null);
    setDocxPreview(null);
    setDocxExtractedText(null);
    try {
      const extractedText = await extractTextFromDocx(file);
      updateSourceText(extractedText);
      setDocxExtractedText(extractedText);
      const deck = parseText(extractedText);
      if (deck) {
        setDocxPreview({
          fileName: file.name,
          title: deck.title,
          quizDate: deck.quizDate,
        });
      }
    } catch (error: unknown) {
      setDocxError(
        error instanceof DocxImportError || error instanceof Error
          ? error.message
          : "The DOCX could not be imported.",
      );
    } finally {
      setExtractingDocx(false);
    }
  }

  async function createDraftDeck() {
    if (!parsedDeck) return;
    setSaving(true);
    setSaveError(null);
    try {
      setDraftDeck(await createHostDeck(parsedDeck));
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "Could not create the draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card hover={false}>
        <CardContent className="space-y-4">
          <StepHeading step={1} title="Upload or paste quiz content" />
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <input
              id="host-slides-docx-import"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              disabled={extractingDocx}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importDocx(file);
                event.target.value = "";
              }}
            />
            <label
              htmlFor="host-slides-docx-import"
              className="btn inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-600"
            >
              <FaFileWord />
              {extractingDocx ? "Extracting DOCX..." : "Upload Word Document"}
            </label>
            <p className="mt-2 text-xs text-violet-800">
              Upload a .docx file to extract its text and parse it automatically.
            </p>
            {docxError ? (
              <p className="mt-3 text-sm font-semibold text-red-700">
                {docxError}
              </p>
            ) : null}
            {docxPreview ? (
              <dl className="mt-3 grid gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-bold text-green-900">Document</dt>
                  <dd className="text-green-800">{docxPreview.fileName}</dd>
                </div>
                <div>
                  <dt className="font-bold text-green-900">Extracted title</dt>
                  <dd className="text-green-800">{docxPreview.title}</dd>
                </div>
                <div>
                  <dt className="font-bold text-green-900">Quiz date</dt>
                  <dd className="text-green-800">{docxPreview.quizDate}</dd>
                </div>
              </dl>
            ) : null}
            {docxExtractedText ? (
              <details className="mt-3 rounded-lg border border-violet-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-bold text-violet-900">
                  Development: extracted DOCX text
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-800">
                  {docxExtractedText}
                </pre>
              </details>
            ) : null}
          </div>
          <textarea
            value={sourceText}
            onChange={(event) => updateSourceText(event.target.value)}
            className="min-h-[24rem] w-full rounded-xl border borderc bg-white p-4 font-mono text-sm text-slate-900 outline-none focus:ring-4 focus:ring-brand/20"
            placeholder="Paste the extracted quiz document text here..."
            spellCheck={false}
          />
          <BrandButton
            type="button"
            variant="outline"
            leftIcon={<FaFlask />}
            onClick={loadSampleQuiz}
          >
            Load Sample Quiz
          </BrandButton>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardContent className="space-y-4">
          <StepHeading step={2} title="Parse document" />
          <BrandButton
            type="button"
            leftIcon={<FaFileImport />}
            onClick={parseSource}
            disabled={!sourceText.trim()}
          >
            Parse Quiz
          </BrandButton>
        </CardContent>
      </Card>

      <Card hover={false}>
        <CardContent className="space-y-5">
          <StepHeading step={3} title="Review parsed results" />

          {parsingWarnings.length > 0 ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">Parsing warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {parsingWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!parsedDeck ? (
            <p className="text-sm text-textc-muted">
              Parse the pasted quiz content to review it here.
            </p>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-textc">
                  Quiz Information
                </h3>
                <dl className="grid gap-3 rounded-xl border borderc p-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <dt className="text-xs font-bold uppercase text-textc-muted">
                      Title
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-textc">
                      {parsedDeck.title}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-textc-muted">
                      Quiz Type
                    </dt>
                    <dd className="mt-1 text-sm capitalize text-textc">
                      {parsedDeck.quizType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-textc-muted">
                      Rounds
                    </dt>
                    <dd className="mt-1 text-sm text-textc">
                      {parsedDeck.rounds.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-textc-muted">
                      Questions
                    </dt>
                    <dd className="mt-1 text-sm text-textc">{questionCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-textc-muted">
                      Tiebreak present?
                    </dt>
                    <dd className="mt-1 text-sm text-textc">
                      {parsedDeck.tiebreaker ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-textc">Rounds</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {parsedDeck.rounds.map((round, roundIndex) => (
                    <div
                      key={round.id}
                      className="rounded-xl border borderc p-4"
                    >
                      <p className="text-xs font-bold uppercase text-brand">
                        Round {roundIndex + 1}
                      </p>
                      <p className="mt-1 font-semibold text-textc">
                        {round.title}
                      </p>
                      <p className="mt-1 text-sm text-textc-muted">
                        {round.questions.length} questions
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-bold text-textc">Questions</h3>
                <div className="space-y-3">
                  {parsedDeck.rounds.flatMap((round, roundIndex) =>
                    round.questions.map((question, questionIndex) => (
                      <article
                        key={question.id}
                        className="rounded-xl border borderc p-4"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-brand">
                          Round {roundIndex + 1} · Question {questionIndex + 1}
                        </p>
                        <p className="mt-2 font-semibold text-textc">
                          {question.prompt}
                        </p>
                        <p className="mt-2 text-sm text-textc-muted">
                          <strong>Answer:</strong> {question.answer || "Missing"}
                        </p>
                        <p className="mt-1 text-sm text-textc-muted">
                          <strong>Picture required?</strong>{" "}
                          {question.imagePlaceholder || question.imageUrl
                            ? "Yes"
                            : "No"}
                        </p>
                      </article>
                    )),
                  )}
                </div>
              </section>

              {validation ? (
                <section className="space-y-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950">
                  <h3 className="text-lg font-bold">Validation Summary</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      Missing answers: {validation.missingAnswers.length}
                    </li>
                    <li>
                      Wrong round sizes: {validation.wrongRoundSizes.length}
                      {validation.wrongRoundSizes.length > 0 ? (
                        <ul className="mt-1 list-disc pl-5">
                          {validation.wrongRoundSizes.map((issue) => (
                            <li key={issue.roundNumber}>
                              Round {issue.roundNumber} ({issue.roundTitle}):{" "}
                              {issue.actual}, expected {issue.expected}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                    <li>
                      Parsing warnings:{" "}
                      {validation.warnings.length > 0
                        ? validation.warnings.join("; ")
                        : "None"}
                    </li>
                  </ul>
                </section>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <BrandButton
                  type="button"
                  leftIcon={<FaSave />}
                  onClick={() => void createDraftDeck()}
                  loading={saving}
                  disabled={saving}
                >
                  Create Draft Deck
                </BrandButton>
                {saveError ? (
                  <p className="text-sm font-semibold text-red-700">
                    {saveError}
                  </p>
                ) : null}
                {draftDeck ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-green-700">
                      Draft “{draftDeck.title}” saved to Supabase.
                    </p>
                    <BrandButton
                      href={`/admin/host-slides/${draftDeck.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Open Draft Editor
                    </BrandButton>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
