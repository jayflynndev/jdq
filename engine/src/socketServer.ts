import type { SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import type { SessionStore } from "./sessionStore.js";

type JoinRequest = { sessionId?: unknown };

export function attachSocketServer(
  app: FastifyInstance,
  supabase: SupabaseClient,
  sessions: SessionStore,
  origins: string[],
): Server {
  const io = new Server(app.server, { cors: { origin: origins, credentials: true } });

  io.use(async (socket, next) => {
    const token = typeof socket.handshake.auth.token === "string"
      ? socket.handshake.auth.token
      : null;
    if (!token) return next(new Error("Authentication required"));
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return next(new Error("Invalid authentication token"));
    socket.data.userId = data.user.id;
    next();
  });

  io.on("connection", (socket) => {
    socket.emit("time:hello", { serverNowMs: Date.now() });
    socket.on("time:sync", (_clientSentMs: unknown, acknowledge: (value: { serverNowMs: number }) => void) => {
      acknowledge({ serverNowMs: Date.now() });
    });

    socket.on("session:join", async (request: JoinRequest, acknowledge) => {
      try {
        if (typeof request?.sessionId !== "string") {
          return acknowledge({ ok: false, error: "A sessionId is required" });
        }
        const bootstrap = await sessions.bootstrap(request.sessionId, socket.data.userId as string);
        if (!bootstrap) return acknowledge({ ok: false, error: "Session not found" });

        await socket.join(`session:${bootstrap.session.id}`);
        if (bootstrap.pubId) await socket.join(`pub:${bootstrap.pubId}`);
        if (bootstrap.entryId) await socket.join(`entry:${bootstrap.entryId}`);
        acknowledge({ ok: true, bootstrap });
      } catch (error) {
        app.log.error(error);
        acknowledge({ ok: false, error: "Could not load authoritative session state" });
      }
    });
  });

  return io;
}
