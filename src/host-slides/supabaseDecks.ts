import { supabase } from "@/supabaseClient";
import type {
  HostDeck,
  HostDeckStatus,
  HostDingbatItems,
  HostQuestion,
  HostQuizType,
  HostRound,
} from "@/src/host-slides/types";
import { resolveHostSlideImageUrl } from "@/src/host-slides/supabaseImages";

type HostSlideDeckRow = {
  id: string;
  title: string;
  quiz_type: HostQuizType;
  quiz_date: string;
  status: HostDeckStatus;
  connection_explanation: string | null;
  linked_quiz_recap_id: string | null;
  quiz_recap_last_published_at: string | null;
};

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

function mapDeck(
  deckRow: HostSlideDeckRow,
  roundRows: HostSlideRoundRow[],
  questionRows: HostSlideQuestionRow[],
  dingbatRows: HostSlideDingbatRow[],
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
  const common = {
    id: deckRow.id,
    title: deckRow.title,
    quizType: deckRow.quiz_type,
    quizDate: deckRow.quiz_date,
    status: deckRow.status,
    ...(deckRow.connection_explanation
      ? { connectionExplanation: deckRow.connection_explanation }
      : {}),
    ...(deckRow.linked_quiz_recap_id
      ? { linkedQuizRecapId: deckRow.linked_quiz_recap_id }
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
  const { data, error } = await supabase
    .from("host_slide_decks")
    .insert({
      title: deck.title,
      quiz_type: deck.quizType,
      quiz_date: deck.quizDate,
      status: "draft",
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
  const { data: deckData, error: deckError } = await supabase
    .from("host_slide_decks")
    .select(
      "id,title,quiz_type,quiz_date,status,connection_explanation,linked_quiz_recap_id,quiz_recap_last_published_at",
    )
    .eq("id", deckId)
    .single();
  if (deckError) throw new Error(deckError.message);

  const [
    { data: roundData, error: roundError },
    { data: questionData, error: questionError },
    { data: dingbatData, error: dingbatError },
  ] =
    await Promise.all([
      supabase
        .from("host_slide_rounds")
        .select("id,deck_id,position,title")
        .eq("deck_id", deckId)
        .order("position"),
      supabase
        .from("host_slide_questions")
        .select(
          "id,deck_id,round_id,position,question_text,answer_text,picture_required,image_storage_path,is_tiebreak",
        )
        .eq("deck_id", deckId)
        .order("position", { nullsFirst: false }),
      supabase
        .from("host_slide_dingbats")
        .select("deck_id,position,answer_text,image_storage_path")
        .eq("deck_id", deckId)
        .order("position"),
    ]);
  if (roundError) throw new Error(roundError.message);
  if (questionError) throw new Error(questionError.message);
  if (dingbatError) throw new Error(dingbatError.message);

  return mapDeck(
    deckData as HostSlideDeckRow,
    (roundData ?? []) as HostSlideRoundRow[],
    (questionData ?? []) as HostSlideQuestionRow[],
    (dingbatData ?? []) as HostSlideDingbatRow[],
  );
}

export async function listHostDecks(): Promise<HostDeck[]> {
  const { data: deckData, error: deckError } = await supabase
    .from("host_slide_decks")
    .select(
      "id,title,quiz_type,quiz_date,status,connection_explanation,linked_quiz_recap_id,quiz_recap_last_published_at",
    )
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
  return deckRows.map((deck) => mapDeck(deck, rounds, questions, dingbats));
}

export async function updateHostDeck(deck: HostDeck): Promise<HostDeck> {
  const { error: deckError } = await supabase
    .from("host_slide_decks")
    .update({
      title: deck.title,
      quiz_type: deck.quizType,
      quiz_date: deck.quizDate,
      status: deck.status,
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
