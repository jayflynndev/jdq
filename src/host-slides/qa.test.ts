import { describe, expect, it } from "vitest";
import { applyHostQaFix, runHostDeckQa } from "@/src/host-slides/qa";
import { mockHostSlideDecks } from "@/src/host-slides/mockDecks";
import type { HostDeck } from "@/src/host-slides/types";

function deck(): HostDeck {
  return structuredClone(mockHostSlideDecks[0]);
}

describe("runHostDeckQa", () => {
  it('catches trailing answer question marks such as "Ben Johnson?"', () => {
    const subject = deck();
    subject.rounds[0].questions[0].answer = "Ben Johnson?";

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "suspicious_answer",
        targetType: "answer",
        roundNumber: 1,
        questionNumber: 1,
      }),
    );
  });

  it('suggests replacing "WHat" with "What"', () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "WHat is the capital of France?";

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "spelling",
        suggestedFix: expect.objectContaining({
          field: "question",
          value: "What is the capital of France?",
        }),
      }),
    );
  });

  it('suggests replacing "speeling" with "spelling"', () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "Fix the speeling mistake.";

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "spelling",
        suggestedFix: expect.objectContaining({
          field: "question",
          value: "Fix the spelling mistake.",
        }),
      }),
    );
  });

  it("detects repeated words", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "What is the the answer?";

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "grammar",
        message: expect.stringContaining('repeats the word "the"'),
      }),
    );
  });

  it("detects a space before a question mark", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "What is this ?";

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "punctuation",
        suggestedFix: expect.objectContaining({ value: "What is this?" }),
      }),
    );
  });

  it("detects duplicate question and answer text", () => {
    const subject = deck();
    subject.rounds[0].questions[1].prompt = subject.rounds[0].questions[0].prompt;
    subject.rounds[1].questions[0].answer = subject.rounds[0].questions[0].answer;

    const findings = runHostDeckQa(subject);

    expect(
      findings.filter((finding) => finding.category === "duplicate_question"),
    ).toHaveLength(2);
    expect(
      findings.filter((finding) => finding.category === "duplicate_answer"),
    ).toHaveLength(2);
  });

  it("does not flag the intentionally misspelled Geberal Knowledge title", () => {
    const subject = deck();
    subject.rounds[0].title = "Geberal Knowledge";

    expect(JSON.stringify(runHostDeckQa(subject))).not.toContain("Geberal");
  });

  it("does not flag common quiz abbreviations", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt =
      "Which UK, USA, BBC, NHS and F1 clues connect?";

    expect(JSON.stringify(runHostDeckQa(subject))).not.toMatch(
      /\b(UK|USA|BBC|NHS|F1)\b/,
    );
  });

  it("does not flag custom dictionary terms", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt =
      "QuizHub Dingbats Jay's Patreon Streamlabs YouTube Facebook Tiebreak Tie-break";

    expect(JSON.stringify(runHostDeckQa(subject))).not.toMatch(
      /QuizHub|Dingbats|Patreon|Streamlabs|YouTube|Facebook|Tiebreak|Tie-break/,
    );
  });

  it("creates review-only spelling findings for uncertain words", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "This qestion needs review.";

    const finding = runHostDeckQa(subject).find(
      (candidate) =>
        candidate.category === "spelling" &&
        candidate.message.includes("qestion"),
    );

    expect(finding).toBeDefined();
    expect(finding?.suggestedFix).toBeUndefined();
  });

  it("checks connection round question 10 for link wording", () => {
    const subject = deck();
    subject.rounds[4].questions = Array.from({ length: 10 }, (_, index) => ({
      id: `connection-q${index + 1}`,
      prompt:
        index === 9
          ? "What do these answers have in common?"
          : `Connection prompt ${index + 1}?`,
      answer: `Answer ${index + 1}`,
    }));

    expect(runHostDeckQa(subject)).toContainEqual(
      expect.objectContaining({
        category: "connection_round",
        roundNumber: 5,
        questionNumber: 10,
      }),
    );
  });
});

describe("applyHostQaFix", () => {
  it("applies safe question text replacements and marks the finding fixed", () => {
    const subject = deck();
    subject.rounds[0].questions[0].prompt = "WHat is the capital of France?";
    subject.qaFindings = runHostDeckQa(subject);
    const finding = subject.qaFindings.find(
      (candidate) => candidate.category === "spelling",
    );
    if (!finding) throw new Error("Expected spelling finding");

    const fixed = applyHostQaFix(subject, finding.id, "2026-06-26T10:00:00Z");

    expect(fixed.rounds[0].questions[0].prompt).toBe(
      "What is the capital of France?",
    );
    expect(fixed.qaFindings?.find((candidate) => candidate.id === finding.id))
      .toMatchObject({
        status: "fixed",
        updatedAt: "2026-06-26T10:00:00Z",
      });
  });
});
