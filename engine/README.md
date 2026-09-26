# Quiz Hub Live stage engine

Standalone authoritative QHL service built with Fastify and Socket.IO. Postgres is the source of truth: startup reloads every non-terminal `qhl_sessions` row, and `session:join` returns the current session plus the caller's active entry and sheet in one acknowledgement.

## Local setup

1. Apply the repository Supabase migrations.
2. Copy `.env.example` to `.env` inside this directory and provide the required values.
3. Run `npm install`, then `npm run dev`.
4. Run the Next.js app with `NEXT_PUBLIC_QHL_ENGINE_URL=http://localhost:4100`.

Required engine variables are `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. `PORT` defaults to 4100. `WEB_ORIGIN` is a comma-separated allowlist and defaults to `http://localhost:3000`. `ANTHROPIC_API_KEY` is reserved for the Stage 4 adjudication fallback and is not used in Stage 1.

Never expose the service-role key through a `NEXT_PUBLIC_` variable or commit a real `.env` file.

## Protocol foundation

- Socket authentication uses a current Supabase access token.
- `time:sync` acknowledges with the server wall-clock time; the web client calculates offset from the request midpoint.
- `session:join` joins `session:*`, `pub:*`, and `entry:*` rooms as applicable and responds with authoritative stage/deadline/part plus the caller's current sheet.
- `ClockSource` decouples stage events from their origin. Stage 1 supplies `LiveClockSource`; a replay timeline source can implement the same interface later.

## Deployment

Build with `npm run build` and start with `npm start`. The service listens on `0.0.0.0:$PORT`, which is suitable for Railway, Fly.io, or Render. Configure the four documented engine variables in the provider and allow the deployed QuizHub origin through `WEB_ORIGIN`. WebSocket support must remain enabled.
