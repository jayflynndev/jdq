export type HostImageSearchRequest = {
  searchTerm: string;
  imageType: string;
  orientation: "portrait" | "landscape" | "square" | "any";
  crop: string;
  deckId: string;
  questionId?: string;
};

export type HostImageSearchCandidate = {
  id: string;
  thumbnailUrl: string;
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  width?: number;
  height?: number;
  title?: string;
};

export type HostImageSearchResult = {
  status: "completed" | "unavailable";
  candidates: HostImageSearchCandidate[];
  message?: string;
};

export type HostImageCandidateImportRequest = {
  imageUrl: string;
  sourceUrl: string;
  deckId: string;
  roundNumber: number;
  questionNumber: number;
  safeFilename?: string;
};

export type HostImageCandidateImportResult = {
  imageStoragePath: string;
  imageUrl: string;
};

export const HOST_IMAGE_CANDIDATE_MAX_BYTES = 8 * 1024 * 1024;

export interface ImageSearchProvider {
  searchImages(
    request: HostImageSearchRequest,
  ): Promise<HostImageSearchResult>;
}

export class UnavailableImageSearchProvider implements ImageSearchProvider {
  constructor(
    private readonly message = "Image search provider is not configured.",
  ) {}

  async searchImages(
    request: HostImageSearchRequest,
  ): Promise<HostImageSearchResult> {
    void request;
    return {
      status: "unavailable",
      candidates: [],
      message: this.message,
    };
  }
}

export class ConfiguredEndpointImageSearchProvider implements ImageSearchProvider {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
  ) {}

  async searchImages(
    request: HostImageSearchRequest,
  ): Promise<HostImageSearchResult> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ ...request, limit: 3 }),
    });
    if (!response.ok) {
      return {
        status: "unavailable",
        candidates: [],
        message: `Image search provider returned ${response.status}`,
      };
    }
    return parseImageSearchResult(await response.json());
  }
}

export class BraveImageSearchProvider implements ImageSearchProvider {
  constructor(
    private readonly apiKey: string,
    private readonly endpoint = "https://api.search.brave.com/res/v1/images/search",
  ) {}

  async searchImages(
    request: HostImageSearchRequest,
  ): Promise<HostImageSearchResult> {
    const url = new URL(this.endpoint);
    url.searchParams.set("q", request.searchTerm);
    url.searchParams.set("count", "3");
    url.searchParams.set("safesearch", "strict");
    url.searchParams.set("country", "gb");
    url.searchParams.set("search_lang", "en");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
      },
    });
    if (!response.ok) {
      return {
        status: "unavailable",
        candidates: [],
        message:
          response.status === 401
            ? "Brave API returned 401"
            : `Brave Image Search returned ${response.status}`,
      };
    }
    return parseBraveImageSearchResult(await response.json());
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isImageSearchCandidate(
  value: unknown,
): value is HostImageSearchCandidate {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.thumbnailUrl === "string" &&
    typeof value.imageUrl === "string" &&
    typeof value.sourceUrl === "string" &&
    typeof value.sourceName === "string" &&
    (value.width === undefined || typeof value.width === "number") &&
    (value.height === undefined || typeof value.height === "number") &&
    (value.title === undefined || typeof value.title === "string")
  );
}

export function parseImageSearchResult(value: unknown): HostImageSearchResult {
  if (!isRecord(value)) {
    return {
      status: "unavailable",
      candidates: [],
      message: "Invalid image search response.",
    };
  }
  const candidates = Array.isArray(value.candidates)
    ? value.candidates.filter(isImageSearchCandidate).slice(0, 3)
    : [];
  return {
    status: value.status === "completed" ? "completed" : "unavailable",
    candidates,
    ...(typeof value.message === "string" ? { message: value.message } : {}),
  };
}

function stringFromRecord(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.trim()
    ? candidate
    : undefined;
}

function numberFromRecord(
  value: Record<string, unknown>,
  key: string,
): number | undefined {
  const candidate = value[key];
  return typeof candidate === "number" && Number.isFinite(candidate)
    ? candidate
    : undefined;
}

function sourceNameFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

function braveCandidate(
  value: unknown,
  index: number,
): HostImageSearchCandidate | null {
  if (!isRecord(value)) return null;
  const thumbnail = isRecord(value.thumbnail) ? value.thumbnail : undefined;
  const properties = isRecord(value.properties) ? value.properties : undefined;
  const metaUrl = isRecord(value.meta_url) ? value.meta_url : undefined;
  const profile = isRecord(value.profile) ? value.profile : undefined;

  const sourceUrl =
    stringFromRecord(value, "url") ??
    (metaUrl ? stringFromRecord(metaUrl, "url") : undefined);
  const imageUrl =
    (properties ? stringFromRecord(properties, "url") : undefined) ??
    stringFromRecord(value, "image_url") ??
    stringFromRecord(value, "imageUrl");
  const thumbnailUrl =
    (thumbnail ? stringFromRecord(thumbnail, "src") : undefined) ??
    stringFromRecord(value, "thumbnail") ??
    imageUrl;
  if (!sourceUrl || !imageUrl || !thumbnailUrl) return null;

  const sourceName =
    (profile ? stringFromRecord(profile, "name") : undefined) ??
    (metaUrl ? stringFromRecord(metaUrl, "hostname") : undefined) ??
    sourceNameFromUrl(sourceUrl);

  return {
    id: `brave-${index + 1}-${sourceNameFromUrl(sourceUrl)}`,
    thumbnailUrl,
    imageUrl,
    sourceUrl,
    sourceName,
    ...(properties && numberFromRecord(properties, "width")
      ? { width: numberFromRecord(properties, "width") }
      : {}),
    ...(properties && numberFromRecord(properties, "height")
      ? { height: numberFromRecord(properties, "height") }
      : {}),
    ...(stringFromRecord(value, "title")
      ? { title: stringFromRecord(value, "title") }
      : {}),
  };
}

export function parseBraveImageSearchResult(
  value: unknown,
): HostImageSearchResult {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return {
      status: "unavailable",
      candidates: [],
      message: "Invalid Brave Image Search response.",
    };
  }
  return {
    status: "completed",
    candidates: value.results
      .map(braveCandidate)
      .filter(
        (candidate): candidate is HostImageSearchCandidate =>
          candidate !== null,
      )
      .slice(0, 3),
  };
}

export function getConfiguredImageSearchProvider(): ImageSearchProvider {
  const provider = process.env.HOST_SLIDES_IMAGE_SEARCH_PROVIDER;
  if (provider === "brave") {
    const apiKey = process.env.HOST_SLIDES_IMAGE_SEARCH_API_KEY;
    return apiKey
      ? new BraveImageSearchProvider(apiKey)
      : new UnavailableImageSearchProvider(
          "Missing HOST_SLIDES_IMAGE_SEARCH_API_KEY",
        );
  }

  const endpoint = process.env.HOST_SLIDES_IMAGE_SEARCH_ENDPOINT;
  if (!endpoint) {
    return new UnavailableImageSearchProvider(
      "Image search provider is not configured.",
    );
  }
  return new ConfiguredEndpointImageSearchProvider(
    endpoint,
    process.env.HOST_SLIDES_IMAGE_SEARCH_API_KEY,
  );
}

export function safeImageCandidateFilename(value: string | undefined): string {
  const normalized = (value ?? "candidate-image")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  return normalized || "candidate-image";
}

export function isImportableImageContentType(value: string | null): boolean {
  return Boolean(value?.toLowerCase().startsWith("image/"));
}

export function isImageWithinImportLimit(byteLength: number): boolean {
  return byteLength <= HOST_IMAGE_CANDIDATE_MAX_BYTES;
}

export function candidateImageStoragePath({
  deckId,
  roundNumber,
  questionNumber,
  safeFilename,
}: {
  deckId: string;
  roundNumber: number;
  questionNumber: number;
  safeFilename?: string;
}): string {
  const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeImageCandidateFilename(safeFilename)}`;
  return `host-slides/${deckId}/round-${roundNumber}-q${questionNumber}-${uniqueFilename}`;
}

export function imageCandidateImportResult(
  imageStoragePath: string,
): HostImageCandidateImportResult {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return {
    imageStoragePath,
    imageUrl: supabaseUrl
      ? `${supabaseUrl}/storage/v1/object/public/quiz-images/${imageStoragePath}`
      : imageStoragePath,
  };
}
