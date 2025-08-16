"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/app/firebase/config";
import { doc, getDoc } from "firebase/firestore";

type Round = { roundName: string; numQuestions: number };
type PartData = {
  partNum: number;
  userAnswers: { [roundName: string]: string[] };
  marks: { [roundName: string]: boolean[] };
  rounds: Round[];
};

export const MyMarkedAnswers: React.FC<{
  quizId: string;
  pubId: string;
  userId: string;
  totalParts: number;
}> = ({ quizId, pubId, userId, totalParts }) => {
  const [loading, setLoading] = useState(true);
  const [allParts, setAllParts] = useState<PartData[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const partsArr: PartData[] = [];
      for (let partNum = 1; partNum <= totalParts; partNum++) {
        // 1. Fetch answers
        const answersDocId = `${quizId}_${pubId}_${userId}_part${partNum}`;
        const answersSnap = await getDoc(doc(db, "liveAnswers", answersDocId));

        let userAnswers: { [roundName: string]: string[] } = {};
        let rounds: Round[] = [];
        if (answersSnap.exists()) {
          userAnswers = answersSnap.data().answers || {};
          rounds = answersSnap.data().rounds || [];
        }

        // 2. Fetch marks (from markingTasks), but find assignment for *this user as targetUid*
        const markingTaskDocId = `${quizId}_part${partNum}`;
        const markingSnap = await getDoc(
          doc(db, "markingTasks", markingTaskDocId)
        );
        let marks: { [roundName: string]: boolean[] } = {};
        if (markingSnap.exists()) {
          const assignments =
            markingSnap.data()?.pubs?.[pubId]?.assignments || {};
          for (const assignKey in assignments) {
            if (assignments[assignKey]?.targetUid === userId) {
              marks = assignments[assignKey].marks || {};
              break;
            }
          }
        }

        partsArr.push({ partNum, userAnswers, marks, rounds });
      }
      setAllParts(partsArr);
      setLoading(false);
    };
    fetchAll();
    // Only runs once (when finished page loads)
  }, [quizId, pubId, userId, totalParts]);

  if (loading)
    return <div className="text-center py-6">Loading your marked answers…</div>;
  if (!allParts.length)
    return <div className="text-center text-red-500">No answers found.</div>;

  return (
    <div className="mt-8 bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-bold mb-4 text-purple-700">
        Your Marked Answers
      </h3>
      {allParts.map((part, pi) => (
        <div key={pi} className="mb-6">
          <h4 className="font-semibold mb-2 text-purple-700">
            Part {part.partNum}
          </h4>
          {part.rounds && part.rounds.length > 0 ? (
            part.rounds.map((round) => {
              const roundName = round.roundName;
              const answers = part.userAnswers?.[roundName] || [];
              const marks = part.marks?.[roundName] || [];
              return (
                <div key={roundName} className="mb-2">
                  <div className="font-semibold">{roundName}</div>
                  {answers.length === 0 ? (
                    <div className="text-gray-400">(no answers)</div>
                  ) : (
                    <ol className="list-decimal list-inside ml-4">
                      {answers.map((ans, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-6 text-gray-500">{i + 1}.</span>
                          <span>
                            {ans || (
                              <span className="text-gray-400">(no answer)</span>
                            )}
                          </span>
                          {marks[i] === true ? (
                            <span className="ml-2 text-green-600 font-bold">
                              ✔️
                            </span>
                          ) : (
                            <span className="ml-2 text-red-500 font-bold">
                              ❌
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-gray-400">(no rounds)</div>
          )}
        </div>
      ))}
    </div>
  );
};
