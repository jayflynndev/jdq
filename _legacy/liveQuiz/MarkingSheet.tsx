"use client";
import React, { useState } from "react";
import { useEffect, useRef } from "react";

export interface MarkingSheetProps {
  teamName: string;
  rounds: { roundName: string; numQuestions: number }[];
  userAnswers: { [roundName: string]: string[] };
  /** now receives both correct marks and funny flags */
  onSubmit: (
    marks: { [roundName: string]: boolean[] },
    funnyFlags: { [roundName: string]: boolean[] }
  ) => void;
}

export const MarkingSheet: React.FC<
  MarkingSheetProps & { markCountdown?: number | null }
> = ({ teamName, rounds, userAnswers, onSubmit, markCountdown }) => {
  // correct-answer ticks
  const [marks, setMarks] = useState<{ [round: string]: boolean[] }>(() =>
    Object.fromEntries(
      rounds.map((r) => [r.roundName, Array(r.numQuestions).fill(false)])
    )
  );
  console.log("MarkingSheet rendered", { markCountdown });

  const marksRef = useRef(marks);
  const [funnyFlags, setFunnyFlags] = useState<{ [round: string]: boolean[] }>(
    () =>
      Object.fromEntries(
        rounds.map((r) => [r.roundName, Array(r.numQuestions).fill(false)])
      )
  );
  const funnyFlagsRef = useRef(funnyFlags);
  useEffect(() => {
    marksRef.current = marks;
  }, [marks]);
  useEffect(() => {
    funnyFlagsRef.current = funnyFlags; // ← ADDED
  }, [funnyFlags]);
  useEffect(() => {
    console.log("Auto-submit check:", { markCountdown });
    if (markCountdown === 0) {
      console.log(
        "Auto-submit triggered",
        marksRef.current,
        funnyFlagsRef.current
      );

      onSubmit(marksRef.current, funnyFlagsRef.current);
    }
  }, [markCountdown, onSubmit, funnyFlags]);

  // funny-answer flags

  const handleMark = (round: string, idx: number, value: boolean) => {
    setMarks((prev) => ({
      ...prev,
      [round]: prev[round].map((v, i) => (i === idx ? value : v)),
    }));
  };

  const handleFunny = (round: string, idx: number, value: boolean) => {
    setFunnyFlags((prev) => ({
      ...prev,
      [round]: prev[round].map((v, i) => (i === idx ? value : v)),
    }));
  };

  const totalCorrect = Object.values(marks).reduce(
    (sum, arr) => sum + arr.filter(Boolean).length,
    0
  );
  const totalQuestions = rounds.reduce((sum, r) => sum + r.numQuestions, 0);

  return (
    <div className="bg-white rounded-2xl shadow p-8 w-full max-w-3xl mx-auto">
      <h2 className="font-extrabold text-xl text-purple-800 mb-2 text-center">
        Marking Answers for <span className="text-blue-700">{teamName}</span>
      </h2>
      <div className="mb-6 text-gray-500 text-center">
        Tick each answer that is correct. Click the 😂 if it’s a funny one.
      </div>

      {markCountdown != null && (
        <div className="mb-4 text-center font-bold text-purple-700">
          {(markCountdown ?? 0) > 0
            ? `Time remaining: ${markCountdown ?? 0}s`
            : `Auto‑submitting your marks…`}
        </div>
      )}

      {rounds.map((round) => (
        <div key={round.roundName} className="mb-8">
          <h3 className="font-bold text-lg text-purple-700 mb-2">
            {round.roundName}
          </h3>
          <div className="flex flex-col gap-2">
            {Array.from({ length: round.numQuestions }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="w-8 text-gray-700 font-semibold">{`Q${
                  i + 1
                }`}</div>
                <input
                  className="flex-1 px-3 py-1 border rounded bg-gray-50 text-gray-700"
                  value={userAnswers[round.roundName]?.[i] || ""}
                  readOnly
                  disabled
                />
                {/* correct tick */}
                <input
                  type="checkbox"
                  checked={marks[round.roundName]?.[i] || false}
                  onChange={(e) =>
                    handleMark(round.roundName, i, e.target.checked)
                  }
                  className="w-5 h-5 accent-green-500"
                  id={`mark_${round.roundName}_${i}`}
                />
                <label
                  htmlFor={`mark_${round.roundName}_${i}`}
                  className="ml-1 text-green-700 font-bold"
                >
                  ✓
                </label>
                {/* funny flag */}
                <input
                  type="checkbox"
                  checked={funnyFlags[round.roundName]?.[i] || false}
                  onChange={(e) =>
                    handleFunny(round.roundName, i, e.target.checked)
                  }
                  className="w-5 h-5 accent-yellow-500"
                  id={`funny_${round.roundName}_${i}`}
                />
                <label
                  htmlFor={`funny_${round.roundName}_${i}`}
                  className="ml-1 text-yellow-700"
                >
                  😂
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6 text-lg text-center">
        <span className="font-bold text-purple-800">Score: {totalCorrect}</span>{" "}
        / {totalQuestions}
      </div>
    </div>
  );
};
