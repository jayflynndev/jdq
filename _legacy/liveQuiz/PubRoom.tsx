"use client";
import React from "react";
import { PubInfoHeader } from "./PubInfoHeader";
import { LivestreamEmbed } from "./LivestreamEmbed";
import { PubMembersList } from "./PubMembersList";
import { PubChat } from "./PubChat";
import { AnswerEntrySheet } from "./AnswerEntrySheet";
import { SwappingSpinner } from "./SwappingSpinner";
import { MarkingSheet } from "./MarkingSheet";
import { LoadingSpinner } from "./LoadingSpinner";
import { PubLeaderboards } from "./PubLeaderboard";
import { MyMarkedAnswers } from "./MyMarkedAnswers";

interface Quiz {
  id: string;
  title: string;
  livestreamUrl: string;
  startTime: string;
  status: string;
  parts: { roundName: string; numQuestions: number }[];
}
interface Pub {
  pubId: string;
  name: string;
  members: Array<{ username: string }>;
}
interface User {
  username: string;
  uid: string;
}
interface Round {
  roundName: string;
  numQuestions: number;
}
type QuizStage =
  | "waiting"
  | "countdown"
  | "answering"
  | "locking"
  | "locked"
  | "swapping"
  | "marking"
  | "submitting-marks"
  | "loading-leaderboard"
  | "leaderboard"
  | "waiting-for-others"
  | "collecting"
  | "finished";
interface MarkingSheetProps {
  teamName: string;
  rounds: Round[];
  userAnswers: { [round: string]: string[] };
  correctAnswers: { [round: string]: string[] };
  onSubmit: (marks: { [round: string]: boolean[] }, funnyFlags?: any) => void;
  collectCountdown?: number | null;
}
interface PubRoomProps {
  quiz: Quiz;
  pub: Pub;
  currentUser: User;
  isAdmin?: boolean;
  quizStage: QuizStage;
  startCountdown?: number | null;
  lockCountdown?: number | null;
  onStartQuiz?: () => void;
  onLockAnswers?: () => void;
  part1Rounds: Round[];
  markingSheetProps?: MarkingSheetProps;
  leaderboardData?: {
    pubEntries: { name: string; score: number }[];
    allEntries: { name: string; score: number }[];
    pubAverages: { name: string; score: number }[];
  };
  currentPart: number;
  onStartNextPart?: () => void;
  collectCountdown?: number | null;
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export const PubRoom: React.FC<PubRoomProps> = ({
  quiz,
  pub,
  currentUser,

  quizStage,
  startCountdown,
  lockCountdown,

  part1Rounds,
  markingSheetProps,
  leaderboardData,
  currentPart,
  collectCountdown,
}) => {
  // === Info Banner ===
  let infoBanner = null;
  if (quizStage === "countdown" && typeof startCountdown === "number") {
    infoBanner = (
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 text-center">
        Quiz starts in {startCountdown}...
      </div>
    );
  } else if (quizStage === "answering") {
    infoBanner = (
      <div className="bg-green-100 border border-green-300 text-green-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 flex items-center gap-3 justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M8 12l2 2l4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quiz In Progress — enter your answers below!
      </div>
    );
  } else if (quizStage === "locking" && typeof lockCountdown === "number") {
    infoBanner = (
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 text-center">
        Answers will be locked in {lockCountdown} seconds...
      </div>
    );
  } else if (quizStage === "locked") {
    infoBanner = (
      <div className="bg-red-100 border border-red-300 text-red-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 text-center">
        The answer sheet is now locked. Please wait for the next part or
        instructions from the quizmaster.
      </div>
    );
  } else if (quizStage === "waiting") {
    infoBanner = (
      <div className="text-gray-500 text-center text-sm mt-8">
        Waiting for the quiz to start…
        <br />
        Watch the livestream, chat with your pub (soon!), and get ready!
      </div>
    );
  } else if (
    quizStage === "collecting" &&
    typeof collectCountdown === "number"
  ) {
    infoBanner = (
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 text-center">
        Collecting marked sheets… closing in {collectCountdown}s
      </div>
    );
  } else if (quizStage === "waiting-for-others") {
    infoBanner = (
      <div className="bg-blue-100 border border-blue-200 text-blue-800 font-bold py-2 px-8 rounded-xl shadow-sm mt-8 text-center">
        Waiting for other teams to finish marking…
      </div>
    );
  }

  // === Main Content Switcher ===
  let mainContent: React.ReactNode = null;
  if (
    quizStage === "answering" ||
    quizStage === "locking" ||
    quizStage === "locked"
  ) {
    mainContent = (
      <AnswerEntrySheet
        quizId={quiz.id}
        pubId={pub.pubId}
        userId={currentUser.uid}
        username={currentUser.username}
        currentPart={currentPart}
        partRounds={part1Rounds}
        locked={quizStage === "locked"}
        lockCountdown={quizStage === "locking" ? lockCountdown : null}
      />
    );
  } else if (quizStage === "swapping") {
    mainContent = <SwappingSpinner />;
  } else if (
    (quizStage === "marking" || quizStage === "collecting") &&
    markingSheetProps
  ) {
    mainContent = (
      <MarkingSheet
        {...markingSheetProps}
        markCountdown={
          quizStage === "collecting" ? collectCountdown : undefined
        }
      />
    );
  } else if (
    quizStage === "submitting-marks" ||
    quizStage === "loading-leaderboard"
  ) {
    mainContent = (
      <LoadingSpinner
        text={
          quizStage === "submitting-marks"
            ? "Submitting your marking…"
            : "Calculating scores, please wait…"
        }
      />
    );
  } else if (
    (quizStage === "leaderboard" || quizStage === "finished") &&
    leaderboardData
  ) {
    mainContent = (
      <PubLeaderboards
        pubEntries={leaderboardData.pubEntries}
        allEntries={leaderboardData.allEntries}
        pubAverages={leaderboardData.pubAverages}
        currentUser={currentUser.username}
        currentPub={pub.name}
      />
    );
  }
  // --- User Position Calculation for 'finished' ---
  let finishedMessage = null;

  if (
    (quizStage === "finished" || quizStage === "leaderboard") &&
    leaderboardData &&
    currentUser?.username
  ) {
    const { pubEntries = [], allEntries = [] } = leaderboardData;
    const pubPosition =
      pubEntries.findIndex((e) => e.name === currentUser.username) + 1;
    const overallPosition =
      allEntries.findIndex((e) => e.name === currentUser.username) + 1;
    const pubName = pub?.name || "your pub";

    if (quizStage === "finished") {
      finishedMessage = (
        <div className="bg-purple-100 border border-purple-300 rounded-xl px-6 py-4 mb-6 text-center text-lg font-semibold text-purple-800">
          {currentUser.username}, you came{" "}
          <span className="font-bold">
            {pubPosition > 0 ? ordinal(pubPosition) : "?"}
          </span>{" "}
          in <span className="font-bold">{pubName}</span>, and{" "}
          <span className="font-bold">
            {overallPosition > 0 ? ordinal(overallPosition) : "?"}
          </span>{" "}
          overall!
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-white py-12 flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-4xl w-full mb-8">
        <h1 className="text-3xl font-extrabold text-purple-800 mb-4">
          {quiz.title}
        </h1>
        <PubInfoHeader quiz={quiz} pub={pub} />

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <LivestreamEmbed url={quiz.livestreamUrl} />
            <PubMembersList
              members={pub.members.map((member) => member.username)}
              currentUser={currentUser.username}
              pubName={pub.name}
            />
          </div>
          <div className="w-full md:w-80">
            <PubChat />
          </div>
        </div>

        {/* Info Banner */}

        {infoBanner}

        {/* Show results message when quiz is finished */}
        {finishedMessage}

        {quizStage === "finished" && (
          <MyMarkedAnswers
            quizId={quiz.id}
            pubId={pub.pubId}
            userId={currentUser.uid}
            totalParts={quiz.parts.length}
          />
        )}
        {/* Main Stage Content */}
        <div className="mt-10">{mainContent}</div>
      </div>
    </div>
  );
};
