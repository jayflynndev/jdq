import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpLanguageReviewer,
  PRODUCTION_REVIEW_STAGES,
  runPresenterReview,
  runFactReview,
  runImageSuggestionReview,
  runConnectionReview,
  runLanguageReview,
  runProductionReview,
  runProductionReviewStage,
} from "@/src/host-slides/productionReview";
import { evaluateHostDeckReadiness } from "@/src/host-slides/readiness";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import type { HostDeck } from "@/src/host-slides/types";
import type {
  LanguageReviewFinding,
  LanguageReviewRequest,
  LanguageReviewer,
  FactReviewer,
  ImageSuggestionProvider,
  ConnectionReviewer,
} from "@/src/host-slides/productionReview";

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

  it("returns unavailable when an AI provider is not configured", async () => {
    const result = await runProductionReviewStage(
      deck(),
      "fact_review",
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

  it("readiness warns when Production Review has not run", () => {
    const subject = deck();
    subject.qaFindings = [];
    delete subject.productionReview;

    expect(evaluateHostDeckReadiness(subject).warnings).toContainEqual(
      expect.objectContaining({ code: "production_review_not_run" }),
    );
  });
});

describe("Producer AI stages", () => {
  it("maps fact review findings with confidence", async () => {
    const subject = deck();
    const reviewer: FactReviewer = {
      async reviewFacts(request) {
        return {
          status: "completed",
          findings: [
            {
              itemId: request.items[0].id,
              severity: "warning",
              message: "Alternative accepted answer may be needed.",
              confidence: 0.72,
            },
          ],
        };
      },
    };

    const result = await runFactReview(subject, reviewer);

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        source: "AI_FACT",
        category: "fact_review",
        confidence: 0.72,
      }),
    );
  });

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

  it("reviews Round 4 connections only", async () => {
    const subject = deck();
    const reviewer: ConnectionReviewer = {
      async reviewConnections(request) {
        expect(request.roundNumber).toBe(4);
        return {
          status: "completed",
          findings: [
            {
              itemId: request.items[0].id,
              severity: "warning",
              message: "This answer may reveal the connection too early.",
              confidence: 0.81,
            },
          ],
        };
      },
    };

    const result = await runConnectionReview(subject, reviewer);

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        source: "AI_CONNECTION",
        category: "connection_round",
        roundNumber: 4,
        confidence: 0.81,
      }),
    );
  });
});

describe("Language Review", () => {
  function reviewer(
    handler: (request: LanguageReviewRequest) => LanguageReviewFinding[],
  ): LanguageReviewer {
    return {
      async reviewLanguage(request) {
        return handler(request);
      },
    };
  }

  it("returns no findings when the provider returns none", async () => {
    await expect(runLanguageReview(deck(), reviewer(() => []))).resolves.toEqual(
      [],
    );
  });

  it("returns wording findings from a mock provider", async () => {
    const findings = await runLanguageReview(
      deck(),
      reviewer((request) => {
        const item = request.items.find(
          (candidate) => candidate.field === "question",
        );
        if (!item) throw new Error("Expected question item");
        return [
          {
            itemId: item.id,
            severity: "warning",
            category: "grammar",
            message: "Awkward wording may confuse players.",
          },
        ];
      }),
    );

    expect(findings).toContainEqual(
      expect.objectContaining({
        source: "AI_LANGUAGE",
        severity: "warning",
        category: "grammar",
        message: expect.stringContaining("Awkward wording"),
      }),
    );
  });

  it("returns ambiguity findings without changing the deck", async () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "Which country is Everest in?";

    const findings = await runLanguageReview(
      subject,
      reviewer((request) => {
        const item = request.items.find(
          (candidate) => candidate.text === "Which country is Everest in?",
        );
        if (!item) throw new Error("Expected Everest question");
        return [
          {
            itemId: item.id,
            severity: "warning",
            category: "grammar",
            message: "Possible ambiguity.",
            suggestedText:
              "Mount Everest lies on the border of which two countries?",
          },
        ];
      }),
    );

    expect(subject.rounds[0].questions[0].prompt).toBe(
      "Which country is Everest in?",
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("Possible ambiguity."),
        suggestedFix: expect.objectContaining({
          field: "question",
          value: "Mount Everest lies on the border of which two countries?",
        }),
      }),
    );
  });

  it("formats suggestions as safe replacement text", async () => {
    const findings = await runLanguageReview(
      deck(),
      reviewer((request) => {
        const item = request.items.find(
          (candidate) => candidate.field === "round_title",
        );
        if (!item) throw new Error("Expected round title item");
        return [
          {
            itemId: item.id,
            severity: "info",
            category: "grammar",
            message: "Capitalisation is inconsistent.",
            suggestedText: "General Knowledge",
          },
        ];
      }),
    );

    expect(findings[0]?.suggestedFix).toEqual({
      type: "replace_text",
      field: "round_title",
      value: "General Knowledge",
      description: "Replace with: General Knowledge",
    });
  });

  it("does not throw when the HTTP language provider is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Provider failed", { status: 502 })),
    );

    await expect(
      new HttpLanguageReviewer("/test-language-review").reviewLanguage({
        deckId: "deck-1",
        quizTitle: "Test Quiz",
        quizType: "thursday",
        instructions: "Review wording only.",
        items: [],
      }),
    ).resolves.toEqual([]);
  });
});
