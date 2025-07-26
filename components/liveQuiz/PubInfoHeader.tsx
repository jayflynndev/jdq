import React from "react";

interface Quiz {
  startTime: string | number | Date;
  status: string;
}

interface Pub {
  name: string;
}

interface PubInfoHeaderProps {
  quiz: Quiz;
  pub: Pub;
}

export const PubInfoHeader: React.FC<PubInfoHeaderProps> = ({ quiz, pub }) => (
  <div className="flex flex-wrap gap-4 items-center mb-4">
    <span className="bg-purple-200 text-purple-900 rounded px-3 py-1 font-semibold">
      Pub: {pub.name}
    </span>
    <span className="text-gray-500 text-sm">
      Starts:{" "}
      {new Date(quiz.startTime).toLocaleString("en-GB", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })}
    </span>
    <span className="bg-gray-100 text-gray-700 rounded px-2 py-1 text-xs">
      Status: {quiz.status.toUpperCase()}
    </span>
  </div>
);
