import type { HostDeck } from "@/src/host-slides/types";
import { isOpenQaFinding } from "@/src/host-slides/qa";

export type HostReadinessIssueCode =
  | "deck_missing"
  | "invalid_quiz_type"
  | "invalid_quiz_date"
  | "invalid_status"
  | "round_title_missing"
  | "question_text_missing"
  | "answer_text_missing"
  | "picture_image_missing"
  | "dingbat_image_missing"
  | "dingbat_answer_missing"
  | "tiebreak_missing"
  | "production_review_not_run"
  | "fact_review_not_completed"
  | "image_suggestions_not_generated"
  | "connection_review_not_completed"
  | "qa_open_error"
  | "qa_open_warning";

export type HostReadinessIssue = {
  code: HostReadinessIssueCode;
  message: string;
};

export type HostReadinessResult = {
  score: number;
  passedChecks: number;
  totalChecks: number;
  warnings: HostReadinessIssue[];
  errors: HostReadinessIssue[];
  isReady: boolean;
};

const ERROR_PENALTIES: Readonly<Record<HostReadinessIssueCode, number>> = {
  deck_missing: 100,
  invalid_quiz_type: 20,
  invalid_quiz_date: 15,
  invalid_status: 10,
  round_title_missing: 8,
  question_text_missing: 10,
  answer_text_missing: 10,
  picture_image_missing: 14,
  dingbat_image_missing: 6,
  dingbat_answer_missing: 5,
  tiebreak_missing: 8,
  production_review_not_run: 8,
  fact_review_not_completed: 2,
  image_suggestions_not_generated: 2,
  connection_review_not_completed: 2,
  qa_open_error: 12,
  qa_open_warning: 6,
};

function hasCompletedStage(
  deck: HostDeck,
  stageId: "fact_review" | "image_suggestions" | "connection_review",
): boolean {
  return (
    deck.productionReview?.stages.some(
      (stage) => stage.id === stageId && stage.status === "completed",
    ) ?? false
  );
}

function isValidIsoDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function evaluateHostDeckReadiness(
  deck: HostDeck | null | undefined,
): HostReadinessResult {
  const errors: HostReadinessIssue[] = [];
  const warnings: HostReadinessIssue[] = [];
  let totalChecks = 1;
  let passedChecks = 0;

  const checkError = (
    passes: boolean,
    code: HostReadinessIssueCode,
    message: string,
  ) => {
    totalChecks += 1;
    if (passes) passedChecks += 1;
    else errors.push({ code, message });
  };

  if (!deck) {
    errors.push({ code: "deck_missing", message: "Deck does not exist." });
    return {
      score: 0,
      passedChecks: 0,
      totalChecks,
      warnings,
      errors,
      isReady: false,
    };
  }
  passedChecks += 1;

  checkError(
    ["thursday", "saturday", "patreon"].includes(deck.quizType),
    "invalid_quiz_type",
    "Deck has an invalid quiz type.",
  );
  checkError(
    isValidIsoDate(deck.quizDate),
    "invalid_quiz_date",
    "Deck has an invalid quiz date.",
  );
  checkError(
    deck.status === "draft" || deck.status === "ready",
    "invalid_status",
    "Deck status must be Draft or Ready.",
  );

  deck.rounds.forEach((round, roundIndex) => {
    checkError(
      Boolean(round.title.trim()),
      "round_title_missing",
      `Round ${roundIndex + 1} has no title.`,
    );

    round.questions.forEach((question, questionIndex) => {
      const location = `Round ${roundIndex + 1}, Question ${questionIndex + 1}`;
      checkError(
        Boolean(question.prompt.trim()),
        "question_text_missing",
        `${location} has no question text.`,
      );
      checkError(
        Boolean(question.answer.trim()),
        "answer_text_missing",
        `${location} has no answer text.`,
      );

      if (question.imagePlaceholder) {
        checkError(
          Boolean(question.imageStoragePath || question.imageUrl),
          "picture_image_missing",
          `${location} is marked as a picture question but has no image.`,
        );
      }
    });
  });

  if (deck.quizType === "saturday") {
    for (let position = 1; position <= 6; position += 1) {
      const item = deck.dingbats?.items.find(
        (candidate) => candidate.position === position,
      );
      checkError(
        Boolean(item?.imageStoragePath || item?.imageUrl),
        "dingbat_image_missing",
        `Dingbat ${position} has no image.`,
      );
      checkError(
        Boolean(item?.answer.trim()),
        "dingbat_answer_missing",
        `Dingbat ${position} has no answer.`,
      );
    }
  }

  totalChecks += 1;
  if (deck.productionReview) {
    const openQaFindings = (deck.qaFindings ?? []).filter(isOpenQaFinding);
    const openQaErrors = openQaFindings.filter(
      (finding) => finding.severity === "error",
    );
    const openQaWarnings = openQaFindings.filter(
      (finding) => finding.severity === "warning",
    );
    if (openQaErrors.length === 0 && openQaWarnings.length === 0) {
      passedChecks += 1;
    }
    if (openQaErrors.length > 0) {
      errors.push({
        code: "qa_open_error",
        message: `${openQaErrors.length} open QA error finding(s).`,
      });
    }
    if (openQaWarnings.length > 0) {
      warnings.push({
        code: "qa_open_warning",
        message: `${openQaWarnings.length} open QA warning finding(s).`,
      });
    }
  } else {
    warnings.push({
      code: "production_review_not_run",
      message: "Production Review has not been run.",
    });
  }

  if (deck.productionReview && !hasCompletedStage(deck, "fact_review")) {
    warnings.push({
      code: "fact_review_not_completed",
      message: "Fact Review has not completed.",
    });
  }
  if (deck.productionReview && !hasCompletedStage(deck, "image_suggestions")) {
    warnings.push({
      code: "image_suggestions_not_generated",
      message: "Image Suggestions have not been generated.",
    });
  }
  if (deck.productionReview && !hasCompletedStage(deck, "connection_review")) {
    warnings.push({
      code: "connection_review_not_completed",
      message: "Connection Review has not completed.",
    });
  }

  totalChecks += 1;
  if (deck.tiebreaker) passedChecks += 1;
  else {
    warnings.push({
      code: "tiebreak_missing",
      message: "Tiebreak is not set.",
    });
  }

  const penalty = [...errors, ...warnings].reduce(
    (total, issue) => total + ERROR_PENALTIES[issue.code],
    0,
  );

  return {
    score: Math.max(0, 100 - penalty),
    passedChecks,
    totalChecks,
    warnings,
    errors,
    isReady: errors.length === 0,
  };
}
