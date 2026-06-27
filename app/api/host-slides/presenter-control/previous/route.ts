import {
  authorizePresenterControl,
  getPresenterControlAdminClient,
  parseDeckIdFromBody,
  presenterControlErrorResponse,
  presenterControlResponse,
  runPresenterControlAction,
  unauthorizedPresenterControlResponse,
} from "@/app/api/host-slides/presenter-control/_shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = getPresenterControlAdminClient();
  if (!(await authorizePresenterControl(request, supabase))) {
    return unauthorizedPresenterControlResponse();
  }

  const deckId = await parseDeckIdFromBody(request);
  if (!deckId) {
    return Response.json(
      { status: "error", message: "Missing deckId." },
      { status: 400 },
    );
  }

  try {
    const state = await runPresenterControlAction(supabase, deckId, "previous");
    return presenterControlResponse(state);
  } catch (error: unknown) {
    return presenterControlErrorResponse(error);
  }
}
