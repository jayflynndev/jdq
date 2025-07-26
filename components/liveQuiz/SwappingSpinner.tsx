export const SwappingSpinner = () => (
  <div className="flex flex-col items-center py-12">
    <svg
      className="animate-spin h-12 w-12 text-purple-600 mb-4"
      viewBox="0 0 24 24"
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
    <div className="text-lg text-purple-700 font-bold">
      Swapping answer sheets…
    </div>
    <div className="text-gray-500">
      Please wait while we assign sheets for marking.
    </div>
  </div>
);
