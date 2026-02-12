"use client";

import { useQuizRuntime } from "@/src/qhl/useQuizRuntime";
import { AdminPhaseControls } from "@/components/qhl/admin/AdminPhaseControls";
import { CountdownTimer } from "../runtime/CountdownTimer";
import { supabase } from "@/supabaseClient";
import { QuizVenuesCard } from "@/components/qhl/admin/venues/QuizVenuesCard";
import { LeaderboardsCard } from "../player/LeaderboardCard";

export function AdminControlRoomPage({ quizId }: { quizId: string }) {
  const { runtime } = useQuizRuntime(quizId);

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">QHL Control Room</h1>
      <div className="text-sm opacity-70">Quiz ID: {quizId}</div>

      <AdminPhaseControls quizId={quizId} runtime={runtime} />
      <CountdownTimer
        endsAt={runtime?.countdown_ends_at ?? null}
        onExpire={async () => {
          if (!runtime) return;

          if (runtime.phase === "COUNTDOWN_TO_ANSWERING") {
            await supabase.rpc("qhl_finalize_countdown_to_answering", {
              p_quiz_id: quizId,
            });
          }

          if (runtime.phase === "COUNTDOWN_TO_LOCK") {
            await supabase.rpc("qhl_finalize_countdown_to_lock", {
              p_quiz_id: quizId,
            });
          }

          if (runtime.phase === "COUNTDOWN_TO_MARKING") {
            await supabase.rpc("qhl_finalize_countdown_to_marking", {
              p_quiz_id: quizId,
            });
          }

          if (runtime.phase === "COUNTDOWN_TO_SUBMIT_MARKS") {
            await supabase.rpc("qhl_finalize_countdown_to_submit_marks", {
              p_quiz_id: quizId,
            });
          }
        }}
      />
      <LeaderboardsCard quizId={quizId} runtime={runtime} />
      <QuizVenuesCard quizId={quizId} />
    </div>
  );
}
