export function normalizeYouTubeInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If user pasted full URL, keep it (basic).
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Assume it's a video id (11 chars typical, but don't hard-enforce)
  // Standardize to a watch URL
  return `https://www.youtube.com/watch?v=${encodeURIComponent(trimmed)}`;
}
