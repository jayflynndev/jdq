import mammoth from "mammoth";

export type DocxFileLike = {
  name: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type MammothHtmlConverter = (input: {
  arrayBuffer: ArrayBuffer;
}) => Promise<{ value: string }>;

export class DocxImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocxImportError";
  }
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Readonly<Record<string, string>> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, key: string) => {
      if (key.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
      }
      if (key.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
      }
      return namedEntities[key.toLowerCase()] ?? entity;
    },
  );
}

/**
 * Mammoth omits Word's automatic list markers from raw text, but preserves
 * their semantics in HTML. Reconstruct numbers only for actual ordered-list
 * items; ordinary paragraphs remain ordinary paragraphs for the Jay parser.
 */
export function reconstructQuizTextFromMammothHtml(html: string): string {
  const lines: string[] = [];
  const listStack: Array<{ ordered: boolean; nextNumber: number }> = [];
  let currentLine = "";
  let listItemDepth = 0;

  const flushLine = () => {
    const line = currentLine.replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
    currentLine = "";
  };

  const tokens = html.match(/<[^>]*>|[^<]+/g) ?? [];
  tokens.forEach((token) => {
    if (!token.startsWith("<")) {
      currentLine += decodeHtmlEntities(token);
      return;
    }

    const tag = token.toLowerCase();
    if (/^<ol\b/.test(tag)) {
      const start = tag.match(/\bstart=["']?(\d+)/)?.[1];
      listStack.push({
        ordered: true,
        nextNumber: start ? Number(start) : 1,
      });
      return;
    }
    if (/^<ul\b/.test(tag)) {
      listStack.push({ ordered: false, nextNumber: 1 });
      return;
    }
    if (tag === "</ol>" || tag === "</ul>") {
      flushLine();
      listStack.pop();
      return;
    }
    if (/^<li\b/.test(tag)) {
      flushLine();
      listItemDepth += 1;
      const list = listStack.at(-1);
      if (list?.ordered) {
        currentLine = `${list.nextNumber}. `;
        list.nextNumber += 1;
      }
      return;
    }
    if (tag === "</li>") {
      flushLine();
      listItemDepth = Math.max(0, listItemDepth - 1);
      return;
    }
    if (/^<p\b/.test(tag)) {
      if (listItemDepth === 0) flushLine();
      return;
    }
    if (tag === "</p>") {
      if (listItemDepth === 0) flushLine();
      return;
    }
    if (/^<br\s*\/?\s*>$/.test(tag)) flushLine();
  });
  flushLine();

  return lines.join("\n").trim();
}

export async function extractTextFromDocx(
  file: DocxFileLike,
  convertToHtml: MammothHtmlConverter = mammoth.convertToHtml,
): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new DocxImportError("Choose a valid .docx Word document.");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await convertToHtml({ arrayBuffer });
    const text = reconstructQuizTextFromMammothHtml(result.value);
    if (!text) {
      throw new DocxImportError("The selected DOCX contains no readable text.");
    }
    return text;
  } catch (error: unknown) {
    if (error instanceof DocxImportError) throw error;
    throw new DocxImportError(
      "The selected file is not a valid readable DOCX document.",
    );
  }
}
