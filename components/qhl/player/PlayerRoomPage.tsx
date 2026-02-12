"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuizRuntime } from "@/src/qhl/useQuizRuntime";
import { CountdownTimer } from "../runtime/CountdownTimer";
import { supabase } from "@/supabaseClient";
import { TeamJoinCard } from "@/components/qhl/player/TeamJoinCard";
import { AnsweringCard } from "@/components/qhl/player/AnsweringCard";
import { useMyTeam } from "@/src/qhl/useMyTeam";
import { MarkingCard } from "@/components/qhl/player/MarkingCard";
import { LeaderboardsCard } from "@/components/qhl/player/LeaderboardCard";
import { MyResultsTabbedCard } from "@/components/qhl/player/MyResultsTabbedCard";
import { useQuizMeta } from "@/src/qhl/useQuizMeta";
import { TopTabs } from "@/components/qhl/shared/TopTabs";
import { ChatPlaceholderCard } from "@/components/qhl/player/ChatPlaceholderCard";

function quizStatusMessage(phase: string | null | undefined): string | null {
  if (!phase) return "Loading quiz state…";

  const map: Record<string, string> = {
    LOBBY: "The quiz hasn’t started yet. Get your team ready.",
    COUNTDOWN_TO_ANSWERING: "Starting soon — keep an eye on the countdown.",
    COUNTDOWN_TO_LOCK: "Answering is still open — lock is coming up.",
    ANSWERS_FINALISING:
      "Submitting answers… hang tight while we confirm everything is saved.",
    ANSWERS_READY_TO_SWAP:
      "Answers are in. Waiting for the quizmaster to swap sheets.",
    COUNTDOWN_TO_MARKING:
      "Marking will begin shortly — you’ll receive a sheet to mark.",
    MARKING: "Marking is live. Your captain will submit marks when ready.",
    COUNTDOWN_TO_SUBMIT_MARKS: "Marking ends soon — submitting marks shortly.",
    MARKS_FINALISING:
      "Submitting marks… hang tight while we confirm everything is saved.",
    SHOW_LEADERBOARD: "Scores are in — showing leaderboards.",
    ENDED: "Quiz ended — you can still view results and leaderboards.",
  };

  return map[phase] ?? `Live phase: ${phase}`;
}

function toYouTubeEmbed(urlOrId: string): string | null {
  const raw = (urlOrId || "").trim();
  if (!raw) return null;

  if (raw.includes("youtube.com/embed/")) return raw;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return `https://www.youtube.com/embed/${raw}`;
  }

  try {
    const u = new URL(raw);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      const parts = u.pathname.split("/").filter(Boolean);
      const liveIdx = parts.indexOf("live");
      if (liveIdx >= 0 && parts[liveIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[liveIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function humanPhaseShort(phase: string | null | undefined): string {
  if (!phase) return "Loading...";
  const map: Record<string, string> = {
    PRE_QUIZ: "Getting ready",
    COUNTDOWN_TO_ANSWERING: "Starting soon",
    ANSWERING: "Answering",
    COUNTDOWN_TO_LOCK: "Locking soon",
    MARKING: "Marking",
    COUNTDOWN_TO_SUBMIT_MARKS: "Submitting soon",
    SHOW_LEADERBOARD: "Leaderboard",
    ENDED: "Ended",
  };
  return map[phase] ?? "Live";
}

function phaseCountdownLabel(phase: string | null | undefined): string {
  if (!phase) return "Countdown";
  const map: Record<string, string> = {
    COUNTDOWN_TO_ANSWERING: "Starting in",
    COUNTDOWN_TO_LOCK: "Locking in",
    COUNTDOWN_TO_MARKING: "Marking starts in",
    COUNTDOWN_TO_SUBMIT_MARKS: "Submitting in",
  };
  return map[phase] ?? "Countdown";
}

function LiveStreamCard({ youtubeUrl }: { youtubeUrl: string | null }) {
  const embed = useMemo(
    () => (youtubeUrl ? toYouTubeEmbed(youtubeUrl) : null),
    [youtubeUrl],
  );

  return (
    <div className="qhl-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Live stream</div>
          <div className="mt-1 text-sm text-violet-100/80">
            Watch the quiz here while you play.
          </div>
        </div>
      </div>

      <div className="mt-4">
        {embed ? (
          <div className="overflow-hidden rounded-2xl border bg-black">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={embed}
                title="Quiz Hub Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
            Stream link not set for this quiz yet.
          </div>
        )}
      </div>
    </div>
  );
}

type TeamMemberView = {
  userId: string;
  label: string;
  isCaptain: boolean;
  isYou: boolean;
};

function fallbackPlayerLabel(userId: string) {
  return `Player ${userId.slice(0, 6)}`;
}

export function PlayerRoomPage({ quizId }: { quizId: string }) {
  const { runtime } = useQuizRuntime(quizId);
  const { myTeam, refresh } = useMyTeam(quizId);
  const { meta } = useQuizMeta(quizId);
  const [teamMembers, setTeamMembers] = useState<TeamMemberView[]>([]);
  const teamId = myTeam?.id ?? null;
  const captainUserId = myTeam?.captain_user_id ?? null;

  const youtubeUrl = meta?.youtube_url ?? null;

  const [activeTab, setActiveTab] = useState<"quiz" | "chat">("quiz");

  const phase = runtime?.phase ?? null;

  const showAnswering = phase === "ANSWERING" || phase === "COUNTDOWN_TO_LOCK";
  const showMarking =
    phase === "MARKING" || phase === "COUNTDOWN_TO_SUBMIT_MARKS";
  const showLeaderboard = phase === "SHOW_LEADERBOARD" || phase === "ENDED";

  const shouldShowStatus = !showAnswering && !showMarking && !showLeaderboard;

  useEffect(() => {
    let cancelled = false;

    async function loadTeamMembers() {
      if (!teamId) {
        setTeamMembers([]);
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const myUserId = authData.user?.id ?? null;

      const { data, error } = await supabase
        .from("qhl_team_members")
        .select("*")
        .eq("team_id", teamId);

      if (cancelled) return;
      if (error || !data) {
        if (error) console.error(error);
        setTeamMembers([]);
        return;
      }

      const rows = data as Record<string, unknown>[];
      const userIds = rows
        .map((row: Record<string, unknown>) =>
          typeof row.user_id === "string" ? row.user_id : "",
        )
        .filter((id): id is string => id.length > 0);

      let usernameByUserId = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
          .from("profiles")
          .select("id,username")
          .in("id", userIds);

        if (profileErr) {
          console.error(profileErr);
        } else {
          usernameByUserId = new Map(
            (profileRows ?? [])
              .map((row: Record<string, unknown>) => {
                const id = typeof row.id === "string" ? row.id : "";
                const username =
                  typeof row.username === "string" ? row.username.trim() : "";
                return id && username ? ([id, username] as const) : null;
              })
              .filter(
                (
                  entry: readonly [string, string] | null,
                ): entry is readonly [string, string] => entry !== null,
              ),
          );
        }
      }

      const members = rows
        .map((row: Record<string, unknown>) => {
          const userId = typeof row.user_id === "string" ? row.user_id : "";
          if (!userId) return null;
          return {
            userId,
            label: usernameByUserId.get(userId) ?? fallbackPlayerLabel(userId),
            isCaptain: captainUserId === userId,
            isYou: myUserId === userId,
          } satisfies TeamMemberView;
        })
        .filter((m): m is TeamMemberView => m !== null)
        .sort((a, b) => {
          if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;
          if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
          return a.label.localeCompare(b.label);
        });

      setTeamMembers(members);
    }

    loadTeamMembers();
    return () => {
      cancelled = true;
    };
  }, [teamId, captainUserId]);

  return (
    <div className="qhl-room">
      <div className="qhl-shell space-y-4">
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="qhl-hero xl:col-span-5">
            <div className="flex flex-col gap-4">
              <div>
                <div className="qhl-kicker">Live Room</div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                  Quiz Hub Live
                </h1>
                <div className="mt-1 text-sm text-violet-100/80">
                  {runtime?.phase
                    ? `Status: ${humanPhaseShort(runtime.phase)}`
                    : "Loading room..."}
                </div>
                {myTeam ? (
                  <div className="mt-3 space-y-2 rounded-2xl border border-violet-200/20 bg-violet-950/25 p-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-violet-100/90">
                      <span>
                        Team:{" "}
                        <span className="font-semibold">{myTeam.name}</span>
                      </span>
                      <span className="text-violet-200/50">•</span>
                      <span>
                        Join code{" "}
                        <span className="font-mono rounded-md border bg-slate-50 px-2 py-1">
                          {myTeam.join_code}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-violet-100/75">
                      Share the join code with your teammates.
                    </div>
                    {teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {teamMembers.map((member) => (
                          <div
                            key={member.userId}
                            className="inline-flex items-center gap-2 rounded-full border border-violet-200/30 bg-violet-900/50 px-3 py-1 text-xs text-violet-50"
                          >
                            <span className="font-medium">{member.label}</span>
                            {member.isYou ? (
                              <span className="rounded-full bg-violet-200/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                You
                              </span>
                            ) : null}
                            {member.isCaptain ? (
                              <span className="rounded-full bg-yellow-300/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                                Captain
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="qhl-card px-4 py-3">
                  <div className="text-xs font-semibold text-violet-100/80">
                    {phaseCountdownLabel(runtime?.phase)}
                  </div>

                  <div className="mt-1">
                    {runtime?.countdown_ends_at ? (
                      <CountdownTimer
                        endsAt={runtime.countdown_ends_at}
                        onExpire={async () => {
                          if (!runtime) return;

                          if (runtime.phase === "COUNTDOWN_TO_ANSWERING") {
                            await supabase.rpc(
                              "qhl_finalize_countdown_to_answering",
                              {
                                p_quiz_id: quizId,
                              },
                            );
                          }

                          if (runtime.phase === "COUNTDOWN_TO_LOCK") {
                            await supabase.rpc(
                              "qhl_finalize_countdown_to_lock",
                              {
                                p_quiz_id: quizId,
                              },
                            );
                          }

                          if (runtime.phase === "COUNTDOWN_TO_MARKING") {
                            await supabase.rpc(
                              "qhl_finalize_countdown_to_marking",
                              {
                                p_quiz_id: quizId,
                              },
                            );
                          }

                          if (runtime.phase === "COUNTDOWN_TO_SUBMIT_MARKS") {
                            await supabase.rpc(
                              "qhl_finalize_countdown_to_submit_marks",
                              {
                                p_quiz_id: quizId,
                              },
                            );
                          }
                        }}
                      />
                    ) : (
                      <div className="text-sm text-violet-100/70">
                        No countdown running right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7">
            <LiveStreamCard youtubeUrl={youtubeUrl} />
          </div>
        </div>

        <div className="space-y-4">
          <TopTabs
            tabs={[
              { id: "quiz", label: "Quiz" },
              { id: "chat", label: "Chat" },
            ]}
            active={activeTab}
            onChange={(id) => setActiveTab(id as "quiz" | "chat")}
          />

          {activeTab === "chat" ? (
            <ChatPlaceholderCard />
          ) : (
            <div className="space-y-4">
              {/* This join card stays in the Quiz tab, and we can also keep it visible above tabs if you prefer */}
              {!myTeam ? (
                <TeamJoinCard quizId={quizId} onTeamChanged={refresh} />
              ) : null}

              {/* “Quiz content area” is always present */}
              <div className="space-y-4">
                <AnsweringCard
                  quizId={quizId}
                  runtime={runtime}
                  myTeam={myTeam}
                  setup={meta?.setup ?? null}
                />

                <MarkingCard
                  quizId={quizId}
                  runtime={runtime}
                  myTeam={myTeam}
                  setup={meta?.setup ?? null}
                />

                <LeaderboardsCard quizId={quizId} runtime={runtime} />

                <MyResultsTabbedCard
                  quizId={quizId}
                  runtime={runtime}
                  myTeam={myTeam}
                />

                {/* If none of the phase cards render, show a friendly status */}
                {shouldShowStatus ? (
                  <div className="qhl-card text-sm text-violet-100/80">
                    {quizStatusMessage(phase)}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
