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
