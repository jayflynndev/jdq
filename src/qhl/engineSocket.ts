"use client";

import { io, type Socket } from "socket.io-client";
import { supabase } from "@/supabaseClient";

export type EngineConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type EngineBootstrap = {
  serverNowMs: number;
  session: {
    id: string;
    nightId: string;
    mode: "live";
    stage: string;
    stageDeadline: string | null;
    partIndex: number;
    startedAt: string | null;
    updatedAt: string;
  };
  entryId: string | null;
  pubId: string | null;
  sheet: unknown | null;
};

let socket: Socket | null = null;

export async function getQhlEngineSocket(): Promise<Socket> {
  const engineUrl = process.env.NEXT_PUBLIC_QHL_ENGINE_URL;
  if (!engineUrl) throw new Error("NEXT_PUBLIC_QHL_ENGINE_URL is not configured");

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in before connecting to Quiz Hub Live");

  if (!socket) {
    socket = io(engineUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: { token },
    });
  } else {
    socket.auth = { token };
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export async function measureServerOffset(activeSocket: Socket, samples = 5): Promise<number> {
  const offsets: number[] = [];
  for (let index = 0; index < samples; index += 1) {
    const sentAt = Date.now();
    const response = await activeSocket.timeout(3_000).emitWithAck("time:sync", sentAt) as {
      serverNowMs: number;
    };
    const receivedAt = Date.now();
    offsets.push(response.serverNowMs - (sentAt + receivedAt) / 2);
  }
  offsets.sort((left, right) => left - right);
  return offsets[Math.floor(offsets.length / 2)] ?? 0;
}

export async function joinQhlSession(
  activeSocket: Socket,
  sessionId: string,
): Promise<EngineBootstrap> {
  const response = await activeSocket.timeout(5_000).emitWithAck("session:join", { sessionId }) as
    | { ok: true; bootstrap: EngineBootstrap }
    | { ok: false; error: string };
  if (!response.ok) throw new Error(response.error);
  return response.bootstrap;
}

export function closeQhlEngineSocket(): void {
  socket?.disconnect();
  socket = null;
}
