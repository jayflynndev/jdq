import { supabase } from "@/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HostDeck,
  HostDeckStatus,
  HostDingbatItems,
  HostBreakBlockConfig,
  HostShowScreens,
  HostShowBlock,
  HostShowBlockType,
  HostShowOrder,
  HostQuestion,
  HostQaFinding,
  HostQaFindingCategory,
  HostQaFindingSeverity,
  HostQaFindingSource,
  HostQaFindingStatus,
  HostQaFindingTargetType,
  HostQaSuggestedFix,
  HostProductionReviewMetadata,
  HostProductionReviewStageId,
  HostProductionReviewStageResult,
  HostProductionReviewStageStatus,
  HostQuizType,
  HostRound,
} from "@/src/host-slides/types";
import { resolveHostSlideImageUrl } from "@/src/host-slides/supabaseImages";
import { resolveHostShowScreens } from "@/src/host-slides/showScreens";
import { getDefaultShowOrder } from "@/src/host-slides/showOrder";

type HostSlideDeckRow = {
  id: string;
  title: string;
  quiz_type: HostQuizType;
  quiz_date: string;
  status: HostDeckStatus;
  connection_explanation: string | null;
  show_order: unknown | null;
  qa_findings: unknown | null;
  production_review: unknown | null;
  blank_enabled: boolean | null;
  blank_title_text: string | null;
  blank_body_text: string | null;
  blank_ticker_text: string | null;
  pre_roll_enabled: boolean | null;
  pre_roll_title_text: string | null;
  pre_roll_body_text: string | null;
  pre_roll_ticker_text: string | null;
  pre_quiz_enabled: boolean | null;
  pre_quiz_title_text: string | null;
  pre_quiz_body_text: string | null;
  pre_quiz_how_to_play_text: string | null;
  pre_quiz_recap_text: string | null;
  pre_quiz_ticker_text: string | null;
  first_break_enabled: boolean | null;
  first_break_pre_title_text: string | null;
  first_break_pre_body_text: string | null;
  first_break_title_text: string | null;
  first_break_body_text: string | null;
  first_break_after_title_text: string | null;
  first_break_after_body_text: string | null;
  first_break_ticker_text: string | null;
  second_break_enabled: boolean | null;
  second_break_title_text: string | null;
  second_break_body_text: string | null;
  second_break_ticker_text: string | null;
  mid_quiz_overlay_enabled: boolean | null;
  mid_quiz_overlay_title_text: string | null;
  mid_quiz_overlay_body_text: string | null;
  mid_quiz_overlay_ticker_text: string | null;
  saturday_break_2_enabled: boolean | null;
  saturday_break_2_title_text: string | null;
  saturday_break_2_body_text: string | null;
  saturday_break_2_ticker_text: string | null;
  quiz_end_enabled: boolean | null;
  quiz_end_title_text: string | null;
  quiz_end_body_text: string | null;
  quiz_end_ticker_text: string | null;
  linked_quiz_recap_id: string | null;
  quiz_recap_last_published_at: string | null;
};

const HOST_SLIDE_DECK_COLUMNS =
  "id,title,quiz_type,quiz_date,status,connection_explanation,show_order,qa_findings,production_review,blank_enabled,blank_title_text,blank_body_text,blank_ticker_text,pre_roll_enabled,pre_roll_title_text,pre_roll_body_text,pre_roll_ticker_text,pre_quiz_enabled,pre_quiz_title_text,pre_quiz_body_text,pre_quiz_how_to_play_text,pre_quiz_recap_text,pre_quiz_ticker_text,first_break_enabled,first_break_pre_title_text,first_break_pre_body_text,first_break_title_text,first_break_body_text,first_break_after_title_text,first_break_after_body_text,first_break_ticker_text,second_break_enabled,second_break_title_text,second_break_body_text,second_break_ticker_text,mid_quiz_overlay_enabled,mid_quiz_overlay_title_text,mid_quiz_overlay_body_text,mid_quiz_overlay_ticker_text,saturday_break_2_enabled,saturday_break_2_title_text,saturday_break_2_body_text,saturday_break_2_ticker_text,quiz_end_enabled,quiz_end_title_text,quiz_end_body_text,quiz_end_ticker_text,linked_quiz_recap_id,quiz_recap_last_published_at";

type HostSlideRoundRow = {
  id: string;
  deck_id: string;
  position: number;
  title: string;
};

type HostSlideQuestionRow = {
  id: string;
  deck_id: string;
  round_id: string | null;
  position: number | null;
  question_text: string;
  answer_text: string;
  picture_required: boolean;
  image_storage_path: string | null;
  is_tiebreak: boolean;
};

type HostSlideDingbatRow = {
  deck_id: string;
  position: number;
  answer_text: string;
  image_storage_path: string | null;
};

type QuizRecapAccessCodeRow = {
  id: string;
  access_codes: {
    part1?: string;
    part2?: string;
  } | null;
};

type InsertedRoundRow = { id: string; position: number };

type HostSlideQuestionInsert = {
  deck_id: string;
  round_id: string | null;
  position: number | null;
  question_text: string;
  answer_text: string;
  picture_required: boolean;
  image_storage_path: string | null;
  is_tiebreak: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQaTargetType(value: unknown): value is HostQaFindingTargetType {
  return (
    value === "deck" ||
    value === "round" ||
    value === "question" ||
    value === "answer" ||
    value === "image" ||
    value === "recap" ||
    value === "show_screen"
  );
}

function isQaSeverity(value: unknown): value is HostQaFindingSeverity {
  return value === "info" || value === "warning" || value === "error";
}

function isQaCategory(value: unknown): value is HostQaFindingCategory {
  return (
    value === "spelling" ||
    value === "grammar" ||
    value === "punctuation" ||
    value === "missing_answer" ||
    value === "duplicate_question" ||
    value === "duplicate_answer" ||
    value === "suspicious_answer" ||
    value === "picture_missing" ||
    value === "connection_round" ||
    value === "recap" ||
    value === "show_flow" ||
    value === "fact_review" ||
    value === "image_suggestion"
  );
}

function isQaStatus(value: unknown): value is HostQaFindingStatus {
  return (
    value === "open" ||
    value === "fixed" ||
    value === "ignored" ||
    value === "needs_review"
  );
}

function isQaSource(value: unknown): value is HostQaFindingSource {
  return (
    value === "LOCAL" ||
    value === "AI_LANGUAGE" ||
    value === "AI_FACT" ||
    value === "AI_IMAGE" ||
    value === "AI_CONNECTION" ||
    value === "AI_PRESENTER"
  );
}

function isProductionReviewStageId(
  value: unknown,
): value is HostProductionReviewStageId {
  return (
    value === "structural_qa" ||
    value === "local_proofing" ||
    value === "deterministic_qa" ||
    value === "language_review" ||
    value === "fact_review" ||
    value === "image_suggestions" ||
    value === "connection_review" ||
    value === "presenter_review"
  );
}

function isProductionReviewStageStatus(
  value: unknown,
): value is HostProductionReviewStageStatus {
  return (
    value === "completed" ||
    value === "not_implemented" ||
    value === "unavailable" ||
    value === "failed"
  );
}

function parseImageSuggestion(
  value: unknown,
): HostQaFinding["imageSuggestion"] | undefined {
  if (!isRecord(value)) return undefined;
  const { searchTerm, imageType, orientation, crop } = value;
  if (
    typeof searchTerm !== "string" ||
    typeof imageType !== "string" ||
    typeof crop !== "string" ||
    (orientation !== "portrait" &&
      orientation !== "landscape" &&
      orientation !== "square" &&
      orientation !== "any")
  ) {
    return undefined;
  }
  return { searchTerm, imageType, orientation, crop };
}

function parseQaSuggestedFix(value: unknown): HostQaSuggestedFix | undefined {
  if (!isRecord(value)) return undefined;
  const { type, field, description } = value;
  const replacementValue = value.value;
  if (
    type !== "replace_text" ||
    (field !== "round_title" && field !== "question" && field !== "answer") ||
    typeof replacementValue !== "string" ||
    typeof description !== "string"
  ) {
    return undefined;
  }
  return { type, field, value: replacementValue, description };
}

function parseQaFindings(value: unknown): HostQaFinding[] | undefined {
  if (value === null || value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;
  const findings = value.flatMap((item): HostQaFinding[] => {
    if (!isRecord(item)) return [];
    const {
      id,
      deckId,
      targetType,
      targetId,
      roundNumber,
      questionNumber,
      severity,
      category,
      source,
      message,
      status,
      createdAt,
      updatedAt,
    } = item;
    const imageSuggestion = parseImageSuggestion(item.imageSuggestion);
    if (
      typeof id !== "string" ||
      typeof deckId !== "string" ||
      !isQaTargetType(targetType) ||
      !isQaSeverity(severity) ||
      !isQaCategory(category) ||
      typeof message !== "string" ||
      !isQaStatus(status) ||
      typeof createdAt !== "string" ||
      typeof updatedAt !== "string"
    ) {
      return [];
    }
    return [
      {
        id,
        deckId,
        targetType,
        ...(typeof targetId === "string" ? { targetId } : {}),
        ...(typeof roundNumber === "number" ? { roundNumber } : {}),
        ...(typeof questionNumber === "number" ? { questionNumber } : {}),
        severity,
        category,
        source: isQaSource(source) ? source : "LOCAL",
        message,
        ...(parseQaSuggestedFix(item.suggestedFix)
          ? { suggestedFix: parseQaSuggestedFix(item.suggestedFix) }
          : {}),
        ...(typeof item.confidence === "number"
          ? { confidence: item.confidence }
          : {}),
        ...(imageSuggestion ? { imageSuggestion } : {}),
        status,
        createdAt,
        updatedAt,
      },
    ];
  });
  return findings;
}

function parseProductionReviewStage(
  value: unknown,
): HostProductionReviewStageResult | null {
  if (!isRecord(value)) return null;
  const {
    id,
    label,
    status,
    findingsCount,
    durationMs,
    completedAt,
    message,
  } = value;
  if (
    !isProductionReviewStageId(id) ||
    typeof label !== "string" ||
    !isProductionReviewStageStatus(status) ||
    typeof findingsCount !== "number" ||
    typeof durationMs !== "number" ||
    typeof completedAt !== "string"
  ) {
    return null;
  }
  return {
    id,
    label,
    status,
    findingsCount,
    durationMs,
    completedAt,
    ...(typeof message === "string" ? { message } : {}),
  };
}

function parseProductionReview(
  value: unknown,
): HostProductionReviewMetadata | undefined {
  if (!isRecord(value)) return undefined;
  const { lastRunAt, version, durationMs, stages } = value;
  if (
    typeof lastRunAt !== "string" ||
    typeof version !== "string" ||
    typeof durationMs !== "number" ||
    !Array.isArray(stages)
  ) {
    return undefined;
  }
  const parsedStages = stages.map(parseProductionReviewStage);
  if (!parsedStages.every((stage): stage is HostProductionReviewStageResult => stage !== null)) {
    return undefined;
  }
  return {
    lastRunAt,
    version,
    durationMs,
    stages: parsedStages,
  };
}

function isShowBlockType(value: unknown): value is HostShowBlockType {
  return (
    value === "pre_quiz" ||
    value === "title_slide" ||
    value === "round_intro" ||
    value === "question_section" ||
    value === "answer_section" ||
    value === "pre_break" ||
    value === "break_countdown" ||
    value === "post_break" ||
    value === "round_reset" ||
    value === "dingbat_question" ||
    value === "dingbat_answer" ||
    value === "tiebreak" ||
    value === "quiz_end"
  );
}

function numbersFromConfig(
  config: Record<string, unknown>,
  key: string,
): number[] | null {
  const value = config[key];
  if (!Array.isArray(value)) return null;
  const numbers = value.filter(
    (item): item is number => Number.isInteger(item) && item > 0,
  );
  return numbers.length === value.length ? numbers : null;
}

function textSettingsFromConfig(
  config: Record<string, unknown>,
): HostBreakBlockConfig["textSettings"] | null {
  const value = config.textSettings;
  if (!isRecord(value)) return null;
  const { titleText, bodyText, tickerText } = value;
  return typeof titleText === "string" &&
    typeof bodyText === "string" &&
    typeof tickerText === "string"
    ? { titleText, bodyText, tickerText }
    : null;
}

function parseShowBlock(value: unknown): HostShowBlock | null {
  if (!isRecord(value)) return null;
  const { id, type, label, enabled } = value;
  if (
    typeof id !== "string" ||
    !isShowBlockType(type) ||
    typeof label !== "string" ||
    typeof enabled !== "boolean"
  ) {
    return null;
  }

  if (
    type === "pre_quiz" ||
    type === "title_slide" ||
    type === "round_reset" ||
    type === "quiz_end" ||
    type === "dingbat_question" ||
    type === "dingbat_answer" ||
    type === "tiebreak"
  ) {
    return { id, type, label, enabled };
  }

  if (!isRecord(value.config)) return null;

  if (type === "round_intro") {
    const roundNumber = value.config.roundNumber;
    return typeof roundNumber === "number" &&
      Number.isInteger(roundNumber) &&
      roundNumber > 0
      ? { id, type, label, enabled, config: { roundNumber } }
      : null;
  }

  if (type === "question_section" || type === "answer_section") {
    const roundNumbers = numbersFromConfig(value.config, "roundNumbers");
    return roundNumbers
      ? { id, type, label, enabled, config: { roundNumbers } }
      : null;
  }

  const breakNumber = value.config.breakNumber;
  const accessCodePart = value.config.accessCodePart;
  const showTimerPlaceholder = value.config.showTimerPlaceholder;
  const textSettings = textSettingsFromConfig(value.config);
  if (breakNumber !== 1 && breakNumber !== 2) return null;
  if (
    accessCodePart !== undefined &&
    accessCodePart !== "part1" &&
    accessCodePart !== "part2"
  ) {
    return null;
  }
  if (
    showTimerPlaceholder !== undefined &&
    typeof showTimerPlaceholder !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    type,
    label,
    enabled,
    config: {
      breakNumber,
      ...(accessCodePart ? { accessCodePart } : {}),
      ...(showTimerPlaceholder !== undefined ? { showTimerPlaceholder } : {}),
      ...(textSettings ? { textSettings } : {}),
    },
  };
}

function parseShowOrder(
  value: unknown,
  quizType: HostQuizType,
  roundCount: number,
): HostShowOrder {
  if (!Array.isArray(value)) return getDefaultShowOrder(quizType, roundCount);
  const blocks = value.map(parseShowBlock);
  return blocks.every((block): block is HostShowBlock => block !== null)
    ? blocks
    : getDefaultShowOrder(quizType, roundCount);
}

function mapShowScreens(deckRow: HostSlideDeckRow): HostShowScreens {
  const defaults = resolveHostShowScreens(deckRow.quiz_type, undefined);
  const legacyPreQuizBody = [
    deckRow.pre_quiz_how_to_play_text,
    deckRow.pre_quiz_recap_text,
  ]
    .filter((text): text is string => Boolean(text?.trim()))
    .join("\n\n");
  return {
    blank: {
      enabled: deckRow.blank_enabled ?? defaults.blank.enabled,
      titleText: deckRow.blank_title_text ?? defaults.blank.titleText,
      bodyText: deckRow.blank_body_text ?? defaults.blank.bodyText,
      tickerText: deckRow.blank_ticker_text ?? defaults.blank.tickerText,
    },
    preRoll: {
      enabled: deckRow.pre_roll_enabled ?? defaults.preRoll.enabled,
      titleText: deckRow.pre_roll_title_text ?? defaults.preRoll.titleText,
      bodyText: deckRow.pre_roll_body_text ?? defaults.preRoll.bodyText,
      tickerText: deckRow.pre_roll_ticker_text ?? defaults.preRoll.tickerText,
    },
    preQuiz: {
      enabled: deckRow.pre_quiz_enabled ?? defaults.preQuiz.enabled,
      titleText: deckRow.pre_quiz_title_text ?? defaults.preQuiz.titleText,
      bodyText:
        deckRow.pre_quiz_body_text ??
        (legacyPreQuizBody || defaults.preQuiz.bodyText),
      tickerText:
        deckRow.pre_quiz_ticker_text ?? defaults.preQuiz.tickerText,
    },
    preBreak: {
      enabled: deckRow.first_break_enabled ?? defaults.preBreak.enabled,
      titleText:
        deckRow.first_break_pre_title_text ?? defaults.preBreak.titleText,
      bodyText:
        deckRow.first_break_pre_body_text ?? defaults.preBreak.bodyText,
      tickerText:
        deckRow.first_break_ticker_text ?? defaults.preBreak.tickerText,
    },
    breakCountdown: {
      enabled: deckRow.first_break_enabled ?? defaults.breakCountdown.enabled,
      titleText:
        deckRow.first_break_title_text ?? defaults.breakCountdown.titleText,
      bodyText:
        deckRow.first_break_body_text ?? defaults.breakCountdown.bodyText,
      tickerText:
        deckRow.first_break_ticker_text ?? defaults.breakCountdown.tickerText,
    },
    postBreak: {
      enabled: deckRow.first_break_enabled ?? defaults.postBreak.enabled,
      titleText:
        deckRow.first_break_after_title_text ?? defaults.postBreak.titleText,
      bodyText:
        deckRow.first_break_after_body_text ?? defaults.postBreak.bodyText,
      tickerText:
        deckRow.first_break_ticker_text ?? defaults.postBreak.tickerText,
    },
    midQuizReset: {
      enabled:
        deckRow.mid_quiz_overlay_enabled ??
        defaults.midQuizReset.enabled,
      titleText:
        deckRow.mid_quiz_overlay_title_text ??
        defaults.midQuizReset.titleText,
      bodyText:
        deckRow.mid_quiz_overlay_body_text ??
        defaults.midQuizReset.bodyText,
      tickerText:
        deckRow.mid_quiz_overlay_ticker_text ??
        defaults.midQuizReset.tickerText,
    },
    saturdayBreak2: {
      enabled:
        deckRow.saturday_break_2_enabled ??
        deckRow.second_break_enabled ??
        defaults.saturdayBreak2.enabled,
      titleText:
        deckRow.saturday_break_2_title_text ??
        deckRow.second_break_title_text ??
        defaults.saturdayBreak2.titleText,
      bodyText:
        deckRow.saturday_break_2_body_text ??
        deckRow.second_break_body_text ??
        defaults.saturdayBreak2.bodyText,
      tickerText:
        deckRow.saturday_break_2_ticker_text ??
        deckRow.second_break_ticker_text ??
        defaults.saturdayBreak2.tickerText,
    },
    quizEnd: {
      enabled: deckRow.quiz_end_enabled ?? defaults.quizEnd.enabled,
      titleText: deckRow.quiz_end_title_text ?? defaults.quizEnd.titleText,
      bodyText: deckRow.quiz_end_body_text ?? defaults.quizEnd.bodyText,
      tickerText: deckRow.quiz_end_ticker_text ?? defaults.quizEnd.tickerText,
    },
  };
}

function mapQuestion(row: HostSlideQuestionRow): HostQuestion {
  return {
    id: row.id,
    prompt: row.question_text,
    answer: row.answer_text,
    ...(row.picture_required ? { imagePlaceholder: "Picture required" } : {}),
    ...(row.image_storage_path
      ? {
          imageStoragePath: row.image_storage_path,
          imageUrl: resolveHostSlideImageUrl(row.image_storage_path),
        }
      : {}),
  };
}

async function loadQuizRecapAccessCodeRows(
  recapIds: readonly string[],
  client: SupabaseClient = supabase,
): Promise<QuizRecapAccessCodeRow[]> {
  const uniqueRecapIds = [...new Set(recapIds)].filter(Boolean);
  if (uniqueRecapIds.length === 0) return [];

  const { data, error } = await client
    .from("quizzes")
    .select("id,access_codes")
    .in("id", uniqueRecapIds);
  if (error) throw new Error(error.message);

  return (data ?? []) as QuizRecapAccessCodeRow[];
}

function mapDeck(
  deckRow: HostSlideDeckRow,
  roundRows: HostSlideRoundRow[],
  questionRows: HostSlideQuestionRow[],
  dingbatRows: HostSlideDingbatRow[],
  accessCodeRows: QuizRecapAccessCodeRow[] = [],
): HostDeck {
  const rounds: HostRound[] = roundRows
    .filter((round) => round.deck_id === deckRow.id)
    .sort((left, right) => left.position - right.position)
    .map((round) => ({
      id: round.id,
      title: round.title,
      questions: questionRows
        .filter(
          (question) =>
            question.deck_id === deckRow.id &&
            question.round_id === round.id &&
            !question.is_tiebreak,
        )
        .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
        .map(mapQuestion),
    }));
  const tiebreakRow = questionRows.find(
    (question) => question.deck_id === deckRow.id && question.is_tiebreak,
  );
  const accessCodeRow = deckRow.linked_quiz_recap_id
    ? accessCodeRows.find((row) => row.id === deckRow.linked_quiz_recap_id)
    : undefined;
  const qaFindings = parseQaFindings(deckRow.qa_findings);
  const productionReview = parseProductionReview(deckRow.production_review);
  const common = {
    id: deckRow.id,
    title: deckRow.title,
    quizType: deckRow.quiz_type,
    quizDate: deckRow.quiz_date,
    status: deckRow.status,
    showScreens: mapShowScreens(deckRow),
    showOrder: parseShowOrder(
      deckRow.show_order,
      deckRow.quiz_type,
      rounds.length,
    ),
    ...(qaFindings ? { qaFindings } : {}),
    ...(productionReview ? { productionReview } : {}),
    ...(deckRow.connection_explanation
      ? { connectionExplanation: deckRow.connection_explanation }
      : {}),
    ...(deckRow.linked_quiz_recap_id
      ? { linkedQuizRecapId: deckRow.linked_quiz_recap_id }
      : {}),
    ...(accessCodeRow?.access_codes
      ? {
          quizRecapAccessCodes: {
            ...(accessCodeRow.access_codes.part1
              ? { part1: accessCodeRow.access_codes.part1 }
              : {}),
            ...(accessCodeRow.access_codes.part2
              ? { part2: accessCodeRow.access_codes.part2 }
              : {}),
          },
        }
      : {}),
    ...(deckRow.quiz_recap_last_published_at
      ? {
          quizRecapLastPublishedAt: deckRow.quiz_recap_last_published_at,
        }
      : {}),
  } as const;

  if (deckRow.quiz_type === "patreon") {
    return {
      ...common,
      quizType: "patreon",
      rounds,
      ...(tiebreakRow ? { tiebreaker: mapQuestion(tiebreakRow) } : {}),
    };
  }

  if (rounds.length !== 5) {
    throw new Error(
      `${deckRow.quiz_type} deck ${deckRow.id} must contain exactly five rounds.`,
    );
  }

  const weeklyRounds = rounds as [
    HostRound,
    HostRound,
    HostRound,
    HostRound,
    HostRound,
  ];
  if (deckRow.quiz_type === "saturday") {
    const savedDingbats = dingbatRows.filter(
      (dingbat) => dingbat.deck_id === deckRow.id,
    );
    const dingbatItems = [1, 2, 3, 4, 5, 6].map((position) => {
      const row = savedDingbats.find((dingbat) => dingbat.position === position);
      return {
        position: position as 1 | 2 | 3 | 4 | 5 | 6,
        answer: row?.answer_text ?? "",
        ...(row?.image_storage_path
          ? {
              imageStoragePath: row.image_storage_path,
              imageUrl: resolveHostSlideImageUrl(row.image_storage_path),
            }
          : {}),
      };
    }) as HostDingbatItems;

    return {
      ...common,
      quizType: "saturday",
      rounds: weeklyRounds,
      ...(tiebreakRow ? { tiebreaker: mapQuestion(tiebreakRow) } : {}),
      ...(savedDingbats.length > 0 ? { dingbats: { items: dingbatItems } } : {}),
    };
  }

  return {
    ...common,
    quizType: "thursday",
    rounds: weeklyRounds,
    ...(tiebreakRow ? { tiebreaker: mapQuestion(tiebreakRow) } : {}),
  };
}

async function insertDeckContents(deckId: string, deck: HostDeck): Promise<void> {
  const roundPayload = deck.rounds.map((round, index) => ({
    deck_id: deckId,
    position: index + 1,
    title: round.title,
  }));
  const { data: insertedRoundData, error: roundError } = await supabase
    .from("host_slide_rounds")
    .insert(roundPayload)
    .select("id,position");
  if (roundError) throw new Error(roundError.message);

  const insertedRounds = (insertedRoundData ?? []) as InsertedRoundRow[];
  const roundIdByPosition = new Map(
    insertedRounds.map((round) => [round.position, round.id]),
  );
  const questionPayload: HostSlideQuestionInsert[] = deck.rounds.flatMap(
    (round, roundIndex) => {
    const roundId = roundIdByPosition.get(roundIndex + 1);
    if (!roundId) throw new Error(`Round ${roundIndex + 1} was not created.`);

      return round.questions.map((question, questionIndex) => ({
        deck_id: deckId,
        round_id: roundId,
        position: questionIndex + 1,
        question_text: question.prompt,
        answer_text: question.answer,
        picture_required: Boolean(
          question.imagePlaceholder ||
            question.imageStoragePath ||
            question.imageUrl,
        ),
        image_storage_path: question.imageStoragePath ?? null,
        is_tiebreak: false,
      }));
    },
  );

  if (deck.tiebreaker) {
    questionPayload.push({
      deck_id: deckId,
      round_id: null,
      position: null,
      question_text: deck.tiebreaker.prompt,
      answer_text: deck.tiebreaker.answer,
      picture_required: Boolean(
        deck.tiebreaker.imagePlaceholder ||
          deck.tiebreaker.imageStoragePath ||
          deck.tiebreaker.imageUrl,
      ),
      image_storage_path: deck.tiebreaker.imageStoragePath ?? null,
      is_tiebreak: true,
    });
  }

  if (questionPayload.length > 0) {
    const { error: questionError } = await supabase
      .from("host_slide_questions")
      .insert(questionPayload);
    if (questionError) throw new Error(questionError.message);
  }

  if (deck.quizType === "saturday" && deck.dingbats) {
    const { error: dingbatError } = await supabase
      .from("host_slide_dingbats")
      .insert(
        deck.dingbats.items.map((item) => ({
          deck_id: deckId,
          position: item.position,
          answer_text: item.answer,
          image_storage_path: item.imageStoragePath ?? null,
        })),
      );
    if (dingbatError) throw new Error(dingbatError.message);
  }
}

export async function createHostDeck(deck: HostDeck): Promise<HostDeck> {
  const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
  const showOrder =
    deck.showOrder ?? getDefaultShowOrder(deck.quizType, deck.rounds.length);
  const { data, error } = await supabase
    .from("host_slide_decks")
    .insert({
      title: deck.title,
      quiz_type: deck.quizType,
      quiz_date: deck.quizDate,
      status: "draft",
      show_order: showOrder,
      qa_findings: deck.qaFindings ?? null,
      production_review: deck.productionReview ?? null,
      blank_enabled: showScreens.blank.enabled,
      blank_title_text: showScreens.blank.titleText,
      blank_body_text: showScreens.blank.bodyText,
      blank_ticker_text: showScreens.blank.tickerText,
      pre_roll_enabled: showScreens.preRoll.enabled,
      pre_roll_title_text: showScreens.preRoll.titleText,
      pre_roll_body_text: showScreens.preRoll.bodyText,
      pre_roll_ticker_text: showScreens.preRoll.tickerText,
      pre_quiz_enabled: showScreens.preQuiz.enabled,
      pre_quiz_title_text: showScreens.preQuiz.titleText,
      pre_quiz_body_text: showScreens.preQuiz.bodyText,
      pre_quiz_how_to_play_text: showScreens.preQuiz.bodyText,
      pre_quiz_recap_text: null,
      pre_quiz_ticker_text: showScreens.preQuiz.tickerText,
      first_break_enabled:
        showScreens.preBreak.enabled ||
        showScreens.breakCountdown.enabled ||
        showScreens.postBreak.enabled,
      first_break_pre_title_text: showScreens.preBreak.titleText,
      first_break_pre_body_text: showScreens.preBreak.bodyText,
      first_break_title_text: showScreens.breakCountdown.titleText,
      first_break_body_text: showScreens.breakCountdown.bodyText,
      first_break_after_title_text: showScreens.postBreak.titleText,
      first_break_after_body_text: showScreens.postBreak.bodyText,
      first_break_ticker_text: showScreens.breakCountdown.tickerText,
      second_break_enabled: showScreens.saturdayBreak2.enabled,
      second_break_title_text: showScreens.saturdayBreak2.titleText,
      second_break_body_text: showScreens.saturdayBreak2.bodyText,
      second_break_ticker_text: showScreens.saturdayBreak2.tickerText,
      mid_quiz_overlay_enabled: showScreens.midQuizReset.enabled,
      mid_quiz_overlay_title_text: showScreens.midQuizReset.titleText,
      mid_quiz_overlay_body_text: showScreens.midQuizReset.bodyText,
      mid_quiz_overlay_ticker_text: showScreens.midQuizReset.tickerText,
      saturday_break_2_enabled: showScreens.saturdayBreak2.enabled,
      saturday_break_2_title_text: showScreens.saturdayBreak2.titleText,
      saturday_break_2_body_text: showScreens.saturdayBreak2.bodyText,
      saturday_break_2_ticker_text: showScreens.saturdayBreak2.tickerText,
      quiz_end_enabled: showScreens.quizEnd.enabled,
      quiz_end_title_text: showScreens.quizEnd.titleText,
      quiz_end_body_text: showScreens.quizEnd.bodyText,
      quiz_end_ticker_text: showScreens.quizEnd.tickerText,
      connection_explanation: deck.connectionExplanation ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const deckId = (data as { id: string }).id;
  try {
    await insertDeckContents(deckId, deck);
  } catch (error: unknown) {
    await supabase.from("host_slide_decks").delete().eq("id", deckId);
    throw error;
  }

  return loadHostDeck(deckId);
}

export async function loadHostDeck(deckId: string): Promise<HostDeck> {
  return loadHostDeckWithClient(deckId, supabase);
}

export async function loadHostDeckWithClient(
  deckId: string,
  client: SupabaseClient,
): Promise<HostDeck> {
  const { data: deckData, error: deckError } = await client
    .from("host_slide_decks")
    .select(HOST_SLIDE_DECK_COLUMNS)
    .eq("id", deckId)
    .single();
  if (deckError) throw new Error(deckError.message);

  const [
    { data: roundData, error: roundError },
    { data: questionData, error: questionError },
    { data: dingbatData, error: dingbatError },
  ] =
    await Promise.all([
      client
        .from("host_slide_rounds")
        .select("id,deck_id,position,title")
        .eq("deck_id", deckId)
        .order("position"),
      client
        .from("host_slide_questions")
        .select(
          "id,deck_id,round_id,position,question_text,answer_text,picture_required,image_storage_path,is_tiebreak",
        )
        .eq("deck_id", deckId)
        .order("position", { nullsFirst: false }),
      client
        .from("host_slide_dingbats")
        .select("deck_id,position,answer_text,image_storage_path")
        .eq("deck_id", deckId)
        .order("position"),
    ]);
  if (roundError) throw new Error(roundError.message);
  if (questionError) throw new Error(questionError.message);
  if (dingbatError) throw new Error(dingbatError.message);
  const accessCodeRows = await loadQuizRecapAccessCodeRows(
    (deckData as HostSlideDeckRow).linked_quiz_recap_id
      ? [(deckData as HostSlideDeckRow).linked_quiz_recap_id as string]
      : [],
    client,
  );

  return mapDeck(
    deckData as HostSlideDeckRow,
    (roundData ?? []) as HostSlideRoundRow[],
    (questionData ?? []) as HostSlideQuestionRow[],
    (dingbatData ?? []) as HostSlideDingbatRow[],
    accessCodeRows,
  );
}

export async function listHostDecks(): Promise<HostDeck[]> {
  const { data: deckData, error: deckError } = await supabase
    .from("host_slide_decks")
    .select(HOST_SLIDE_DECK_COLUMNS)
    .order("quiz_date", { ascending: false });
  if (deckError) throw new Error(deckError.message);

  const deckRows = (deckData ?? []) as HostSlideDeckRow[];
  if (deckRows.length === 0) return [];
  const deckIds = deckRows.map((deck) => deck.id);
  const [
    { data: roundData, error: roundError },
    { data: questionData, error: questionError },
    { data: dingbatData, error: dingbatError },
  ] =
    await Promise.all([
      supabase
        .from("host_slide_rounds")
        .select("id,deck_id,position,title")
        .in("deck_id", deckIds)
        .order("position"),
      supabase
        .from("host_slide_questions")
        .select(
          "id,deck_id,round_id,position,question_text,answer_text,picture_required,image_storage_path,is_tiebreak",
        )
        .in("deck_id", deckIds)
        .order("position", { nullsFirst: false }),
      supabase
        .from("host_slide_dingbats")
        .select("deck_id,position,answer_text,image_storage_path")
        .in("deck_id", deckIds)
        .order("position"),
    ]);
  if (roundError) throw new Error(roundError.message);
  if (questionError) throw new Error(questionError.message);
  if (dingbatError) throw new Error(dingbatError.message);

  const rounds = (roundData ?? []) as HostSlideRoundRow[];
  const questions = (questionData ?? []) as HostSlideQuestionRow[];
  const dingbats = (dingbatData ?? []) as HostSlideDingbatRow[];
  const accessCodeRows = await loadQuizRecapAccessCodeRows(
    deckRows
      .map((deck) => deck.linked_quiz_recap_id)
      .filter((recapId): recapId is string => Boolean(recapId)),
  );
  return deckRows.map((deck) =>
    mapDeck(deck, rounds, questions, dingbats, accessCodeRows),
  );
}

export async function updateHostDeck(deck: HostDeck): Promise<HostDeck> {
  const showScreens = resolveHostShowScreens(deck.quizType, deck.showScreens);
  const showOrder =
    deck.showOrder ?? getDefaultShowOrder(deck.quizType, deck.rounds.length);
  const { error: deckError } = await supabase
    .from("host_slide_decks")
    .update({
      title: deck.title,
      quiz_type: deck.quizType,
      quiz_date: deck.quizDate,
      status: deck.status,
      show_order: showOrder,
      qa_findings: deck.qaFindings ?? null,
      production_review: deck.productionReview ?? null,
      blank_enabled: showScreens.blank.enabled,
      blank_title_text: showScreens.blank.titleText,
      blank_body_text: showScreens.blank.bodyText,
      blank_ticker_text: showScreens.blank.tickerText,
      pre_roll_enabled: showScreens.preRoll.enabled,
      pre_roll_title_text: showScreens.preRoll.titleText,
      pre_roll_body_text: showScreens.preRoll.bodyText,
      pre_roll_ticker_text: showScreens.preRoll.tickerText,
      pre_quiz_enabled: showScreens.preQuiz.enabled,
      pre_quiz_title_text: showScreens.preQuiz.titleText,
      pre_quiz_body_text: showScreens.preQuiz.bodyText,
      pre_quiz_how_to_play_text: showScreens.preQuiz.bodyText,
      pre_quiz_recap_text: null,
      pre_quiz_ticker_text: showScreens.preQuiz.tickerText,
      first_break_enabled:
        showScreens.preBreak.enabled ||
        showScreens.breakCountdown.enabled ||
        showScreens.postBreak.enabled,
      first_break_pre_title_text: showScreens.preBreak.titleText,
      first_break_pre_body_text: showScreens.preBreak.bodyText,
      first_break_title_text: showScreens.breakCountdown.titleText,
      first_break_body_text: showScreens.breakCountdown.bodyText,
      first_break_after_title_text: showScreens.postBreak.titleText,
      first_break_after_body_text: showScreens.postBreak.bodyText,
      first_break_ticker_text: showScreens.breakCountdown.tickerText,
      second_break_enabled: showScreens.saturdayBreak2.enabled,
      second_break_title_text: showScreens.saturdayBreak2.titleText,
      second_break_body_text: showScreens.saturdayBreak2.bodyText,
      second_break_ticker_text: showScreens.saturdayBreak2.tickerText,
      mid_quiz_overlay_enabled: showScreens.midQuizReset.enabled,
      mid_quiz_overlay_title_text: showScreens.midQuizReset.titleText,
      mid_quiz_overlay_body_text: showScreens.midQuizReset.bodyText,
      mid_quiz_overlay_ticker_text: showScreens.midQuizReset.tickerText,
      saturday_break_2_enabled: showScreens.saturdayBreak2.enabled,
      saturday_break_2_title_text: showScreens.saturdayBreak2.titleText,
      saturday_break_2_body_text: showScreens.saturdayBreak2.bodyText,
      saturday_break_2_ticker_text: showScreens.saturdayBreak2.tickerText,
      quiz_end_enabled: showScreens.quizEnd.enabled,
      quiz_end_title_text: showScreens.quizEnd.titleText,
      quiz_end_body_text: showScreens.quizEnd.bodyText,
      quiz_end_ticker_text: showScreens.quizEnd.tickerText,
      connection_explanation: deck.connectionExplanation?.trim()
        ? deck.connectionExplanation
        : null,
    })
    .eq("id", deck.id);
  if (deckError) throw new Error(deckError.message);

  const { error: dingbatDeleteError } = await supabase
    .from("host_slide_dingbats")
    .delete()
    .eq("deck_id", deck.id);
  if (dingbatDeleteError) throw new Error(dingbatDeleteError.message);

  const { error: questionDeleteError } = await supabase
    .from("host_slide_questions")
    .delete()
    .eq("deck_id", deck.id);
  if (questionDeleteError) throw new Error(questionDeleteError.message);

  const { error: roundDeleteError } = await supabase
    .from("host_slide_rounds")
    .delete()
    .eq("deck_id", deck.id);
  if (roundDeleteError) throw new Error(roundDeleteError.message);

  await insertDeckContents(deck.id, deck);
  return loadHostDeck(deck.id);
}

export async function updateHostDeckStatus(
  deckId: string,
  status: HostDeckStatus,
): Promise<void> {
  const { error } = await supabase
    .from("host_slide_decks")
    .update({ status })
    .eq("id", deckId);
  if (error) throw new Error(error.message);
}

export async function deleteHostDeck(deckId: string): Promise<void> {
  const { error } = await supabase
    .from("host_slide_decks")
    .delete()
    .eq("id", deckId);
  if (error) throw new Error(error.message);
}
