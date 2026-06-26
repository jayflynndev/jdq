function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function openAiErrorDetail(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  const { message, param, code } = value.error;
  const parts = [
    typeof message === "string" ? message : null,
    typeof param === "string" ? `param: ${param}` : null,
    typeof code === "string" ? `code: ${code}` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function openAiUnavailableMessage(
  response: Response,
  label: string,
): Promise<string> {
  try {
    const detail = openAiErrorDetail(await response.clone().json());
    return detail
      ? `${label} returned ${response.status}: ${detail}`
      : `${label} returned ${response.status}`;
  } catch {
    return `${label} returned ${response.status}`;
  }
}

export function openAiReviewTimeoutMs(): number {
  const configured = Number(process.env.OPENAI_REVIEW_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured >= 1000) {
    return Math.min(configured, 55000);
  }
  return 25000;
}

export async function fetchOpenAiReview(
  input: string,
  init: RequestInit,
): Promise<Response | { timedOut: true; timeoutMs: number }> {
  const timeoutMs = openAiReviewTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return { timedOut: true, timeoutMs };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
