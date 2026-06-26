import { NextResponse } from "next/server";
import {
  getConfiguredImageSearchProvider,
  type HostImageSearchRequest,
} from "@/src/host-slides/imageSearch";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown): HostImageSearchRequest | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.searchTerm !== "string" ||
    typeof value.imageType !== "string" ||
    typeof value.crop !== "string" ||
    typeof value.deckId !== "string" ||
    (value.orientation !== "portrait" &&
      value.orientation !== "landscape" &&
      value.orientation !== "square" &&
      value.orientation !== "any") ||
    (value.questionId !== undefined && typeof value.questionId !== "string")
  ) {
    return null;
  }
  return {
    searchTerm: value.searchTerm,
    imageType: value.imageType,
    orientation: value.orientation,
    crop: value.crop,
    deckId: value.deckId,
    ...(typeof value.questionId === "string"
      ? { questionId: value.questionId }
      : {}),
  };
}

export async function POST(request: Request) {
  const searchRequest = parseRequest(await request.json());
  if (!searchRequest) {
    return NextResponse.json(
      { error: "Invalid image search request." },
      { status: 400 },
    );
  }

  const provider = getConfiguredImageSearchProvider();
  const result = await provider.searchImages(searchRequest);
  return NextResponse.json(result);
}
