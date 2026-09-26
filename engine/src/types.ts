export type QhlStage =
  | "LOBBY"
  | "STARTING"
  | "ANSWERING"
  | "LOCK_COUNTDOWN"
  | "SWAP"
  | "MARKING"
  | "MARK_GRACE"
  | "SCORING"
  | "RESULTS_HELD"
  | "RESULTS_SHOWN"
  | "ENDED"
  | "CLOSED";

export type SessionState = {
  id: string;
  nightId: string;
  mode: "live";
  stage: QhlStage;
  stageDeadline: string | null;
  partIndex: number;
  startedAt: string | null;
  updatedAt: string;
};

export type ClientBootstrap = {
  serverNowMs: number;
  session: SessionState;
  entryId: string | null;
  pubId: string | null;
  sheet: {
    id: string;
    entry_id: string;
    part: number;
    answers: unknown;
    tiebreak_value: number | null;
    locked_at: string | null;
    updated_at: string;
  } | null;
};
