export type ClockEvent = {
  event: string;
  payload: Record<string, unknown>;
  firedAtMs: number;
};

export interface ClockSource {
  nowMs(): number;
  subscribe(listener: (event: ClockEvent) => void): () => void;
}
