export type RuntimePhase =
  | "LOBBY"
  | "COUNTDOWN_TO_ANSWERING"
  | "ANSWERING"
  | "COUNTDOWN_TO_LOCK"
  | "ANSWERS_FINALISING"
  | "ANSWERS_READY_TO_SWAP"
  | "SWAPPING"
  | "MARKING_READY"
  | "COUNTDOWN_TO_MARKING"
  | "MARKING"
  | "COUNTDOWN_TO_SUBMIT_MARKS"
  | "MARKS_FINALISING"
  | "SCORES_READY"
  | "LEADERBOARD_PREPARING"
  | "LEADERBOARD_READY"
  | "SHOW_LEADERBOARD"
  | "ENDED";

export type QuizRuntime = {
  quiz_id: string;
  phase: RuntimePhase;
  part_index: number;
  countdown_ends_at: string | null; // ISO
  updated_at: string; // ISO
};
