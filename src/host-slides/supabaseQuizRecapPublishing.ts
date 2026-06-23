import { supabase } from "@/supabaseClient";
import { resolveHostSlideImageUrl } from "@/src/host-slides/supabaseImages";
import {
  publishHostDeckToQuizRecap,
  type QuizRecapPublishingFields,
  type QuizRecapPublishingRepository,
  type QuizRecapPublishPayload,
  type QuizRecapPublishResult,
} from "@/src/host-slides/quizRecapPublishing";
import type { HostDeck } from "@/src/host-slides/types";

type QuizRecapPublishingRow = {
  youtube_url: string | null;
  thumbnail_url: string | null;
  access_codes: {
    part1?: string;
    part2?: string;
  } | null;
};

const repository: QuizRecapPublishingRepository = {
  async createRecap(payload: QuizRecapPublishPayload) {
    const { data, error } = await supabase
      .from("quizzes")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data as { id: string };
  },

  async updateRecap(recapId: string, payload: QuizRecapPublishPayload) {
    const { error } = await supabase
      .from("quizzes")
      .update(payload)
      .eq("id", recapId)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
  },

  async linkDeckToRecap(
    deckId: string,
    recapId: string,
    publishedAt: string,
  ) {
    const { error } = await supabase
      .from("host_slide_decks")
      .update({
        linked_quiz_recap_id: recapId,
        quiz_recap_last_published_at: publishedAt,
      })
      .eq("id", deckId);
    if (error) throw new Error(error.message);
  },
};

export async function publishHostDeckRecap(
  deck: HostDeck,
  fields: QuizRecapPublishingFields,
): Promise<QuizRecapPublishResult> {
  return publishHostDeckToQuizRecap({
    deck,
    fields,
    resolveImageUrl: resolveHostSlideImageUrl,
    repository,
  });
}

export async function loadQuizRecapPublishingFields(
  recapId: string,
): Promise<QuizRecapPublishingFields> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("youtube_url,thumbnail_url,access_codes")
    .eq("id", recapId)
    .single();
  if (error) throw new Error(error.message);

  const row = data as QuizRecapPublishingRow;
  return {
    part1AccessCode: row.access_codes?.part1 ?? "",
    part2AccessCode: row.access_codes?.part2 ?? "",
    youtubeUrl: row.youtube_url ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",
  };
}
