"use client";

import { QuizLobbyList } from "@/components/qhl/player/QuizLobbyList";

export default function PlayersQhlClientPage() {
  return (
    <div className="qhl-shell space-y-4">
      <div className="qhl-hero">
        <div className="qhl-kicker">Players</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Quiz Hub Live
        </h1>
        <div className="mt-1 text-sm text-violet-100/80">
          Pick a quiz to join.
        </div>
      </div>

      <QuizLobbyList />
    </div>
  );
}
