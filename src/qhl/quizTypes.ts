export type QuizRoundSetup = {
  title?: string; // optional label for admin/player sheet UI
  questions: number; // required
};

export type QuizPartSetup = {
  title?: string; // optional label
  rounds: QuizRoundSetup[];
};

export type QuizSetup = QuizPartSetup[];

export type QhlQuizRow = {
  id: string;
  name: string;
  quizmaster: string | null;
  starts_at: string; // ISO
  youtube_url: string | null;
  description: string | null;
  parts_count: number;
  setup: QuizSetup;
  created_at: string;
};

export type QuizMeta = {
  parts_count: number;
  setup: QuizSetup;
  youtube_url: string | null;
};
