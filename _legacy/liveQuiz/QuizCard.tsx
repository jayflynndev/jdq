import React from "react";
import { FaLock, FaUnlock } from "react-icons/fa";
import { GiBeerStein } from "react-icons/gi";
import { ordinal } from "@/utils/leaderboardUtils";
interface Pub {
  pubId: string;
  name: string;
  members: string[]; // Array of UIDs
  maxTeams?: number;
}

interface Quiz {
  id: string;
  title: string;
  startTime: string | number | Date;
  status: "live" | "upcoming" | "finished";
  locked: boolean;
  pubs?: Pub[];
}

interface User {
  isAdmin: boolean;
  uid: string;
  username: string;
  quizMembership: { [quizId: string]: string };
}

interface QuizCardProps {
  quiz: Quiz;
  user: User;
  onJoinPub: (quizId: string, pubId: string) => void;
  onJoinRandomPub: (quizId: string) => void;
  onRejoin: (quizId: string, pubId: string) => void;
  onLock: (quizId: string) => void;
  uidToUsername?: { [uid: string]: string };
  stats?: {
    score?: number;
    pubPosition?: number;
    globalPosition?: number;
  }; // Optional for future: mapping uids to usernames
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  user,
  onJoinPub,
  onJoinRandomPub,
  onRejoin,
  onLock,

  stats,
}) => {
  console.log("QuizCard quiz prop:", quiz);

  // Defensive: always array
  const pubs: Pub[] = Array.isArray(quiz.pubs) ? quiz.pubs : [];

  // --- User pub membership for this quiz ---
  const userPubId = user.quizMembership?.[quiz.id];
  const isInQuiz = !!userPubId;
  const isLocked = quiz.locked;

  // Filter only non-full pubs (default max 10)
  const availablePubs = pubs.filter((pub) =>
    Array.isArray(pub.members)
      ? pub.members.length < (pub.maxTeams || 10)
      : true
  );

  // ADMIN CONTROLS (lock/unlock)
  const adminControls = user.isAdmin ? (
    <button
      onClick={() => onLock(quiz.id)}
      className="ml-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
      title={quiz.locked ? "Unlock Quiz" : "Lock Quiz"}
    >
      {quiz.locked ? (
        <FaUnlock className="w-5 h-5 text-gray-700" />
      ) : (
        <FaLock className="w-5 h-5 text-gray-700" />
      )}
    </button>
  ) : null;

  // Status badge (Live/Upcoming/Finished)
  const statusBadge = (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
        quiz.status === "live"
          ? "bg-green-100 text-green-700"
          : quiz.status === "upcoming"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-200 text-gray-700"
      }`}
    >
      {quiz.status.toUpperCase()}
    </span>
  );

  // --- ACTION AREA: Join, Rejoin, Full, etc. ---
  let actionArea: React.ReactNode = null;

  if (quiz.status === "finished") {
    if (stats) {
      actionArea = (
        <div className="mb-3 p-3 rounded-xl bg-purple-50 text-purple-800 font-medium text-center">
          <div>
            Score: <span className="font-bold">{stats.score ?? "N/A"}</span>
          </div>
          <div>
            Pub Position:{" "}
            <span className="font-bold">
              {stats.pubPosition ? ordinal(stats.pubPosition) : "N/A"}
            </span>
          </div>
          <div>
            Global Position:{" "}
            <span className="font-bold">
              {stats.globalPosition ? ordinal(stats.globalPosition) : "N/A"}
            </span>
          </div>
        </div>
      );
    } else {
      // Otherwise just show a finished message
      actionArea = (
        <div className="text-gray-600 font-semibold bg-gray-100 rounded-xl py-4 px-4 text-center mt-2">
          Quiz finished. You did not take part in this quiz.
        </div>
      );
    }
  } else if (isLocked && !isInQuiz) {
    actionArea = (
      <div className="text-red-700 text-base font-semibold bg-red-100 rounded-xl py-2 px-4 text-center mt-2">
        Unable to join the quiz this evening.
      </div>
    );
  } else if (isInQuiz) {
    actionArea = (
      <button
        onClick={() => onRejoin(quiz.id, userPubId)}
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl py-3 px-4 font-bold mt-3 shadow"
      >
        You are already in a quiz.
        <br />
        Click here to rejoin your pub.
      </button>
    );
  } else {
    actionArea = (
      <div className="flex flex-col gap-2 mt-3">
        {pubs.map((pub) => {
          const isFull = Array.isArray(pub.members)
            ? pub.members.length >= (pub.maxTeams || 10)
            : false;
          return (
            <div
              key={pub.pubId}
              className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 shadow-sm"
            >
              <div>
                <div className="font-semibold text-purple-700 flex items-center gap-2">
                  <GiBeerStein className="w-5 h-5 text-yellow-700" />
                  {pub.name}
                  <span className="text-xs font-normal ml-2 bg-purple-200 rounded px-2 py-0.5">
                    {Array.isArray(pub.members) ? pub.members.length : 0}/
                    {pub.maxTeams || 10}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {pub.members.length} player
                  {pub.members.length === 1 ? "" : "s"}
                </div>
              </div>
              <div>
                {isFull ? (
                  <button
                    disabled
                    className="bg-gray-200 text-gray-500 px-4 py-2 rounded-xl font-bold cursor-not-allowed"
                  >
                    Full
                  </button>
                ) : (
                  <button
                    onClick={() => onJoinPub(quiz.id, pub.pubId)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold transition"
                  >
                    Join
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {availablePubs.length > 0 && (
          <button
            onClick={() => onJoinRandomPub(quiz.id)}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold shadow mt-2 transition"
          >
            Join Random Pub
          </button>
        )}
        {availablePubs.length === 0 && (
          <div className="w-full text-center text-gray-500 bg-gray-50 rounded-xl py-3 mt-2">
            All pubs are currently full.
          </div>
        )}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 w-full max-w-xl mb-8 border border-purple-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-bold text-2xl text-purple-900">{quiz.title}</h2>
          <div className="text-gray-500 text-sm mt-1 flex gap-2 items-center">
            {new Date(quiz.startTime).toLocaleString("en-GB", {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            })}
            {statusBadge}
          </div>
        </div>
        {adminControls}
      </div>

      <div className="mt-2">
        <div className="font-medium text-purple-700 mb-2">Pub Rooms:</div>
      </div>

      {actionArea}
    </div>
  );
};
