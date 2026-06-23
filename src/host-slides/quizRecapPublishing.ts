import {
  createQuizRecapDraft,
  type QuizRecapDraft,
  type QuizRecapImageUrlResolver,
} from "@/src/host-slides/quizRecapAdapter";
import type { HostDeck } from "@/src/host-slides/types";

export interface QuizRecapPublishingFields {
  part1AccessCode: string;
  part2AccessCode: string;
  youtubeUrl: string;
  thumbnailUrl: string;
}

export interface QuizRecapPublishPayload extends QuizRecapDraft {
  youtube_url: string;
  thumbnail_url: string;
  access_codes: {
    part1: string;
    part2: string;
  };
}

export interface QuizRecapPublishingRepository {
  createRecap(payload: QuizRecapPublishPayload): Promise<{ id: string }>;
  updateRecap(recapId: string, payload: QuizRecapPublishPayload): Promise<void>;
  linkDeckToRecap(
    deckId: string,
    recapId: string,
    publishedAt: string,
  ): Promise<void>;
}

export interface QuizRecapPublishResult {
  recapId: string;
  publishedAt: string;
  operation: "created" | "updated";
}

export async function publishHostDeckToQuizRecap({
  deck,
  fields,
  resolveImageUrl,
  repository,
  now = () => new Date(),
}: {
  deck: HostDeck;
  fields: QuizRecapPublishingFields;
  resolveImageUrl: QuizRecapImageUrlResolver;
  repository: QuizRecapPublishingRepository;
  now?: () => Date;
}): Promise<QuizRecapPublishResult> {
  const draft = createQuizRecapDraft(deck, resolveImageUrl);
  const payload: QuizRecapPublishPayload = {
    ...draft,
    youtube_url: fields.youtubeUrl,
    thumbnail_url: fields.thumbnailUrl,
    access_codes: {
      part1: fields.part1AccessCode,
      part2: fields.part2AccessCode,
    },
  };
  const publishedAt = now().toISOString();

  if (deck.linkedQuizRecapId) {
    await repository.updateRecap(deck.linkedQuizRecapId, payload);
    await repository.linkDeckToRecap(
      deck.id,
      deck.linkedQuizRecapId,
      publishedAt,
    );
    return {
      recapId: deck.linkedQuizRecapId,
      publishedAt,
      operation: "updated",
    };
  }

  const recap = await repository.createRecap(payload);
  await repository.linkDeckToRecap(deck.id, recap.id, publishedAt);
  return { recapId: recap.id, publishedAt, operation: "created" };
}
