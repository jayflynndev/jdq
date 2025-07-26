import React from "react";

export const LoadingSpinner = ({
  text = "Loading…",
  size = 12, // Tailwind size, eg 12 = h-12 w-12
  colorClass = "text-purple-600",
}) => (
  <div className="flex flex-col items-center py-16">
    <svg
      className={`animate-spin h-${size} w-${size} ${colorClass} mb-4`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
    <div className="text-lg text-purple-700 font-bold text-center">{text}</div>
  </div>
);
