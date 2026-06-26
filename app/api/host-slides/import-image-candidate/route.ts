import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  candidateImageStoragePath,
  HOST_IMAGE_CANDIDATE_MAX_BYTES,
  imageCandidateImportResult,
  isImageWithinImportLimit,
  isImportableImageContentType,
  type HostImageCandidateImportRequest,
} from "@/src/host-slides/imageSearch";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown): HostImageCandidateImportRequest | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.imageUrl !== "string" ||
    typeof value.sourceUrl !== "string" ||
    typeof value.deckId !== "string" ||
    typeof value.roundNumber !== "number" ||
    typeof value.questionNumber !== "number" ||
    (value.safeFilename !== undefined && typeof value.safeFilename !== "string")
  ) {
    return null;
  }
  return {
    imageUrl: value.imageUrl,
    sourceUrl: value.sourceUrl,
    deckId: value.deckId,
    roundNumber: value.roundNumber,
    questionNumber: value.questionNumber,
    ...(typeof value.safeFilename === "string"
      ? { safeFilename: value.safeFilename }
      : {}),
  };
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  const importRequest = parseRequest(await request.json());
  if (!importRequest) {
    return NextResponse.json(
      { error: "Invalid image import request." },
      { status: 400 },
    );
  }

  const imageUrl = parseHttpUrl(importRequest.imageUrl);
  const sourceUrl = parseHttpUrl(importRequest.sourceUrl);
  if (!imageUrl || !sourceUrl) {
    return NextResponse.json(
      { error: "Candidate image and source URLs must be http(s)." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Image import storage is not configured." },
      { status: 503 },
    );
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Could not download selected image." },
      { status: 502 },
    );
  }

  const contentType = imageResponse.headers.get("content-type") ?? "";
  if (!isImportableImageContentType(contentType)) {
    return NextResponse.json(
      { error: "Selected URL did not return an image." },
      { status: 415 },
    );
  }

  const contentLength = Number(imageResponse.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    !isImageWithinImportLimit(contentLength)
  ) {
    return NextResponse.json(
      { error: "Selected image is too large." },
      { status: 413 },
    );
  }

  const bytes = await imageResponse.arrayBuffer();
  if (!isImageWithinImportLimit(bytes.byteLength)) {
    return NextResponse.json(
      {
        error: `Selected image is too large. Limit is ${HOST_IMAGE_CANDIDATE_MAX_BYTES} bytes.`,
      },
      { status: 413 },
    );
  }

  const storagePath = candidateImageStoragePath(importRequest);
  const { error } = await supabase.storage
    .from("quiz-images")
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(imageCandidateImportResult(storagePath));
}
