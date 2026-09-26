import type { ClockEvent, ClockSource } from "./ClockSource.js";

export class LiveClockSource implements ClockSource {
  private readonly listeners = new Set<(event: ClockEvent) => void>();

  nowMs(): number {
    return Date.now();
  }

  fire(event: string, payload: Record<string, unknown> = {}): ClockEvent {
    const fired = { event, payload, firedAtMs: this.nowMs() };
    for (const listener of this.listeners) listener(fired);
    return fired;
  }

  subscribe(listener: (event: ClockEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
