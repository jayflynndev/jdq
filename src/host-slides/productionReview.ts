import { runHostDeckQa } from "@/src/host-slides/qa";
import type {
  HostDeck,
  HostImageSuggestion,
  HostProductionReviewStageId,
  HostProductionReviewStageResult,
  HostQaFinding,
  HostQaFindingCategory,
  HostQaFindingSeverity,
  HostQaSuggestedFix,
} from "@/src/host-slides/types";

export const PRODUCTION_REVIEW_VERSION = "production-review-v1";

export const LANGUAGE_REVIEW_SYSTEM_INSTRUCTIONS = [
  "Review wording only.",
  "Do NOT verify facts.",
  "Do NOT search the web.",
  "Do NOT invent facts.",
  "Do NOT rewrite quiz style.",
  "Prefer preserving Jay's tone.",
  "If uncertain, return no finding.",
].join(" ");

export interface LanguageReviewer {
  reviewLanguage(
    request: LanguageReviewRequest,
  ): Promise<LanguageReviewFinding[]>;
}

export interface FactReviewer {
  reviewFacts(request: FactReviewRequest): Promise<ProviderReviewResult<FactReviewFinding>>;
}

export interface ImageSuggestionProvider {
  suggestImages(
    request: ImageSuggestionRequest,
  ): Promise<ProviderReviewResult<ImageSuggestionFinding>>;
}

export interface ConnectionReviewer {
  reviewConnections(
    request: ConnectionReviewRequest,
  ): Promise<ProviderReviewResult<ConnectionReviewFinding>>;
}

export type ProductionReviewResult = {
  stages: HostProductionReviewStageResult[];
  findings: HostQaFinding[];
  durationMs: number;
  completedAt: string;
};

export type LanguageReviewField =
  | "round_title"
  | "question"
  | "answer"
  | "show_screen_text";

export type LanguageReviewItem = {
  id: string;
  field: LanguageReviewField;
  text: string;
  location: string;
  targetType: HostQaFinding["targetType"];
  targetId: string;
  roundNumber?: number;
  questionNumber?: number;
};

export type LanguageReviewRequest = {
  deckId: string;
  quizTitle: string;
  quizType: HostDeck["quizType"];
  instructions: string;
  items: LanguageReviewItem[];
};

export type LanguageReviewFinding = {
  itemId: string;
  severity: Extract<HostQaFindingSeverity, "info" | "warning">;
  category: Extract<
    HostQaFindingCategory,
    "grammar" | "spelling" | "punctuation"
  >;
  message: string;
  suggestedText?: string;
};

export type ProductionReviewOptions = {
  languageReviewer?: LanguageReviewer;
  factReviewer?: FactReviewer;
  imageSuggestionProvider?: ImageSuggestionProvider;
  connectionReviewer?: ConnectionReviewer;
};

export type ProviderReviewResult<TFinding> = {
  status: "completed" | "unavailable";
  findings: TFinding[];
  message?: string;
};

export type FactReviewItem = {
  id: string;
  roundNumber: number;
  questionNumber: number;
  question: string;
  answer: string;
  roundTitle: string;
  pictureRequired: boolean;
};

export type FactReviewRequest = {
  deckId: string;
  quizTitle: string;
  quizType: HostDeck["quizType"];
  items: FactReviewItem[];
};

export type FactReviewFinding = {
  itemId: string;
  severity: Extract<HostQaFindingSeverity, "info" | "warning" | "error">;
  message: string;
  confidence: number;
};

export type ImageSuggestionItem = {
  id: string;
  roundNumber: number;
  questionNumber: number;
  question: string;
  answer: string;
};

export type ImageSuggestionRequest = {
  deckId: string;
  quizTitle: string;
  quizType: HostDeck["quizType"];
  items: ImageSuggestionItem[];
};

export type ImageSuggestionFinding = {
  itemId: string;
  searchTerm: string;
  imageType: string;
  orientation: HostImageSuggestion["orientation"];
  crop: string;
};

export type ConnectionReviewItem = {
  id: string;
  roundNumber: number;
  questionNumber: number;
  question: string;
  answer: string;
};

export type ConnectionReviewRequest = {
  deckId: string;
  quizTitle: string;
  quizType: HostDeck["quizType"];
  roundNumber: number;
  roundTitle: string;
  items: ConnectionReviewItem[];
};

export type ConnectionReviewFinding = {
  itemId: string;
  severity: Extract<HostQaFindingSeverity, "info" | "warning" | "error">;
  message: string;
  confidence: number;
};

type PresenterFindingDraft = {
  targetType: HostQaFinding["targetType"];
  targetId?: string;
  roundNumber?: number;
  questionNumber?: number;
  severity: HostQaFindingSeverity;
  category: HostQaFindingCategory;
  message: string;
};

type StageDefinition = {
  id: HostProductionReviewStageId;
  label: string;
};

type StageRunOutput = {
  stage: HostProductionReviewStageResult;
  findings: HostQaFinding[];
};

class NoopLanguageReviewer implements LanguageReviewer {
  async reviewLanguage(): Promise<LanguageReviewFinding[]> {
    return [];
  }
}

const DEFAULT_LANGUAGE_REVIEWER = new NoopLanguageReviewer();

class UnavailableFactReviewer implements FactReviewer {
  async reviewFacts(): Promise<ProviderReviewResult<FactReviewFinding>> {
    return { status: "unavailable", findings: [], message: "Unavailable" };
  }
}

class UnavailableImageSuggestionProvider implements ImageSuggestionProvider {
  async suggestImages(): Promise<ProviderReviewResult<ImageSuggestionFinding>> {
    return { status: "unavailable", findings: [], message: "Unavailable" };
  }
}

class UnavailableConnectionReviewer implements ConnectionReviewer {
  async reviewConnections(): Promise<ProviderReviewResult<ConnectionReviewFinding>> {
    return { status: "unavailable", findings: [], message: "Unavailable" };
  }
}

const DEFAULT_FACT_REVIEWER = new UnavailableFactReviewer();
const DEFAULT_IMAGE_SUGGESTION_PROVIDER =
  new UnavailableImageSuggestionProvider();
const DEFAULT_CONNECTION_REVIEWER = new UnavailableConnectionReviewer();

function isLanguageReviewFinding(value: unknown): value is LanguageReviewFinding {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.itemId === "string" &&
    (candidate.severity === "info" || candidate.severity === "warning") &&
    (candidate.category === "grammar" ||
      candidate.category === "spelling" ||
      candidate.category === "punctuation") &&
    typeof candidate.message === "string" &&
    (candidate.suggestedText === undefined ||
      typeof candidate.suggestedText === "string")
  );
}

function parseLanguageReviewResponse(value: unknown): LanguageReviewFinding[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }
  const findings = (value as Record<string, unknown>).findings;
  if (!Array.isArray(findings)) return [];
  return findings.filter(isLanguageReviewFinding);
}

function isProviderStatus(value: unknown): value is ProviderReviewResult<unknown>["status"] {
  return value === "completed" || value === "unavailable";
}

function parseProviderResult<TFinding>(
  value: unknown,
  isFinding: (candidate: unknown) => candidate is TFinding,
): ProviderReviewResult<TFinding> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { status: "unavailable", findings: [], message: "Unavailable" };
  }
  const record = value as Record<string, unknown>;
  const findings = Array.isArray(record.findings)
    ? record.findings.filter(isFinding)
    : [];
  return {
    status: isProviderStatus(record.status) ? record.status : "completed",
    findings,
    ...(typeof record.message === "string" ? { message: record.message } : {}),
  };
}

function isFactReviewFinding(value: unknown): value is FactReviewFinding {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.itemId === "string" &&
    (candidate.severity === "info" ||
      candidate.severity === "warning" ||
      candidate.severity === "error") &&
    typeof candidate.message === "string" &&
    typeof candidate.confidence === "number"
  );
}

function isImageSuggestionFinding(
  value: unknown,
): value is ImageSuggestionFinding {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.itemId === "string" &&
    typeof candidate.searchTerm === "string" &&
    typeof candidate.imageType === "string" &&
    typeof candidate.crop === "string" &&
    (candidate.orientation === "portrait" ||
      candidate.orientation === "landscape" ||
      candidate.orientation === "square" ||
      candidate.orientation === "any")
  );
}

function isConnectionReviewFinding(
  value: unknown,
): value is ConnectionReviewFinding {
  return isFactReviewFinding(value);
}

export class HttpLanguageReviewer implements LanguageReviewer {
  constructor(private readonly endpoint = "/api/host-slides/language-review") {}

  async reviewLanguage(
    request: LanguageReviewRequest,
  ): Promise<LanguageReviewFinding[]> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      return [];
    }
    return parseLanguageReviewResponse(await response.json());
  }
}

export class HttpFactReviewer implements FactReviewer {
  constructor(private readonly endpoint = "/api/host-slides/fact-review") {}

  async reviewFacts(
    request: FactReviewRequest,
  ): Promise<ProviderReviewResult<FactReviewFinding>> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      return { status: "unavailable", findings: [], message: "Unavailable" };
    }
    return parseProviderResult(await response.json(), isFactReviewFinding);
  }
}

export class HttpImageSuggestionProvider implements ImageSuggestionProvider {
  constructor(
    private readonly endpoint = "/api/host-slides/image-suggestions",
  ) {}

  async suggestImages(
    request: ImageSuggestionRequest,
  ): Promise<ProviderReviewResult<ImageSuggestionFinding>> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      return { status: "unavailable", findings: [], message: "Unavailable" };
    }
    return parseProviderResult(await response.json(), isImageSuggestionFinding);
  }
}

export class HttpConnectionReviewer implements ConnectionReviewer {
  constructor(
    private readonly endpoint = "/api/host-slides/connection-review",
  ) {}

  async reviewConnections(
    request: ConnectionReviewRequest,
  ): Promise<ProviderReviewResult<ConnectionReviewFinding>> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      return { status: "unavailable", findings: [], message: "Unavailable" };
    }
    return parseProviderResult(await response.json(), isConnectionReviewFinding);
  }
}

export const PRODUCTION_REVIEW_STAGES: readonly StageDefinition[] = [
  { id: "structural_qa", label: "Structural QA" },
  { id: "local_proofing", label: "Local Proofing" },
  { id: "presenter_review", label: "Presenter Review" },
  { id: "language_review", label: "AI Language Review" },
  { id: "fact_review", label: "AI Fact Review" },
  { id: "image_suggestions", label: "AI Image Suggestions" },
  { id: "connection_review", label: "AI Connection Review" },
] as const;

function stageLabel(stageId: HostProductionReviewStageId): string {
  return (
    PRODUCTION_REVIEW_STAGES.find((stage) => stage.id === stageId)?.label ??
    stageId
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function presenterFindingId(deckId: string, draft: PresenterFindingDraft): string {
  return [
    "qa",
    deckId,
    "presenter",
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

function languageFindingId(
  deckId: string,
  item: LanguageReviewItem,
  finding: LanguageReviewFinding,
): string {
  return [
    "qa",
    deckId,
    "language",
    finding.category,
    item.targetType,
    item.targetId,
    item.roundNumber ? `r${item.roundNumber}` : null,
    item.questionNumber ? `q${item.questionNumber}` : null,
    slug(finding.message),
  ]
    .filter((part): part is string => Boolean(part))
    .join("-");
}

function aiFindingId(
  deckId: string,
  source: HostQaFinding["source"],
  category: HostQaFindingCategory,
  targetId: string,
  message: string,
): string {
  return ["qa", deckId, source.toLowerCase(), category, targetId, slug(message)]
    .filter((part): part is string => Boolean(part))
    .join("-");
}

function makePresenterFinding(
  deckId: string,
  draft: PresenterFindingDraft,
  existing: Map<string, HostQaFinding>,
  now: string,
): HostQaFinding {
  const id = presenterFindingId(deckId, draft);
  const previous = existing.get(id);
  return {
    id,
    deckId,
    ...draft,
    source: "AI_PRESENTER",
    status: previous?.status ?? "open",
    createdAt: previous?.createdAt ?? now,
    updatedAt: previous?.updatedAt ?? now,
  };
}

function hasPictureQuestion(round: HostDeck["rounds"][number]): boolean {
  return round.questions.some(
    (question) =>
      Boolean(question.imagePlaceholder) ||
      Boolean(question.imageStoragePath) ||
      Boolean(question.imageUrl),
  );
}

function makeLanguageSuggestedFix(
  item: LanguageReviewItem,
  suggestedText: string | undefined,
): HostQaSuggestedFix | undefined {
  if (!suggestedText) return undefined;
  if (
    item.field !== "round_title" &&
    item.field !== "question" &&
    item.field !== "answer"
  ) {
    return undefined;
  }
  return {
    type: "replace_text",
    field: item.field,
    value: suggestedText,
    description: `Replace with: ${suggestedText}`,
  };
}

function collectLanguageReviewItems(deck: HostDeck): LanguageReviewItem[] {
  const items: LanguageReviewItem[] = [];
  deck.rounds.forEach((round, roundIndex) => {
    const roundNumber = roundIndex + 1;
    items.push({
      id: `round-${round.id}-title`,
      field: "round_title",
      text: round.title,
      location: `Round ${roundNumber} title`,
      targetType: "round",
      targetId: round.id,
      roundNumber,
    });

    round.questions.forEach((question, questionIndex) => {
      const questionNumber = questionIndex + 1;
      items.push(
        {
          id: `question-${question.id}-prompt`,
          field: "question",
          text: question.prompt,
          location: `Round ${roundNumber} Question ${questionNumber}`,
          targetType: "question",
          targetId: question.id,
          roundNumber,
          questionNumber,
        },
        {
          id: `question-${question.id}-answer`,
          field: "answer",
          text: question.answer,
          location: `Round ${roundNumber} Question ${questionNumber} answer`,
          targetType: "answer",
          targetId: question.id,
          roundNumber,
          questionNumber,
        },
      );
    });
  });

  if (deck.showScreens) {
    Object.entries(deck.showScreens).forEach(([screenKey, screen]) => {
      items.push(
        {
          id: `show-screen-${screenKey}-title`,
          field: "show_screen_text",
          text: screen.titleText,
          location: `Show screen ${screenKey} title`,
          targetType: "show_screen",
          targetId: screenKey,
        },
        {
          id: `show-screen-${screenKey}-body`,
          field: "show_screen_text",
          text: screen.bodyText,
          location: `Show screen ${screenKey} body`,
          targetType: "show_screen",
          targetId: screenKey,
        },
        {
          id: `show-screen-${screenKey}-ticker`,
          field: "show_screen_text",
          text: screen.tickerText,
          location: `Show screen ${screenKey} ticker`,
          targetType: "show_screen",
          targetId: screenKey,
        },
      );
    });
  }

  return items.filter((item) => item.text.trim().length > 0);
}

function makeLanguageReviewRequest(deck: HostDeck): LanguageReviewRequest {
  return {
    deckId: deck.id,
    quizTitle: deck.title,
    quizType: deck.quizType,
    instructions: LANGUAGE_REVIEW_SYSTEM_INSTRUCTIONS,
    items: collectLanguageReviewItems(deck),
  };
}

function makeFactReviewRequest(deck: HostDeck): FactReviewRequest {
  return {
    deckId: deck.id,
    quizTitle: deck.title,
    quizType: deck.quizType,
    items: deck.rounds.flatMap((round, roundIndex) =>
      round.questions.map((question, questionIndex) => ({
        id: question.id,
        roundNumber: roundIndex + 1,
        questionNumber: questionIndex + 1,
        question: question.prompt,
        answer: question.answer,
        roundTitle: round.title,
        pictureRequired: Boolean(
          question.imagePlaceholder ||
            question.imageStoragePath ||
            question.imageUrl,
        ),
      })),
    ),
  };
}

function makeImageSuggestionRequest(deck: HostDeck): ImageSuggestionRequest {
  return {
    deckId: deck.id,
    quizTitle: deck.title,
    quizType: deck.quizType,
    items: deck.rounds.flatMap((round, roundIndex) =>
      round.questions.flatMap((question, questionIndex) => {
        const pictureRequired = Boolean(question.imagePlaceholder);
        const hasImage = Boolean(question.imageStoragePath || question.imageUrl);
        if (!pictureRequired || hasImage) return [];
        return [
          {
            id: question.id,
            roundNumber: roundIndex + 1,
            questionNumber: questionIndex + 1,
            question: question.prompt,
            answer: question.answer,
          },
        ];
      }),
    ),
  };
}

function makeConnectionReviewRequest(
  deck: HostDeck,
): ConnectionReviewRequest | null {
  const round = deck.rounds[3];
  if (!round) return null;
  return {
    deckId: deck.id,
    quizTitle: deck.title,
    quizType: deck.quizType,
    roundNumber: 4,
    roundTitle: round.title,
    items: round.questions.map((question, questionIndex) => ({
      id: question.id,
      roundNumber: 4,
      questionNumber: questionIndex + 1,
      question: question.prompt,
      answer: question.answer,
    })),
  };
}

export async function runLanguageReview(
  deck: HostDeck,
  reviewer: LanguageReviewer = DEFAULT_LANGUAGE_REVIEWER,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): Promise<HostQaFinding[]> {
  const request = makeLanguageReviewRequest(deck);
  const itemById = new Map(request.items.map((item) => [item.id, item]));
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const providerFindings = await reviewer.reviewLanguage(request);

  return providerFindings.flatMap((finding): HostQaFinding[] => {
    const item = itemById.get(finding.itemId);
    if (!item) return [];
    const id = languageFindingId(deck.id, item, finding);
    const previous = existing.get(id);
    const suggestedFix = makeLanguageSuggestedFix(item, finding.suggestedText);
    return [
      {
        id,
        deckId: deck.id,
        targetType: item.targetType,
        targetId: item.targetId,
        ...(item.roundNumber ? { roundNumber: item.roundNumber } : {}),
        ...(item.questionNumber ? { questionNumber: item.questionNumber } : {}),
        severity: finding.severity,
        category: finding.category,
        source: "AI_LANGUAGE",
        message: `${item.location}: ${finding.message}`,
        ...(suggestedFix ? { suggestedFix } : {}),
        status: previous?.status ?? "open",
        createdAt: previous?.createdAt ?? now,
        updatedAt: previous?.updatedAt ?? now,
      },
    ];
  });
}

export async function runFactReview(
  deck: HostDeck,
  reviewer: FactReviewer = DEFAULT_FACT_REVIEWER,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): Promise<ProviderReviewResult<HostQaFinding>> {
  const request = makeFactReviewRequest(deck);
  const itemById = new Map(request.items.map((item) => [item.id, item]));
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const result = await reviewer.reviewFacts(request);
  const findings = result.findings.flatMap((finding): HostQaFinding[] => {
    const item = itemById.get(finding.itemId);
    if (!item) return [];
    const id = aiFindingId(
      deck.id,
      "AI_FACT",
      "fact_review",
      item.id,
      finding.message,
    );
    const previous = existing.get(id);
    return [
      {
        id,
        deckId: deck.id,
        targetType: "answer",
        targetId: item.id,
        roundNumber: item.roundNumber,
        questionNumber: item.questionNumber,
        severity: finding.severity,
        category: "fact_review",
        source: "AI_FACT",
        message: `Round ${item.roundNumber} Question ${item.questionNumber}: ${finding.message}`,
        confidence: finding.confidence,
        status: previous?.status ?? "open",
        createdAt: previous?.createdAt ?? now,
        updatedAt: previous?.updatedAt ?? now,
      },
    ];
  });
  return { ...result, findings };
}

export async function runImageSuggestionReview(
  deck: HostDeck,
  provider: ImageSuggestionProvider = DEFAULT_IMAGE_SUGGESTION_PROVIDER,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): Promise<ProviderReviewResult<HostQaFinding>> {
  const request = makeImageSuggestionRequest(deck);
  const itemById = new Map(request.items.map((item) => [item.id, item]));
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const result = await provider.suggestImages(request);
  const findings = result.findings.flatMap((finding): HostQaFinding[] => {
    const item = itemById.get(finding.itemId);
    if (!item) return [];
    const message = `Suggested Search: ${finding.searchTerm}`;
    const id = aiFindingId(
      deck.id,
      "AI_IMAGE",
      "image_suggestion",
      item.id,
      message,
    );
    const previous = existing.get(id);
    return [
      {
        id,
        deckId: deck.id,
        targetType: "image",
        targetId: item.id,
        roundNumber: item.roundNumber,
        questionNumber: item.questionNumber,
        severity: "info",
        category: "image_suggestion",
        source: "AI_IMAGE",
        message,
        imageSuggestion: {
          searchTerm: finding.searchTerm,
          imageType: finding.imageType,
          orientation: finding.orientation,
          crop: finding.crop,
        },
        status: previous?.status ?? "open",
        createdAt: previous?.createdAt ?? now,
        updatedAt: previous?.updatedAt ?? now,
      },
    ];
  });
  return { ...result, findings };
}

export async function runConnectionReview(
  deck: HostDeck,
  reviewer: ConnectionReviewer = DEFAULT_CONNECTION_REVIEWER,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): Promise<ProviderReviewResult<HostQaFinding>> {
  const request = makeConnectionReviewRequest(deck);
  if (!request) return { status: "completed", findings: [] };
  const itemById = new Map(request.items.map((item) => [item.id, item]));
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const result = await reviewer.reviewConnections(request);
  const findings = result.findings.flatMap((finding): HostQaFinding[] => {
    const item = itemById.get(finding.itemId);
    if (!item) return [];
    const id = aiFindingId(
      deck.id,
      "AI_CONNECTION",
      "connection_round",
      item.id,
      finding.message,
    );
    const previous = existing.get(id);
    return [
      {
        id,
        deckId: deck.id,
        targetType: "question",
        targetId: item.id,
        roundNumber: item.roundNumber,
        questionNumber: item.questionNumber,
        severity: finding.severity,
        category: "connection_round",
        source: "AI_CONNECTION",
        message: `Round ${item.roundNumber} Question ${item.questionNumber}: ${finding.message}`,
        confidence: finding.confidence,
        status: previous?.status ?? "open",
        createdAt: previous?.createdAt ?? now,
        updatedAt: previous?.updatedAt ?? now,
      },
    ];
  });
  return { ...result, findings };
}

export function runPresenterReview(
  deck: HostDeck,
  existingFindings: readonly HostQaFinding[] = deck.qaFindings ?? [],
  now = new Date().toISOString(),
): HostQaFinding[] {
  const existing = new Map(
    existingFindings.map((finding) => [finding.id, finding]),
  );
  const drafts: PresenterFindingDraft[] = [];

  deck.rounds.forEach((round, roundIndex) => {
    const roundNumber = roundIndex + 1;
    if (round.title.trim().length > 34) {
      drafts.push({
        targetType: "round",
        targetId: round.id,
        roundNumber,
        severity: "warning",
        category: "show_flow",
        message: `Round ${roundNumber} title may wrap on presenter slides.`,
      });
    }

    const longAnswers = round.questions.filter(
      (question) => question.answer.trim().length > 55,
    );
    if (longAnswers.length >= 3) {
      drafts.push({
        targetType: "round",
        targetId: round.id,
        roundNumber,
        severity: "warning",
        category: "show_flow",
        message: `Round ${roundNumber} has ${longAnswers.length} long answers that may be hard to reveal cleanly.`,
      });
    }

    round.questions.forEach((question, questionIndex) => {
      const questionNumber = questionIndex + 1;
      const location = `Round ${roundNumber} Question ${questionNumber}`;
      if (question.prompt.trim().length > 180) {
        drafts.push({
          targetType: "question",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning",
          category: "show_flow",
          message: `${location} question text may be too long for comfortable presenting.`,
        });
      }
      if (question.answer.trim().length > 90) {
        drafts.push({
          targetType: "answer",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning",
          category: "show_flow",
          message: `${location} answer may be too long for a clean reveal.`,
        });
      }
      if ((question.imagePlaceholder?.trim().length ?? 0) > 90) {
        drafts.push({
          targetType: "image",
          targetId: question.id,
          roundNumber,
          questionNumber,
          severity: "warning",
          category: "show_flow",
          message: `${location} picture caption may be too long for presenter notes.`,
        });
      }
    });
  });

  deck.rounds.forEach((round, roundIndex) => {
    const nextRound = deck.rounds[roundIndex + 1];
    if (!nextRound) return;
    if (hasPictureQuestion(round) && hasPictureQuestion(nextRound)) {
      drafts.push({
        targetType: "deck",
        severity: "warning",
        category: "show_flow",
        message: `Rounds ${roundIndex + 1} and ${roundIndex + 2} both include picture questions; check the presenter flow.`,
      });
    }
  });

  return drafts.map((draft) =>
    makePresenterFinding(deck.id, draft, existing, now),
  );
}

function stageResult(
  id: HostProductionReviewStageId,
  status: HostProductionReviewStageResult["status"],
  findingsCount: number,
  durationMs: number,
  completedAt: string,
  message?: string,
): HostProductionReviewStageResult {
  return {
    id,
    label: stageLabel(id),
    status,
    findingsCount,
    durationMs,
    completedAt,
    ...(message ? { message } : {}),
  };
}

const LOCAL_PROOFING_CATEGORIES = new Set<HostQaFindingCategory>([
  "spelling",
  "grammar",
  "punctuation",
]);

function runStructuralQa(
  deck: HostDeck,
  now: string,
): HostQaFinding[] {
  return runHostDeckQa(deck, deck.qaFindings ?? [], now).filter(
    (finding) => !LOCAL_PROOFING_CATEGORIES.has(finding.category),
  );
}

function runLocalProofing(
  deck: HostDeck,
  now: string,
): HostQaFinding[] {
  return runHostDeckQa(deck, deck.qaFindings ?? [], now).filter((finding) =>
    LOCAL_PROOFING_CATEGORIES.has(finding.category),
  );
}

export async function runProductionReviewStage(
  deck: HostDeck,
  stageId: HostProductionReviewStageId,
  now = new Date().toISOString(),
  options: ProductionReviewOptions = {},
): Promise<StageRunOutput> {
  const startedAt = Date.now();
  if (stageId === "structural_qa" || stageId === "deterministic_qa") {
    const findings = runStructuralQa(deck, now);
    return {
      findings,
      stage: stageResult(
        stageId,
        "completed",
        findings.length,
        Date.now() - startedAt,
        now,
      ),
    };
  }

  if (stageId === "local_proofing") {
    const findings = runLocalProofing(deck, now);
    return {
      findings,
      stage: stageResult(
        stageId,
        "completed",
        findings.length,
        Date.now() - startedAt,
        now,
      ),
    };
  }

  if (stageId === "language_review") {
    const findings = await runLanguageReview(
      deck,
      options.languageReviewer,
      deck.qaFindings ?? [],
      now,
    );
    return {
      findings,
      stage: stageResult(
        stageId,
        "completed",
        findings.length,
        Date.now() - startedAt,
        now,
      ),
    };
  }

  if (stageId === "presenter_review") {
    const findings = runPresenterReview(deck, deck.qaFindings ?? [], now);
    return {
      findings,
      stage: stageResult(
        stageId,
        "completed",
        findings.length,
        Date.now() - startedAt,
        now,
      ),
    };
  }

  if (stageId === "fact_review") {
    const result = await runFactReview(
      deck,
      options.factReviewer,
      deck.qaFindings ?? [],
      now,
    );
    return {
      findings: result.findings,
      stage: stageResult(
        stageId,
        result.status,
        result.findings.length,
        Date.now() - startedAt,
        now,
        result.message,
      ),
    };
  }

  if (stageId === "image_suggestions") {
    const result = await runImageSuggestionReview(
      deck,
      options.imageSuggestionProvider,
      deck.qaFindings ?? [],
      now,
    );
    return {
      findings: result.findings,
      stage: stageResult(
        stageId,
        result.status,
        result.findings.length,
        Date.now() - startedAt,
        now,
        result.message,
      ),
    };
  }

  if (stageId === "connection_review") {
    const result = await runConnectionReview(
      deck,
      options.connectionReviewer,
      deck.qaFindings ?? [],
      now,
    );
    return {
      findings: result.findings,
      stage: stageResult(
        stageId,
        result.status,
        result.findings.length,
        Date.now() - startedAt,
        now,
        result.message,
      ),
    };
  }

  return {
    findings: [],
    stage: stageResult(
      stageId,
      "not_implemented",
      0,
      Date.now() - startedAt,
      now,
      "NOT_IMPLEMENTED",
    ),
  };
}

export async function runProductionReview(
  deck: HostDeck,
  now = new Date().toISOString(),
  options: ProductionReviewOptions = {},
): Promise<ProductionReviewResult> {
  const startedAt = Date.now();
  const outputs = await Promise.all(
    PRODUCTION_REVIEW_STAGES.map((stage) =>
      runProductionReviewStage(deck, stage.id, now, options),
    ),
  );

  return {
    stages: outputs.map((output) => output.stage),
    findings: outputs.flatMap((output) => output.findings),
    durationMs: Date.now() - startedAt,
    completedAt: now,
  };
}
