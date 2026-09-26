import cors from "@fastify/cors";
import { createClient } from "@supabase/supabase-js";
import Fastify from "fastify";
import { attachSocketServer } from "./socketServer.js";
import { SessionStore } from "./sessionStore.js";
import type { EngineConfig } from "./config.js";

export async function buildApp(config: EngineConfig) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: config.webOrigins, credentials: true });
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sessions = new SessionStore(supabase);
  const rebuiltSessions = await sessions.rebuild();
  app.log.info({ rebuiltSessions }, "rebuilt live sessions from Postgres");

  app.get("/health", async () => ({ ok: true, sessions: rebuiltSessions }));
  const io = attachSocketServer(app, supabase, sessions, config.webOrigins);
  app.addHook("onClose", (_instance, done) => io.close(done));
  return app;
}
