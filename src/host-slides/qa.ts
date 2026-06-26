import type {
  HostDeck,
  HostQaFinding,
  HostQaFindingCategory,
  HostQaFindingSeverity,
  HostQaFindingSource,
  HostQaSuggestedFix,
} from "@/src/host-slides/types";
import {
  HOST_QA_ALLOWED_TERMS,
  HOST_QA_CONFIDENT_SPELLING_FIXES,
  HOST_QA_REVIEW_ONLY_SPELLINGS,
} from "@/src/host-slides/qaDictionary";

type FindingDraft = {
  targetType: HostQaFinding["targetType"];
  targetId?: string;
  roundNumber?: number;
  questionNumber?: number;
  severity: HostQaFindingSeverity;
  category: HostQaFindingCategory;
  source?: HostQaFindingSource;
  message: string;
  suggestedFix?: HostQaSuggestedFix;
};

const OPEN_QA_STATUSES = new Set<HostQaFinding["status"]>([
  "open",
  "needs_review",
]);

function normalizeForDuplicate(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function findingId(deckId: string, draft: FindingDraft): string {
  return [
    "qa",
    deckId,
    draft.category,
    draft.targetType,
    draft.targetId ?? "deck",
    draft.roundNumber ? `r${draft.roundNumber}` : null,
    draft.questionNumber ? `q${draft.questionNumber}` : null,
    slug(draft.message),
  ]
    .filter((part): part is string => Boolean(part))
    .join("-");
}

function makeFinding(
  deckId: string,
  draft: FindingDraft,
  existing: Map<string, HostQaFinding>,
  now: string,
): HostQaFinding {
  const id = findingId(deckId, draft);
  const previous = existing.get(id);
  return {
    id,
    deckId,
    ...draft,
    source: draft.source ?? "LOCAL",
    status: previous?.status ?? "open",
    createdAt: previous?.createdAt ?? now,
    updatedAt: previous?.updatedAt ?? now,
  };
}

function textReplacementFix(
  field: HostQaSuggestedFix["field"],
  value: string,
  description: string,
): HostQaSuggestedFix {
  return { type: "replace_text", field, value, description };
}

const ALLOWED_TERMS = new Set<string>(HOST_QA_ALLOWED_TERMS);
const REVIEW_ONLY_SPELLINGS = new Set<string>(HOST_QA_REVIEW_ONLY_SPELLINGS);

function replaceWord(value: string, word: string, replacement: string): string {
  return value.replace(new RegExp(`\\b${word}\\b`, "g"), replacement);
}

function maybeTextReplacementFix(
  field: HostQaSuggestedFix["field"] | undefined,
  value: string,
  description: string,
): HostQaSuggestedFix | undefined {
  return field ? textReplacementFix(field, value, description) : undefined;
}

function textPatternFindings({
  value,
  field,
  targetType,
  targetId,
  roundNumber,
  questionNumber,
  locationOverride,
}: {
  value: string;
  field?: HostQaSuggestedFix["field"];
  targetType: HostQaFinding["targetType"];
  targetId?: string;
  roundNumber?: number;
  questionNumber?: number;
  locationOverride?: string;
}): FindingDraft[] {
  const findings: FindingDraft[] = [];
  const location = locationOverride ?? (questionNumber
    ? `Round ${roundNumber} Question ${questionNumber}`
    : `Round ${roundNumber}`);

  Object.entries(HOST_QA_CONFIDENT_SPELLING_FIXES).forEach(
    ([misspelling, replacement]) => {
      if (!new RegExp(`\\b${misspelling}\\b`).test(value)) return;
      findings.push({
        targetType,
        targetId,
        roundNumber,
        questionNumber,
        severity: "warning",
        category: "spelling",
        message: `${location} contains likely misspelling "${misspelling}".`,
        suggestedFix: maybeTextReplacementFix(
          field,
          replaceWord(value, misspelling, replacement),
          `Replace "${misspelling}" with "${replacement}".`,
        ),
      });
    },
  );

  value.match(/\b[A-Za-z][A-Za-z'-]*\b/g)?.forEach((word) => {
    if (ALLOWED_TERMS.has(word)) return;
    if (/^[A-Z]{2,}$/.test(word) || /^[A-Z]\d$/.test(word)) return;
    if (!REVIEW_ONLY_SPELLINGS.has(word.toLowerCase())) return;
    findings.push({
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity: "warning",
      category: "spelling",
      message: `${location} contains possible misspelling "${word}".`,
    });
  });

  if (value.includes("  ")) {
    findings.push({
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity: "info",
      category: "punctuation",
      message: `${location} contains double spaces.`,
      suggestedFix: maybeTextReplacementFix(
        field,
        value.replace(/ {2,}/g, " "),
        "Collapse repeated spaces.",
      ),
    });
  }

  if (/\s\?/.test(value)) {
    findings.push({
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity: "warning",
      category: "punctuation",
      message: `${location} has a space before a question mark.`,
      suggestedFix: maybeTextReplacementFix(
        field,
        value.replace(/\s+\?/g, "?"),
        "Remove the space before the question mark.",
      ),
    });
  }

  const repeatedWordMatch = value.match(/\b([A-Za-z][A-Za-z'-]*)\s+\1\b/i);
  if (repeatedWordMatch) {
    findings.push({
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity: "warning",
      category: "grammar",
      message: `${location} repeats the word "${repeatedWordMatch[1]}".`,
      suggestedFix: maybeTextReplacementFix(
        field,
        value.replace(/\b([A-Za-z][A-Za-z'-]*)\s+\1\b/gi, "$1"),
        "Remove the repeated word.",
      ),
    });
  }

  const firstLetterMatch = value.match(/^(\s*)([a-z])(\S*)/);
  if (firstLetterMatch) {
    const fixed =
      firstLetterMatch[1] +
      firstLetterMatch[2].toUpperCase() +
      firstLetterMatch[3] +
      value.slice(firstLetterMatch[0].length);
    findings.push({
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity: "info",
      category: "grammar",
      message: `${location} starts with a lowercase letter.`,
      suggestedFix: maybeTextReplacementFix(
        field,
        fixed,
        "Capitalise the first letter.",
      ),
    });
  }

  return findings;
}

export function runHostDeckQa(
  deck: HostDeck,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): HostQaFinding[] {
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const drafts: FindingDraft[] = [];
  const questionsByText = new Map<string, FindingDraft[]>();
  const answersByText = new Map<string, FindingDraft[]>();

  deck.rounds.forEach((round, roundIndex) => {
    const roundNumber = roundIndex + 1;
    drafts.push(
      ...textPatternFindings({
        value: round.title,
        field: "round_title",
        targetType: "round",
        targetId: round.id,
        roundNumber,
      }),
    );

    round.questions.forEach((question, questionIndex) => {
      const questionNumber = questionIndex + 1;
      const location = `Round ${roundNumber} Question ${questionNumber}`;

      if (!question.prompt.trim()) {
        drafts.push({
          targetType: "question",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "error",
          category: "grammar",
          message: `${location} has empty question text.`,
        });
      }

      if (!question.answer.trim()) {
        drafts.push({
          targetType: "answer",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "error",
          category: "missing_answer",
          message: `${location} has empty answer text.`,
        });
      }

      if (question.answer.trim().endsWith("?")) {
        drafts.push({
          targetType: "answer",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning",
          category: "suspicious_answer",
          message: `${location} answer ends with a question mark.`,
        });
      }

      if (
        question.imagePlaceholder &&
        !question.imageUrl &&
        !question.imageStoragePath
      ) {
        drafts.push({
          targetType: "image",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "error",
          category: "picture_missing",
          message: `${location} is marked as a picture question but has no image.`,
        });
      }

      drafts.push(
        ...textPatternFindings({
          value: question.prompt,
          field: "question",
          targetType: "question",
          targetId: question.id,
          roundNumber,
          questionNumber,
        }),
        ...textPatternFindings({
          value: question.answer,
          field: "answer",
          targetType: "answer",
          targetId: question.id,
          roundNumber,
          questionNumber,
        }),
      );

      const normalizedQuestion = normalizeForDuplicate(question.prompt);
      if (normalizedQuestion) {
        const draft = {
          targetType: "question" as const,
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning" as const,
          category: "duplicate_question" as const,
          message: `${location} duplicates another question.`,
        };
        questionsByText.set(normalizedQuestion, [
          ...(questionsByText.get(normalizedQuestion) ?? []),
          draft,
        ]);
      }

      const normalizedAnswer = normalizeForDuplicate(question.answer);
      if (normalizedAnswer) {
        const draft = {
          targetType: "answer" as const,
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning" as const,
          category: "duplicate_answer" as const,
          message: `${location} duplicates another answer.`,
        };
        answersByText.set(normalizedAnswer, [
          ...(answersByText.get(normalizedAnswer) ?? []),
          draft,
        ]);
      }
    });

    const questionTen = round.questions[9];
    if (
      questionTen &&
      /connections?/i.test(round.title) &&
      !/\blinks?\b/i.test(questionTen.prompt)
    ) {
      drafts.push({
        targetType: "question",
        targetId: questionTen.id,
        roundNumber,
        questionNumber: 10,
        severity: "info",
        category: "connection_round",
        message: `Round ${roundNumber} Question 10 may need to ask for the link.`,
      });
    }
  });

  for (const duplicates of questionsByText.values()) {
    if (duplicates.length > 1) drafts.push(...duplicates);
  }
  for (const duplicates of answersByText.values()) {
    if (duplicates.length > 1) drafts.push(...duplicates);
  }

  if (deck.quizType === "saturday") {
    deck.dingbats?.items.forEach((item) => {
      if (!item.answer.trim()) {
        drafts.push({
          targetType: "answer",
          targetId: `dingbat-${item.position}`,
          severity: "error",
          category: "missing_answer",
          message: `Dingbat ${item.position} has no answer.`,
        });
      }
      if (!item.imageUrl && !item.imageStoragePath) {
        drafts.push({
          targetType: "image",
          targetId: `dingbat-${item.position}`,
          severity: "error",
          category: "picture_missing",
          message: `Dingbat ${item.position} has no image.`,
        });
      }
    });
  }

  const showScreens = deck.showScreens;
  if (showScreens) {
    Object.entries(showScreens).forEach(([screenKey, screen]) => {
      const location = `Show screen ${screenKey}`;
      drafts.push(
        ...textPatternFindings({
          value: screen.titleText,
          targetType: "show_screen",
          targetId: screenKey,
          locationOverride: `${location} title`,
        }),
        ...textPatternFindings({
          value: screen.bodyText,
          targetType: "show_screen",
          targetId: screenKey,
          locationOverride: `${location} body`,
        }),
        ...textPatternFindings({
          value: screen.tickerText,
          targetType: "show_screen",
          targetId: screenKey,
          locationOverride: `${location} ticker`,
        }),
      );
    });
  }

  deck.showOrder?.forEach((block) => {
    if (
      block.type !== "pre_break" &&
      block.type !== "break_countdown" &&
      block.type !== "post_break"
    ) {
      return;
    }
    const settings = block.config.textSettings;
    if (!settings) return;
    drafts.push(
      ...textPatternFindings({
        value: settings.titleText,
        targetType: "show_screen",
        targetId: block.id,
        locationOverride: `${block.label} title`,
      }),
      ...textPatternFindings({
        value: settings.bodyText,
        targetType: "show_screen",
        targetId: block.id,
        locationOverride: `${block.label} body`,
      }),
      ...textPatternFindings({
        value: settings.tickerText,
        targetType: "show_screen",
        targetId: block.id,
        locationOverride: `${block.label} ticker`,
      }),
    );
  });

  return drafts.map((draft) => makeFinding(deck.id, draft, existing, now));
}

export function isOpenQaFinding(finding: HostQaFinding): boolean {
  return OPEN_QA_STATUSES.has(finding.status);
}

export function applyHostQaFix(
  deck: HostDeck,
  findingId: string,
  now = new Date().toISOString(),
): HostDeck {
  const finding = deck.qaFindings?.find((candidate) => candidate.id === findingId);
  if (!finding?.suggestedFix || finding.suggestedFix.type !== "replace_text") {
    return deck;
  }

  const next = structuredClone(deck);
  const replacement = finding.suggestedFix.value;
  if (finding.suggestedFix.field === "round_title" && finding.roundNumber) {
    const round = next.rounds[finding.roundNumber - 1];
    if (round) round.title = replacement;
  } else if (
    (finding.suggestedFix.field === "question" ||
      finding.suggestedFix.field === "answer") &&
    finding.roundNumber &&
    finding.questionNumber
  ) {
    const question =
      next.rounds[finding.roundNumber - 1]?.questions[finding.questionNumber - 1];
    if (question && finding.suggestedFix.field === "question") {
      question.prompt = replacement;
    } else if (question) {
      question.answer = replacement;
    }
  }

  next.qaFindings = next.qaFindings?.map((candidate) =>
    candidate.id === findingId
      ? { ...candidate, status: "fixed", updatedAt: now }
      : candidate,
  );
  return next;
}
