import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCTION_REVIEW_STAGES,
  runPresenterReview,
  runImageSuggestionReview,
  runProductionReview,
  runProductionReviewStage,
} from "@/src/host-slides/productionReview";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import type { HostDeck } from "@/src/host-slides/types";
import type { ImageSuggestionProvider } from "@/src/host-slides/productionReview";

function deck(): HostDeck {
  return structuredClone(mockHostSlideDecks[0]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProductionReviewEngine", () => {
  it("runs the configured production review stages", async () => {
    const result = await runProductionReview(deck(), "2026-06-26T10:00:00Z");

    expect(result.completedAt).toBe("2026-06-26T10:00:00Z");
    expect(result.stages.map((stage) => stage.id)).toEqual(
      PRODUCTION_REVIEW_STAGES.map((stage) => stage.id),
    );
  });

  it("keeps deterministic QA as the first working stage", async () => {
    const subject = deck();
    subject.rounds[0].questions[0].answer = "";

    const result = await runProductionReviewStage(
      subject,
      "structural_qa",
      "2026-06-26T10:00:00Z",
    );

    expect(result.stage.status).toBe("completed");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        category: "missing_answer",
        source: "LOCAL",
      }),
    );
  });

  it("returns presenter review warnings from local rules", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt =
      "This is an intentionally very long question designed to represent a presenter slide that would be awkward to read comfortably on screen while Jay is hosting the quiz and trying to keep the pace moving for the audience.";

    expect(runPresenterReview(subject)).toContainEqual(
      expect.objectContaining({
        category: "show_flow",
        severity: "warning",
        source: "AI_PRESENTER",
        message: expect.stringContaining("too long"),
      }),
    );
  });

  it("returns unavailable when image suggestions are not configured", async () => {
    const result = await runProductionReviewStage(
      deck(),
      "image_suggestions",
      "2026-06-26T10:00:00Z",
    );

    expect(result.stage).toMatchObject({
      status: "unavailable",
      message: "Unavailable",
      findingsCount: 0,
    });
    expect(result.findings).toEqual([]);
  });

  it("stores combined deterministic and presenter findings", async () => {
    const subject = deck();
    subject.rounds[0].questions[0].answer = "";
    subject.rounds[0].questions[1].answer =
      "This answer is deliberately long enough to be awkward on a presenter slide reveal because it contains lots of extra explanatory words.";

    const result = await runProductionReview(subject);

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "LOCAL" }),
        expect.objectContaining({ source: "AI_PRESENTER" }),
      ]),
    );
  });

  it("does not call removed OpenAI review routes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider: ImageSuggestionProvider = {
      async suggestImages() {
        return { status: "completed", findings: [] };
      },
    };

    await runProductionReview(deck(), "2026-06-26T10:00:00Z", {
      imageSuggestionProvider: provider,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("readiness warns when Production Review has not run", () => {
    const subject = deck();
    subject.qaFindings = [];
    delete subject.productionReview;

    expect(evaluateHostDeckReadiness(subject).warnings).toContainEqual(
      expect.objectContaining({ code: "production_review_not_run" }),
    );
  });
});

describe("Image Suggestions", () => {
  it("generates image search suggestions for picture questions without images", async () => {
    const subject = deck();
    const provider: ImageSuggestionProvider = {
      async suggestImages(request) {
        return {
          status: "completed",
          findings: request.items.map((item) => ({
            itemId: item.id,
            searchTerm: `${item.answer} portrait`,
            imageType: "portrait",
            orientation: "portrait",
            crop: "headshot",
          })),
        };
      },
    };

    const result = await runImageSuggestionReview(subject, provider);

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        source: "AI_IMAGE",
        category: "image_suggestion",
        imageSuggestion: expect.objectContaining({
          searchTerm: "Olivia Colman portrait",
          crop: "headshot",
        }),
      }),
    );
  });
});
