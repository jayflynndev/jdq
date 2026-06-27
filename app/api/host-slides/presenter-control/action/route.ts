import {
  authorizePresenterControl,
  getPresenterControlAdminClient,
  parsePresenterActionFromBody,
  presenterControlErrorResponse,
  presenterControlResponse,
  runPresenterControlAction,
  unauthorizedPresenterControlResponse,
  updatePresenterControlState,
} from "@/app/api/host-slides/presenter-control/_shared";
import { buildHostSlideSequence } from "@/src/host-slides/slides";
import { loadHostDeckWithClient } from "@/src/host-slides/supabaseDecks";
import { resolvePresenterShowActionIndex } from "@/src/host-slides/presenterControl";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = getPresenterControlAdminClient();
  if (!(await authorizePresenterControl(request, supabase))) {
    return unauthorizedPresenterControlResponse();
  }

  const command = await parsePresenterActionFromBody(request);
  if (!command) {
    return Response.json(
      { status: "error", message: "Invalid presenter control action." },
      { status: 400 },
    );
  }

  try {
    if (command.action === "next" || command.action === "previous") {
      const state = await runPresenterControlAction(
        supabase,
        command.deckId,
        command.action,
      );
      return presenterControlResponse(state);
    }

    const deck = await loadHostDeckWithClient(command.deckId, supabase);
    const slides = buildHostSlideSequence(deck);
    const target = resolvePresenterShowActionIndex(slides, command.action);

    if (!target.ok) {
      return Response.json(
        { status: "unavailable", message: target.message },
        { status: 404 },
      );
    }

    const state = await updatePresenterControlState(
      supabase,
      command.deckId,
      target.index,
      Math.max(0, slides.length - 1),
    );
    return presenterControlResponse(state);
  } catch (error: unknown) {
    return presenterControlErrorResponse(error);
  }
}
