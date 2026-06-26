export const HOST_QA_ALLOWED_TERMS = [
  "Geberal",
  "QuizHub",
  "Dingbats",
  "Jay's",
  "Patreon",
  "Streamlabs",
  "YouTube",
  "Facebook",
  "Tiebreak",
  "Tie-break",
  "UK",
  "USA",
  "BBC",
  "NHS",
  "YMCA",
  "FIFA",
  "F1",
] as const;

export const HOST_QA_CONFIDENT_SPELLING_FIXES: Readonly<Record<string, string>> =
  {
    WHat: "What",
    speeling: "spelling",
    Speeling: "Spelling",
    Manilla: "Manila",
    manilla: "Manila",
  };

export const HOST_QA_REVIEW_ONLY_SPELLINGS = [
  "qestion",
  "quesiton",
  "teh",
] as const;
