// components/QuizCountdown.tsx
import React from "react";

export const QuizCountdown = ({ countdown }: { countdown: number }) => (
  <div className="flex flex-col items-center py-4">
    <div className="text-lg text-purple-700 font-semibold mb-2">
      Quiz starts in…
    </div>
    <div className="text-6xl font-extrabold text-purple-900 tracking-wide drop-shadow-lg">
      {countdown > 0 ? countdown : "Go!"}
    </div>
  </div>
);
