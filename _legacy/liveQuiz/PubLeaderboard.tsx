// components/liveQuiz/PubLeaderboards.tsx
import React from "react";

type LeaderboardEntry = {
  name: string;
  score: number;
};

type LeaderboardSectionProps = {
  title: string;
  entries: LeaderboardEntry[];
  highlightName: string;
};

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  title,
  entries,
  highlightName,
}) => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4 w-full">
    <h3 className="font-bold text-lg text-purple-700 mb-2">{title}</h3>
    <ol className="space-y-1">
      {entries.map((entry, i) => (
        <li
          key={i}
          className={`flex justify-between items-center px-2 py-1 rounded ${
            entry.name === highlightName
              ? "bg-purple-100 font-bold"
              : i < 3
              ? "bg-yellow-50"
              : ""
          }`}
        >
          <span>
            {i + 1}. {entry.name}
          </span>
          <span className="font-mono">{entry.score}</span>
        </li>
      ))}
    </ol>
  </div>
);

type PubLeaderboardsProps = {
  pubEntries: LeaderboardEntry[];
  allEntries: LeaderboardEntry[];
  pubAverages: LeaderboardEntry[];
  currentUser: string;
  currentPub: string;
};

export const PubLeaderboards: React.FC<PubLeaderboardsProps> = ({
  pubEntries,
  allEntries,
  pubAverages,
  currentUser,
  currentPub,
}) => (
  <div className="grid md:grid-cols-3 gap-8 w-full">
    <LeaderboardSection
      title={`Your Pub: ${currentPub}`}
      entries={pubEntries}
      highlightName={currentUser}
    />
    <LeaderboardSection
      title="Overall Top 10"
      entries={allEntries}
      highlightName={currentUser}
    />
    <LeaderboardSection
      title="Top 10 Pub Averages"
      entries={pubAverages}
      highlightName={currentPub}
    />
  </div>
);
