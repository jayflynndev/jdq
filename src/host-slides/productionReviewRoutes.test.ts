import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as factReviewPost } from "@/app/api/host-slides/fact-review/route";
import { POST as imageSuggestionsPost } from "@/app/api/host-slides/image-suggestions/route";
import { POST as connectionReviewPost } from "@/app/api/host-slides/connection-review/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function request(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const baseReviewRequest = {
  deckId: "deck-1",
  quizTitle: "Test Quiz",
  quizType: "thursday",
};

describe("Production Review route diagnostics", () => {
  it("reports missing Fact Review model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_FACT_REVIEW_MODEL", "");

    const response = await factReviewPost(
      request({
        ...baseReviewRequest,
        items: [
          {
            id: "q1",
            roundNumber: 1,
            questionNumber: 1,
            question: "Question?",
            answer: "Answer",
            roundTitle: "Round",
            pictureRequired: false,
          },
        ],
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      message: "Missing OPENAI_FACT_REVIEW_MODEL",
    });
  });

  it("reports missing Image Suggestion model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_IMAGE_SUGGESTION_MODEL", "");

    const response = await imageSuggestionsPost(
      request({
        ...baseReviewRequest,
        items: [
          {
            id: "q1",
            roundNumber: 1,
            questionNumber: 1,
            question: "Who is this?",
            answer: "Tom Hanks",
          },
        ],
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      message: "Missing OPENAI_IMAGE_SUGGESTION_MODEL",
    });
  });

  it("reports missing Connection Review model", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_CONNECTION_REVIEW_MODEL", "");

    const response = await connectionReviewPost(
      request({
        ...baseReviewRequest,
        roundNumber: 4,
        roundTitle: "Connections",
        items: [
          {
            id: "q1",
            roundNumber: 4,
            questionNumber: 1,
            question: "Question?",
            answer: "Answer",
          },
        ],
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      message: "Missing OPENAI_CONNECTION_REVIEW_MODEL",
    });
  });

  it("reports OpenAI 400 details without exposing secrets", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_FACT_REVIEW_MODEL", "gpt-test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: {
              message: "The model `gpt-test` does not exist.",
              param: "model",
              code: "model_not_found",
            },
          },
          { status: 400 },
        ),
      ),
    );

    const response = await factReviewPost(
      request({
        ...baseReviewRequest,
        items: [
          {
            id: "q1",
            roundNumber: 1,
            questionNumber: 1,
            question: "Question?",
            answer: "Answer",
            roundTitle: "Round",
            pictureRequired: false,
          },
        ],
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "unavailable",
      message:
        "OpenAI Fact Review returned 400: The model `gpt-test` does not exist. param: model code: model_not_found",
    });
  });

  it("does not send temperature for models that only support the default", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_FACT_REVIEW_MODEL", "gpt-test");
    const fetchMock = vi.fn(
      async (...args: [RequestInfo | URL, RequestInit?]) => {
        void args;
        return Response.json({
          choices: [{ message: { content: '{"findings":[]}' } }],
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    await factReviewPost(
      request({
        ...baseReviewRequest,
        items: [
          {
            id: "q1",
            roundNumber: 1,
            questionNumber: 1,
            question: "Question?",
            answer: "Answer",
            roundTitle: "Round",
            pictureRequired: false,
          },
        ],
      }),
    );

    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("Expected OpenAI fetch");
    const init = call[1];
    if (!init?.body || typeof init.body !== "string") {
      throw new Error("Expected JSON body");
    }
    expect(JSON.parse(init.body)).not.toHaveProperty("temperature");
  });
});
