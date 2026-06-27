import {
  authorizePresenterControl,
  getPresenterControlAdminClient,
  parseStateUpdateFromBody,
  presenterControlErrorResponse,
  presenterControlResponse,
  readPresenterControlState,
  unauthorizedPresenterControlResponse,
  updatePresenterControlState,
} from "@/app/api/host-slides/presenter-control/_shared";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const deckId = new URL(request.url).searchParams.get("deckId")?.trim();
  if (!deckId) {
    return Response.json(
      { status: "error", message: "Missing deckId." },
      { status: 400 },
    );
  }

  try {
    const state = await readPresenterControlState(
      getPresenterControlAdminClient(),
      deckId,
    );
    return presenterControlResponse(state);
  } catch (error: unknown) {
    return presenterControlErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const supabase = getPresenterControlAdminClient();
  if (!(await authorizePresenterControl(request, supabase))) {
    return unauthorizedPresenterControlResponse();
  }

  const update = await parseStateUpdateFromBody(request);
  if (!update) {
    return Response.json(
      { status: "error", message: "Invalid presenter state update." },
      { status: 400 },
    );
  }

  try {
    const state = await updatePresenterControlState(
      supabase,
      update.deckId,
      update.currentIndex,
      update.maxIndex,
    );
    return presenterControlResponse(state);
  } catch (error: unknown) {
    return presenterControlErrorResponse(error);
  }
}
