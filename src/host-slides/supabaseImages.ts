import { supabase } from "@/supabaseClient";

const QUIZ_IMAGES_BUCKET = "quiz-images";

function safeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);
  return normalized || "quiz-image";
}

export function resolveHostSlideImageUrl(storagePath: string): string {
  return supabase.storage
    .from(QUIZ_IMAGES_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl;
}

export async function uploadHostSlideImage({
  deckId,
  roundNumber,
  questionNumber,
  file,
}: {
  deckId: string;
  roundNumber: number;
  questionNumber: number;
  file: File;
}): Promise<string> {
  const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeFilename(file.name)}`;
  const storagePath = `host-slides/${deckId}/round-${roundNumber}-q${questionNumber}-${uniqueFilename}`;
  const { error } = await supabase.storage
    .from(QUIZ_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return storagePath;
}

export async function uploadHostDingbatImage({
  deckId,
  position,
  file,
}: {
  deckId: string;
  position: number;
  file: File;
}): Promise<string> {
  const uniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeFilename(file.name)}`;
  const storagePath = `host-slides/${deckId}/dingbats/dingbat-${position}-${uniqueFilename}`;
  const { error } = await supabase.storage
    .from(QUIZ_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });
  if (error) throw new Error(error.message);
  return storagePath;
}

export async function deleteHostSlideImages(
  storagePaths: readonly string[],
): Promise<void> {
  if (storagePaths.length === 0) return;
  const { error } = await supabase.storage
    .from(QUIZ_IMAGES_BUCKET)
    .remove([...storagePaths]);
  if (error) throw new Error(error.message);
}
