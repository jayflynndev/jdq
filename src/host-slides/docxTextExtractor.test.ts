import { describe, expect, it, vi } from "vitest";
import {
  DocxImportError,
  extractTextFromDocx,
  reconstructQuizTextFromMammothHtml,
  type DocxFileLike,
  type MammothHtmlConverter,
} from "@/src/host-slides/docxTextExtractor";
import { parseJayQuizText } from "@/src/host-slides/jayQuizTextParser";

function file(name = "quiz.docx"): DocxFileLike {
  return {
    name,
    arrayBuffer: async () => new ArrayBuffer(8),
  };
}

describe("extractTextFromDocx", () => {
  it("rejects files without a DOCX extension", async () => {
    const extractor = vi.fn<MammothHtmlConverter>();

    await expect(
      extractTextFromDocx(file("quiz.doc"), extractor),
    ).rejects.toThrow("Choose a valid .docx Word document.");
    expect(extractor).not.toHaveBeenCalled();
  });

  it("normalizes and trims extracted text", async () => {
    const extractor: MammothHtmlConverter = async () => ({
      value:
        "<p>Jays Quiz Live Thursday 25th June</p><p>Round One</p>",
    });

    await expect(extractTextFromDocx(file(), extractor)).resolves.toBe(
      "Jays Quiz Live Thursday 25th June\nRound One",
    );
  });

  it("rejects an empty DOCX", async () => {
    const extractor: MammothHtmlConverter = async () => ({ value: "<p> </p>" });

    await expect(extractTextFromDocx(file(), extractor)).rejects.toBeInstanceOf(
      DocxImportError,
    );
    await expect(extractTextFromDocx(file(), extractor)).rejects.toThrow(
      "contains no readable text",
    );
  });

  it("wraps corrupt DOCX extraction failures", async () => {
    const extractor: MammothHtmlConverter = async () => {
      throw new Error("Invalid ZIP central directory");
    };

    await expect(extractTextFromDocx(file(), extractor)).rejects.toThrow(
      "not a valid readable DOCX",
    );
  });

  it("reconstructs Word automatic numbering from ordered list items", () => {
    const text = reconstructQuizTextFromMammothHtml(
      "<p>Round One</p><ol><li>First question? First answer</li><li><p>Second question? Second answer</p></li></ol>",
    );

    expect(text).toBe(
      "Round One\n1. First question? First answer\n2. Second question? Second answer",
    );
  });

  it("does not invent numbering for ordinary question-like paragraphs", () => {
    expect(
      reconstructQuizTextFromMammothHtml(
        "<p>Round One</p><p>Question without a list marker? Answer</p>",
      ),
    ).toBe("Round One\nQuestion without a list marker? Answer");
  });

  it("feeds reconstructed numbered list items into the existing parser", () => {
    const roundHtml = Array.from(
      { length: 5 },
      (_, index) =>
        `<p>Round ${index + 1}</p><ol><li>Question for round ${index + 1}? Answer ${index + 1}</li></ol>`,
    ).join("");
    const text = reconstructQuizTextFromMammothHtml(
      `<p>Jays Quiz Live Thursday 25th June</p>${roundHtml}`,
    );

    const deck = parseJayQuizText(text, { strictStandardShape: false });

    expect(deck.rounds).toHaveLength(5);
    expect(deck.rounds.every((round) => round.questions.length === 1)).toBe(
      true,
    );
  });
});
