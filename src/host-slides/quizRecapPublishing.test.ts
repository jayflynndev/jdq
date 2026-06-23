import { describe, expect, it, vi } from "vitest";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import { UnsupportedQuizRecapDeckError } from "@/src/host-slides/quizRecapAdapter";
import {
  publishHostDeckToQuizRecap,
  type QuizRecapPublishingFields,
  type QuizRecapPublishingRepository,
} from "@/src/host-slides/quizRecapPublishing";
import type { HostDeck } from "@/src/host-slides/types";

function getDeck(quizType: HostDeck["quizType"]): HostDeck {
  const deck = mockHostSlideDecks.find(
    (candidate) => candidate.quizType === quizType,
  );
  if (!deck) throw new Error(`Missing ${quizType} mock deck`);
  return structuredClone(deck);
}

const fields: QuizRecapPublishingFields = {
  part1AccessCode: "PART-ONE",
  part2AccessCode: "PART-TWO",
  youtubeUrl: "https://www.youtube.com/watch?v=quiz",
  thumbnailUrl: "https://images.example.test/thumbnail.jpg",
};

function createRepository(): QuizRecapPublishingRepository & {
  createRecap: ReturnType<typeof vi.fn>;
  updateRecap: ReturnType<typeof vi.fn>;
  linkDeckToRecap: ReturnType<typeof vi.fn>;
} {
  return {
    createRecap: vi.fn().mockResolvedValue({ id: "recap-1" }),
    updateRecap: vi.fn().mockResolvedValue(undefined),
    linkDeckToRecap: vi.fn().mockResolvedValue(undefined),
  };
}

const publishDate = new Date("2026-06-23T10:30:00.000Z");
const resolveImageUrl = (path: string) => `https://images.example.test/${path}`;

describe("publishHostDeckToQuizRecap", () => {
  it("creates and links a recap on first publish", async () => {
    const deck = getDeck("thursday");
    const repository = createRepository();

    const result = await publishHostDeckToQuizRecap({
      deck,
      fields,
      resolveImageUrl,
      repository,
      now: () => publishDate,
    });

    expect(result).toEqual({
      recapId: "recap-1",
      publishedAt: publishDate.toISOString(),
      operation: "created",
    });
    expect(repository.createRecap).toHaveBeenCalledOnce();
    expect(repository.updateRecap).not.toHaveBeenCalled();
    expect(repository.linkDeckToRecap).toHaveBeenCalledWith(
      deck.id,
      "recap-1",
      publishDate.toISOString(),
    );
  });

  it("updates the linked recap on subsequent publish", async () => {
    const deck = {
      ...getDeck("saturday"),
      linkedQuizRecapId: "existing-recap",
    };
    const repository = createRepository();

    const result = await publishHostDeckToQuizRecap({
      deck,
      fields,
      resolveImageUrl,
      repository,
      now: () => publishDate,
    });

    expect(result.operation).toBe("updated");
    expect(result.recapId).toBe("existing-recap");
    expect(repository.createRecap).not.toHaveBeenCalled();
    expect(repository.updateRecap).toHaveBeenCalledWith(
      "existing-recap",
      expect.objectContaining({ quiz_day: "Saturday" }),
    );
  });

  it("rejects Patreon without calling the repository", async () => {
    const repository = createRepository();

    await expect(
      publishHostDeckToQuizRecap({
        deck: getDeck("patreon"),
        fields,
        resolveImageUrl,
        repository,
      }),
    ).rejects.toBeInstanceOf(UnsupportedQuizRecapDeckError);
    expect(repository.createRecap).not.toHaveBeenCalled();
    expect(repository.updateRecap).not.toHaveBeenCalled();
    expect(repository.linkDeckToRecap).not.toHaveBeenCalled();
  });

  it("does not create a duplicate after the first publish is linked", async () => {
    const deck = getDeck("thursday");
    const repository = createRepository();

    const first = await publishHostDeckToQuizRecap({
      deck,
      fields,
      resolveImageUrl,
      repository,
    });
    deck.linkedQuizRecapId = first.recapId;
    await publishHostDeckToQuizRecap({
      deck,
      fields,
      resolveImageUrl,
      repository,
    });

    expect(repository.createRecap).toHaveBeenCalledTimes(1);
    expect(repository.updateRecap).toHaveBeenCalledTimes(1);
    expect(repository.updateRecap).toHaveBeenCalledWith(
      "recap-1",
      expect.any(Object),
    );
  });
});
