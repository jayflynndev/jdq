import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BraveImageSearchProvider,
  candidateImageStoragePath,
  getConfiguredImageSearchProvider,
  isImageWithinImportLimit,
  isImportableImageContentType,
  parseBraveImageSearchResult,
  parseImageSearchResult,
  UnavailableImageSearchProvider,
} from "@/src/host-slides/imageSearch";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("image search helpers", () => {
  it("returns unavailable when no image search provider is configured", async () => {
    await expect(
      new UnavailableImageSearchProvider().searchImages({
        searchTerm: "Tom Hanks portrait",
        imageType: "portrait",
        orientation: "portrait",
        crop: "headshot",
        deckId: "deck-1",
        questionId: "q1",
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      candidates: [],
    });
  });

  it("maps provider candidate responses and limits to three results", () => {
    const result = parseImageSearchResult({
      status: "completed",
      candidates: [1, 2, 3, 4].map((index) => ({
        id: `candidate-${index}`,
        thumbnailUrl: `https://example.com/thumb-${index}.jpg`,
        imageUrl: `https://example.com/image-${index}.jpg`,
        sourceUrl: `https://example.com/source-${index}`,
        sourceName: "Example",
        width: 1200,
        height: 800,
        title: `Candidate ${index}`,
      })),
    });

    expect(result.status).toBe("completed");
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[0]).toMatchObject({
      id: "candidate-1",
      sourceName: "Example",
      width: 1200,
      height: 800,
    });
  });

  it("validates importable image content types", () => {
    expect(isImportableImageContentType("image/jpeg")).toBe(true);
    expect(isImportableImageContentType("image/png; charset=binary")).toBe(true);
    expect(isImportableImageContentType("text/html")).toBe(false);
  });

  it("validates candidate import size limits", () => {
    expect(isImageWithinImportLimit(1024)).toBe(true);
    expect(isImageWithinImportLimit(9 * 1024 * 1024)).toBe(false);
  });

  it("uses the existing host slide question image storage path convention", () => {
    expect(
      candidateImageStoragePath({
        deckId: "deck-1",
        roundNumber: 2,
        questionNumber: 4,
        safeFilename: "Tom Hanks Portrait.JPG",
      }),
    ).toMatch(
      /^host-slides\/deck-1\/round-2-q4-\d+-[a-f0-9]{8}-tom-hanks-portrait\.jpg$/,
    );
  });

  it("maps Brave image results into candidates and limits to three", () => {
    const result = parseBraveImageSearchResult({
      results: [1, 2, 3, 4].map((index) => ({
        title: `Result ${index}`,
        url: `https://source.example.com/page-${index}`,
        thumbnail: { src: `https://thumb.example.com/${index}.jpg` },
        properties: {
          url: `https://image.example.com/${index}.jpg`,
          width: 1200 + index,
          height: 800 + index,
        },
        profile: { name: "Example Source" },
      })),
    });

    expect(result.status).toBe("completed");
    expect(result.candidates[0]).toMatchObject({
      id: "brave-1-source.example.com",
      thumbnailUrl: "https://thumb.example.com/1.jpg",
      imageUrl: "https://image.example.com/1.jpg",
      sourceUrl: "https://source.example.com/page-1",
      sourceName: "Example Source",
      width: 1201,
      height: 801,
      title: "Result 1",
    });
    expect(result.candidates).toHaveLength(3);
  });

  it("calls Brave Image Search with safe UK English parameters", async () => {
    const fetchMock = vi.fn(
      async (...args: [URL | RequestInfo, RequestInit?]) => {
        void args;
        return (
      Response.json({
        results: [
          {
            title: "Tom Hanks",
            url: "https://example.com/tom-hanks",
            thumbnail: { src: "https://example.com/tom-hanks-thumb.jpg" },
            properties: {
              url: "https://example.com/tom-hanks.jpg",
              width: 900,
              height: 1200,
            },
          },
        ],
      })
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new BraveImageSearchProvider(
      "brave-key",
      "https://api.search.brave.com/res/v1/images/search",
    ).searchImages({
      searchTerm: "Tom Hanks portrait",
      imageType: "portrait",
      orientation: "portrait",
      crop: "headshot",
      deckId: "deck-1",
      questionId: "q1",
    });

    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("Expected fetch call");
    const [url, init] = call;
    if (!(url instanceof URL)) throw new Error("Expected URL");
    expect(url.searchParams.get("q")).toBe("Tom Hanks portrait");
    expect(url.searchParams.get("count")).toBe("3");
    expect(url.searchParams.get("safesearch")).toBe("strict");
    expect(url.searchParams.get("country")).toBe("gb");
    expect(url.searchParams.get("search_lang")).toBe("en");
    expect(init?.headers).toMatchObject({
      "X-Subscription-Token": "brave-key",
      Accept: "application/json",
    });
    expect(result.candidates).toHaveLength(1);
  });

  it("reports missing Brave API key from provider config", async () => {
    vi.stubEnv("HOST_SLIDES_IMAGE_SEARCH_PROVIDER", "brave");
    vi.stubEnv("HOST_SLIDES_IMAGE_SEARCH_API_KEY", "");

    await expect(
      getConfiguredImageSearchProvider().searchImages({
        searchTerm: "Sydney Opera House daylight",
        imageType: "landmark",
        orientation: "landscape",
        crop: "wide",
        deckId: "deck-1",
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      message: "Missing HOST_SLIDES_IMAGE_SEARCH_API_KEY",
    });
  });

  it("reports Brave API 401 specifically", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unauthorized", { status: 401 })),
    );

    await expect(
      new BraveImageSearchProvider("bad-key").searchImages({
        searchTerm: "Tom Hanks portrait",
        imageType: "portrait",
        orientation: "portrait",
        crop: "headshot",
        deckId: "deck-1",
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      message: "Brave API returned 401",
    });
  });
});
