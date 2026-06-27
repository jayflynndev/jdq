import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hasValidPresenterControlToken,
  isPresenterControlTokenConfigured,
  isPresenterControlAction,
  nextPresenterControlState,
  type PresenterControlAction,
  previousPresenterControlState,
  setPresenterControlState,
  type PresenterControlState,
} from "@/src/host-slides/presenterControl";

type PresenterControlRow = {
  deck_id: string;
  current_index: number;
  max_index: number;
  command_counter: number;
  updated_at: string;
};

type PresenterStepAction = "next" | "previous";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapRow(row: PresenterControlRow): PresenterControlState {
  return {
    deckId: row.deck_id,
    currentIndex: row.current_index,
    maxIndex: row.max_index,
    commandCounter: row.command_counter,
    updatedAt: row.updated_at,
  };
}

export function presenterControlResponse(state: PresenterControlState) {
  return NextResponse.json({
    status: "ok",
    state,
    tokenConfigured: isPresenterControlTokenConfigured(),
  });
}

export async function parseDeckIdFromBody(
  request: Request,
): Promise<string | null> {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.deckId !== "string") return null;
    const deckId = body.deckId.trim();
    return deckId ? deckId : null;
  } catch {
    return null;
  }
}

export async function parseStateUpdateFromBody(request: Request): Promise<{
  deckId: string;
  currentIndex: number;
  maxIndex: number;
} | null> {
  try {
    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      typeof body.deckId !== "string" ||
      typeof body.currentIndex !== "number" ||
      typeof body.maxIndex !== "number"
    ) {
      return null;
    }
    const deckId = body.deckId.trim();
    if (!deckId) return null;
    return {
      deckId,
      currentIndex: body.currentIndex,
      maxIndex: body.maxIndex,
    };
  } catch {
    return null;
  }
}

async function suppliedControlToken(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const headerToken = request.headers.get("x-presenter-control-token");
  const queryToken = url.searchParams.get("token");
  if (headerToken || queryToken) return headerToken ?? queryToken;

  try {
    const body: unknown = await request.clone().json();
    if (!isRecord(body) || typeof body.token !== "string") return null;
    return body.token;
  } catch {
    return null;
  }
}

async function hasAdminSession(
  request: Request,
  supabase: SupabaseClient,
): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token,
  );
  const userId = userData.user?.id;
  if (userError || !userId) return false;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  return !profileError && profile?.is_admin === true;
}

export async function authorizePresenterControl(
  request: Request,
  supabase: SupabaseClient,
): Promise<boolean> {
  if (hasValidPresenterControlToken(await suppliedControlToken(request))) {
    return true;
  }
  return hasAdminSession(request, supabase);
}

export async function parsePresenterActionFromBody(request: Request): Promise<{
  deckId: string;
  action: PresenterControlAction;
} | null> {
  try {
    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      typeof body.deckId !== "string" ||
      !isPresenterControlAction(body.action)
    ) {
      return null;
    }
    const deckId = body.deckId.trim();
    if (!deckId) return null;
    return { deckId, action: body.action };
  } catch {
    return null;
  }
}

export function unauthorizedPresenterControlResponse() {
  return NextResponse.json(
    {
      status: "unauthorized",
      message:
        "Missing or invalid HOST_SLIDES_PRESENTER_CONTROL_TOKEN.",
    },
    { status: 401 },
  );
}

export function getPresenterControlAdminClient() {
  return createAdminClient();
}

export async function readPresenterControlState(
  supabase: SupabaseClient,
  deckId: string,
): Promise<PresenterControlState> {
  const { data, error } = await supabase
    .from("host_slide_presenter_control")
    .select("deck_id,current_index,max_index,command_counter,updated_at")
    .eq("deck_id", deckId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return mapRow(data as PresenterControlRow);

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from("host_slide_presenter_control")
    .insert({
      deck_id: deckId,
      current_index: 0,
      max_index: 0,
      command_counter: 0,
      updated_at: now,
    })
    .select("deck_id,current_index,max_index,command_counter,updated_at")
    .single();

  if (insertError) throw new Error(insertError.message);
  return mapRow(inserted as PresenterControlRow);
}

async function writePresenterControlState(
  supabase: SupabaseClient,
  deckId: string,
  currentIndex: number,
  maxIndex: number,
  commandCounter: number,
): Promise<PresenterControlState> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("host_slide_presenter_control")
    .upsert(
      {
        deck_id: deckId,
        current_index: currentIndex,
        max_index: maxIndex,
        command_counter: commandCounter,
        updated_at: now,
      },
      { onConflict: "deck_id" },
    )
    .select("deck_id,current_index,max_index,command_counter,updated_at")
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data as PresenterControlRow);
}

export async function runPresenterControlAction(
  supabase: SupabaseClient,
  deckId: string,
  action: PresenterStepAction,
): Promise<PresenterControlState> {
  const current = await readPresenterControlState(supabase, deckId);
  const next =
    action === "next"
      ? nextPresenterControlState(current)
      : previousPresenterControlState(current);
  return writePresenterControlState(
    supabase,
    deckId,
    next.currentIndex,
    next.maxIndex,
    next.commandCounter,
  );
}

export async function updatePresenterControlState(
  supabase: SupabaseClient,
  deckId: string,
  currentIndex: number,
  maxIndex: number,
): Promise<PresenterControlState> {
  const current = await readPresenterControlState(supabase, deckId);
  const next = setPresenterControlState(current, currentIndex, maxIndex);
  return writePresenterControlState(
    supabase,
    deckId,
    next.currentIndex,
    next.maxIndex,
    next.commandCounter,
  );
}

export function presenterControlErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Presenter control request failed.",
    },
    { status: 500 },
  );
}
