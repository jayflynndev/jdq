import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientBootstrap, QhlStage, SessionState } from "./types.js";

type SessionRow = {
  id: string;
  night_id: string;
  mode: "live";
  stage: QhlStage;
  stage_deadline: string | null;
  part_index: number;
  started_at: string | null;
  updated_at: string;
};

const mapSession = (row: SessionRow): SessionState => ({
  id: row.id,
  nightId: row.night_id,
  mode: row.mode,
  stage: row.stage,
  stageDeadline: row.stage_deadline,
  partIndex: row.part_index,
  startedAt: row.started_at,
  updatedAt: row.updated_at,
});

export class SessionStore {
  private readonly sessions = new Map<string, SessionState>();

  constructor(private readonly supabase: SupabaseClient) {}

  async rebuild(): Promise<number> {
    const { data, error } = await this.supabase
      .from("qhl_sessions")
      .select("id,night_id,mode,stage,stage_deadline,part_index,started_at,updated_at")
      .not("stage", "in", '("ENDED","CLOSED")');
    if (error) throw new Error(`Could not rebuild sessions: ${error.message}`);

    this.sessions.clear();
    for (const row of (data ?? []) as SessionRow[]) {
      this.sessions.set(row.id, mapSession(row));
    }
    return this.sessions.size;
  }

  async get(sessionId: string): Promise<SessionState | null> {
    const cached = this.sessions.get(sessionId);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from("qhl_sessions")
      .select("id,night_id,mode,stage,stage_deadline,part_index,started_at,updated_at")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw new Error(`Could not load session: ${error.message}`);
    if (!data) return null;
    const session = mapSession(data as SessionRow);
    this.sessions.set(session.id, session);
    return session;
  }

  async bootstrap(sessionId: string, userId: string): Promise<ClientBootstrap | null> {
    const session = await this.get(sessionId);
    if (!session) return null;

    const { data: memberships, error: membershipError } = await this.supabase
      .from("qhl_team_members")
      .select("team_id")
      .eq("user_id", userId);
    if (membershipError) throw new Error(`Could not load memberships: ${membershipError.message}`);
    const teamIds = (memberships ?? []).map((row) => row.team_id as string);

    let entryQuery = this.supabase
      .from("qhl_entries")
      .select("id,pub_id")
      .eq("night_id", session.nightId);
    const identityFilter = [`user_id.eq.${userId}`];
    if (teamIds.length) identityFilter.push(`team_id.in.(${teamIds.join(",")})`);
    entryQuery = entryQuery.or(identityFilter.join(","));
    const { data: entry, error: entryError } = await entryQuery.maybeSingle();
    if (entryError) throw new Error(`Could not load entry: ${entryError.message}`);

    let sheet: ClientBootstrap["sheet"] = null;
    if (entry) {
      const { data, error } = await this.supabase
        .from("qhl_sheets")
        .select("id,entry_id,part,answers,tiebreak_value,locked_at,updated_at")
        .eq("entry_id", entry.id)
        .eq("part", session.partIndex)
        .maybeSingle();
      if (error) throw new Error(`Could not load sheet: ${error.message}`);
      sheet = data;
    }

    return {
      serverNowMs: Date.now(),
      session,
      entryId: entry?.id ?? null,
      pubId: entry?.pub_id ?? null,
      sheet,
    };
  }
}
