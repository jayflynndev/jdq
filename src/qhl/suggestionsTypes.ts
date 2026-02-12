export type TeamSuggestionRow = {
  round_index: number;
  question_index: number;
  user_id: string;
  suggestion: string;
  updated_at: string;
};

export type SuggestionsMap = Record<string, TeamSuggestionRow[]>;
// key = `${round_index}:${question_index}`
