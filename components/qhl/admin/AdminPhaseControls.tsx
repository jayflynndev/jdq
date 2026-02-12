"use client";

import { supabase } from "@/supabaseClient";
import type { QuizRuntime } from "@/src/qhl/types";

function actionClass() {
  return "qhl-btn-secondary w-full justify-start px-4 py-2.5 text-left text-sm";
}

export function AdminPhaseControls({
  quizId,
  runtime,
}: {
  quizId: string;
  runtime: QuizRuntime | null;
}) {
  if (!runtime) return null;

  async function startAnsweringCountdown() {
    const { error } = await supabase.rpc(
      "qhl_admin_start_answering_countdown",
      {
        p_quiz_id: quizId,
        p_seconds: 30,
      },
    );

    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function startLockCountdown() {
    const { error } = await supabase.rpc("qhl_admin_start_lock_countdown", {
      p_quiz_id: quizId,
      p_seconds: 30,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function completeAnswersFinalising() {
    const { error } = await supabase.rpc(
      "qhl_admin_complete_answers_finalising",
      {
        p_quiz_id: quizId,
      },
    );
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function swapAnswerSheets() {
    await supabase.rpc("qhl_admin_swap_answer_sheets", {
      p_quiz_id: quizId,
    });
  }

  async function completeSwapping() {
    await supabase.rpc("qhl_admin_complete_swapping", {
      p_quiz_id: quizId,
    });
  }

  async function startMarkingCountdown() {
    const { error } = await supabase.rpc("qhl_admin_start_marking_countdown", {
      p_quiz_id: quizId,
      p_seconds: 30,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function startSubmitMarksCountdown() {
    const { error } = await supabase.rpc(
      "qhl_admin_start_submit_marks_countdown",
      {
        p_quiz_id: quizId,
        p_seconds: 30,
      },
    );
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function completeMarksFinalising() {
    const { error } = await supabase.rpc(
      "qhl_admin_complete_marks_finalising",
      {
        p_quiz_id: quizId,
      },
    );
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function prepareLeaderboard() {
    const { error } = await supabase.rpc("qhl_admin_prepare_leaderboard", {
      p_quiz_id: quizId,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function completeLeaderboardPreparing() {
    const { error } = await supabase.rpc(
      "qhl_admin_complete_leaderboard_preparing",
      { p_quiz_id: quizId },
    );
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function showLeaderboard() {
    const { error } = await supabase.rpc("qhl_admin_show_leaderboard", {
      p_quiz_id: quizId,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function nextPart() {
    const { error } = await supabase.rpc("qhl_admin_next_part", {
      p_quiz_id: quizId,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function endQuiz() {
    const { error } = await supabase.rpc("qhl_admin_end_quiz", {
      p_quiz_id: quizId,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div className="qhl-card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-white">Admin controls</div>
        <div className="rounded-full border border-violet-200/35 bg-violet-900/40 px-3 py-1 text-xs font-medium text-violet-100/90">
          Current phase: {runtime.phase}
        </div>
      </div>

      <div className="grid gap-2">
        <button
          onClick={startAnsweringCountdown}
          disabled={runtime.phase !== "LOBBY"}
          className={actionClass()}
        >
          Start answering countdown
        </button>

        <button
          onClick={startLockCountdown}
          disabled={runtime.phase !== "ANSWERING"}
          className={actionClass()}
        >
          Start lock countdown
        </button>

        <button
          onClick={completeAnswersFinalising}
          disabled={runtime.phase !== "ANSWERS_FINALISING"}
          className={actionClass()}
        >
          Confirm answers finalised
        </button>

        {runtime.phase === "ANSWERS_READY_TO_SWAP" && (
          <button onClick={swapAnswerSheets} className={actionClass()}>
            Swap answer sheets
          </button>
        )}

        {runtime.phase === "SWAPPING" && (
          <button onClick={completeSwapping} className={actionClass()}>
            Confirm swap complete
          </button>
        )}

        {runtime.phase === "MARKING_READY" && (
          <button onClick={startMarkingCountdown} className={actionClass()}>
            Start marking countdown
          </button>
        )}

        {runtime.phase === "MARKING" && (
          <button onClick={startSubmitMarksCountdown} className={actionClass()}>
            Start submit marks countdown
          </button>
        )}

        {runtime.phase === "MARKS_FINALISING" && (
          <button
            onClick={completeMarksFinalising}
            className="rounded bg-black px-3 py-2 text-white"
          >
            Confirm marks finalised
          </button>
        )}

        {runtime.phase === "SCORES_READY" && (
          <button onClick={prepareLeaderboard} className={actionClass()}>
            Prepare leaderboard
          </button>
        )}

        {runtime.phase === "LEADERBOARD_PREPARING" && (
          <button
            onClick={completeLeaderboardPreparing}
            className={actionClass()}
          >
            Confirm leaderboard ready
          </button>
        )}

        {runtime.phase === "LEADERBOARD_READY" && (
          <button onClick={showLeaderboard} className={actionClass()}>
            Show leaderboard
          </button>
        )}

        {runtime.phase === "SHOW_LEADERBOARD" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={nextPart} className={actionClass()}>
              Next part
            </button>
            <button
              onClick={endQuiz}
              className="inline-flex w-full items-center justify-start rounded-xl border border-rose-300/40 bg-rose-400/15 px-4 py-2.5 text-left text-sm font-semibold text-rose-100 transition hover:bg-rose-400/25"
            >
              End quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
