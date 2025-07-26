"use client";
import React from "react";

type AdminQuizHeaderProps = {
  quiz: {
    id: string | number;
    title: string;
    startTime?: string | number | Date;
  };
  currentPart: number;
  totalParts: number;
  quizStatus: string;
};

export const AdminQuizHeader = ({
  quiz,
  currentPart,
  totalParts,
  quizStatus,
}: AdminQuizHeaderProps) => (
  <div className="mb-6">
    <div className="text-xl font-bold">{quiz.title}</div>
    <div className="text-gray-500 text-sm">
      {quiz.startTime ? new Date(quiz.startTime).toLocaleString() : ""}
    </div>
    <div className="text-xs text-gray-400 mt-2">Quiz ID: {quiz.id}</div>
    <div className="mb-4">
      <div className="font-semibold text-purple-700 mb-1">Current Stage:</div>
      <div className="font-bold text-lg mb-2 capitalize">
        {quizStatus}{" "}
        {totalParts > 1 ? `(Part ${currentPart} of ${totalParts})` : ""}
      </div>
    </div>
  </div>
);
