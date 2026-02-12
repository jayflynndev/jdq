export type AnswerMarkRow = {
  key: string; // "1", "2", etc.
  answer: unknown;
  mark: unknown; // true/false/null/undefined
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function keysFromObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
) {
  const s = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  // numeric-ish sort first
  return Array.from(s).sort((x, y) => {
    const nx = Number(x);
    const ny = Number(y);
    const ax = Number.isFinite(nx) ? nx : null;
    const ay = Number.isFinite(ny) ? ny : null;
    if (ax !== null && ay !== null) return ax - ay;
    return x.localeCompare(y);
  });
}

export function buildAnswerMarkRows(
  answers: unknown,
  marks: unknown,
): AnswerMarkRow[] {
  const aObj: Record<string, unknown> = isRecord(answers) ? answers : {};

  const mObj: Record<string, unknown> = isRecord(marks) ? marks : {};

  const keys = keysFromObjects(aObj, mObj);

  return keys.map((k) => ({
    key: k,
    answer: aObj[k],
    mark: mObj[k],
  }));
}

export function renderMarkSymbol(mark: unknown): string {
  if (mark === true) return "✅";
  if (mark === false) return "❌";
  return "—";
}

export function renderAnswer(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
