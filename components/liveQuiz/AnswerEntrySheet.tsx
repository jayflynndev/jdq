"use client";
import React, { useState, useEffect, useRef } from "react";
import { db } from "@/app/firebase/config";
import { doc, setDoc } from "firebase/firestore";

type AnswerEntrySheetProps = {
  quizId: string;
  pubId: string;
  userId: string;
  username: string;
  currentPart: number;
  partRounds: { roundName: string; numQuestions: number }[];
  locked?: boolean;
  lockCountdown?: number | null;
};

const getStorageKey = (
  quizId: string,
  pubId: string,
  userId: string,
  currentPart: number
) => `answers_${quizId}_${pubId}_${userId}_part${currentPart}`;

type AnswerRoundProps = {
  roundName: string;
  numQuestions: number;
  answers: string[];
  onAnswerChange: (qIdx: number, value: string) => void;
  locked: boolean;
  className?: string;
};

const AnswerRound = ({
  roundName,
  numQuestions,
  answers,
  onAnswerChange,
  locked,
  className = "",
}: AnswerRoundProps) => (
  <div
    className={`bg-purple-50 rounded-2xl border border-purple-200 p-6 flex flex-col shadow-sm transition-all ${className}`}
    style={{ minWidth: 260 }}
  >
    <h3 className="font-bold text-xl text-purple-800 mb-6 text-center tracking-tight">
      {roundName}
    </h3>
    <div className="flex flex-col gap-4">
      {Array.from({ length: numQuestions }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <label className="w-9 text-base font-medium text-gray-700 shrink-0">
            {`Q${i + 1}`}
          </label>
          <input
            type="text"
            className={`flex-1 px-4 py-2 border rounded-xl text-base transition
              focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none
              ${
                locked
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : answers[i]?.length === 0
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-white"
              }
            `}
            value={answers[i] || ""}
            onChange={(e) => onAnswerChange(i, e.target.value)}
            disabled={locked}
            maxLength={200}
            placeholder={locked ? "" : "Enter answer"}
            autoComplete="off"
            style={{ minWidth: 0 }}
          />
        </div>
      ))}
    </div>
  </div>
);

export const AnswerEntrySheet: React.FC<AnswerEntrySheetProps> = ({
  quizId,
  pubId,
  userId,
  username,
  currentPart,
  partRounds,
  locked = false,
  lockCountdown = null,
}) => {
  const [allAnswers, setAllAnswers] = useState<{ [round: string]: string[] }>(
    () =>
      Object.fromEntries(
        partRounds.map((r) => [r.roundName, Array(r.numQuestions).fill("")])
      )
  );
  const [autosaveStatus, setAutosaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [submitted, setSubmitted] = useState(false);

  // Restore from localStorage on mount/quiz change
  useEffect(() => {
    if (!quizId || !pubId || !userId || !currentPart || !partRounds.length)
      return;
    const storageKey = getStorageKey(quizId, pubId, userId, currentPart);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setAllAnswers(JSON.parse(saved));
      } catch {
        setAllAnswers(
          Object.fromEntries(
            partRounds.map((r) => [r.roundName, Array(r.numQuestions).fill("")])
          )
        );
      }
    } else {
      setAllAnswers(
        Object.fromEntries(
          partRounds.map((r) => [r.roundName, Array(r.numQuestions).fill("")])
        )
      );
    }
    // eslint-disable-next-line
  }, [quizId, pubId, userId, currentPart, JSON.stringify(partRounds)]);

  // Save to localStorage on answers change
  const partRoundsString = JSON.stringify(partRounds);
  useEffect(() => {
    if (!quizId || !pubId || !userId || !currentPart || !partRounds.length)
      return;
    const storageKey = getStorageKey(quizId, pubId, userId, currentPart);
    localStorage.setItem(storageKey, JSON.stringify(allAnswers));
  }, [
    allAnswers,
    quizId,
    pubId,
    userId,
    currentPart,
    partRoundsString,
    partRounds.length,
  ]);

  // Handle input
  const handleAnswerChange = (
    roundName: string,
    qIdx: number,
    value: string
  ) => {
    setAutosaveStatus("saving");
    setAllAnswers((prev) => {
      const newAnswers = { ...prev };
      newAnswers[roundName] = [...(newAnswers[roundName] || [])];
      newAnswers[roundName][qIdx] = value;
      return newAnswers;
    });
    setTimeout(() => setAutosaveStatus("saved"), 500);
  };

  // SUBMIT ANSWERS WHEN SHEET LOCKED
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    // Only submit if: locked and NOT already submitted
    if (locked && !submitted) {
      if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;

        // Random sheet number between 1-10
        const sheetNumber = Math.floor(Math.random() * 10) + 1;

        setDoc(
          doc(
            db,
            "liveAnswers",
            `${quizId}_${pubId}_${userId}_part${currentPart}`
          ),
          {
            quizId,
            pubId,
            userId,
            username,
            currentPart,
            answers: allAnswers,
            rounds: partRounds,
            submittedAt: new Date().toISOString(),
            sheetNumber, // for swapping
          }
        ).then(() => {
          setSubmitted(true);
          // You can optionally clear localStorage here for this part if you want!
        });
      }
    }
    if (!locked) {
      hasSubmittedRef.current = false;
      setSubmitted(false);
    }
  }, [
    locked,
    allAnswers,
    quizId,
    pubId,
    userId,
    currentPart,
    username,
    submitted,
    partRounds,
  ]);

  // Column logic
  const cols = partRounds.length > 2 ? 3 : partRounds.length;

  // ---- Banners/Feedback ----
  let infoBanner = null;
  if (!locked && typeof lockCountdown === "number" && lockCountdown > 0) {
    infoBanner = (
      <div className="mb-6 w-full flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-800 font-semibold py-2 px-6 rounded-xl border border-yellow-200 shadow-sm">
          Answers will be locked in {lockCountdown} seconds…
        </div>
      </div>
    );
  } else if (locked && !submitted) {
    infoBanner = (
      <div className="mb-6 w-full flex items-center justify-center">
        <div className="bg-yellow-100 text-yellow-800 font-semibold py-2 px-6 rounded-xl border border-yellow-200 shadow-sm">
          Submitting your answers...
        </div>
      </div>
    );
  } else if (locked && submitted) {
    infoBanner = (
      <div className="mb-6 w-full flex items-center justify-center">
        <div className="bg-green-100 text-green-800 font-semibold py-2 px-6 rounded-xl border border-green-200 shadow-sm">
          Answers submitted! Awaiting answer sheet to mark. Please wait…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-8 w-full max-w-6xl">
      <h2 className="font-extrabold text-2xl text-purple-800 mb-8 text-center">
        Enter Your Answers
      </h2>

      {infoBanner}

      {/* Hide the form if answers are submitted */}
      {!locked && (
        <div
          className={`grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-${cols}`}
        >
          {partRounds.map((round) => (
            <AnswerRound
              key={round.roundName}
              roundName={round.roundName}
              numQuestions={round.numQuestions}
              answers={allAnswers[round.roundName]}
              onAnswerChange={(qIdx: number, value: string) =>
                handleAnswerChange(round.roundName, qIdx, value)
              }
              locked={false}
            />
          ))}
        </div>
      )}
      {/* Hide form when locked/submitted */}
      {locked && submitted && (
        <div className="text-center py-16 text-lg text-purple-700">
          Answers submitted and locked. Awaiting answer sheet to mark. Please
          wait…
        </div>
      )}
      {/* Status below */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <span className="text-sm text-gray-600">
          {!locked
            ? autosaveStatus === "saving"
              ? "Autosaving..."
              : autosaveStatus === "saved"
              ? "All changes saved ✓"
              : "Answers will be saved automatically."
            : ""}
        </span>
      </div>
    </div>
  );
};
