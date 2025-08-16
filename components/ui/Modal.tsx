"use client";
import React, { useEffect } from "react";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div
        className={clsx(
          "relative w-full mx-auto bg-white dark:bg-surface-inverted rounded-lg shadow-card p-5 sm:p-6",
          "transition-all duration-200 ease-out-soft translate-y-0 sm:translate-y-[-6%]",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-3">
            <h3 id="modal-title" className="text-xl font-heading">
              {title}
            </h3>
          </div>
        )}
        <div>{children}</div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-md p-2 text-textc-muted hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
