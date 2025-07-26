"use client";
import React from "react";

type AdminButton = {
  label: string;
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type AdminControlsProps = {
  adminButtons: AdminButton[];
};

export const AdminControls: React.FC<AdminControlsProps> = ({
  adminButtons,
}) => (
  <div className="flex flex-col gap-3">
    {adminButtons
      .filter((b) => b.visible)
      .map((b, i) => (
        <button
          key={i}
          className={`w-full px-4 py-3 rounded font-semibold text-lg transition text-left ${
            b.disabled
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
          disabled={b.disabled}
          onClick={b.onClick}
        >
          {b.label}
        </button>
      ))}
  </div>
);
