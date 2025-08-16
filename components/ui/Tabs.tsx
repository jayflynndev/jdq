"use client";
import React from "react";
import clsx from "clsx";

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export function Tabs({
  items,
  value,
  onChange,
  size = "md",
  fullWidth,
}: TabsProps) {
  return (
    <div className="w-full">
      <div
        role="tablist"
        className={clsx(
          "inline-flex bg-black/5 dark:bg-white/10 rounded-lg p-1",
          fullWidth && "w-full"
        )}
      >
        {items.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "relative rounded-md transition-all duration-200 ease-out-soft",
                "text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/30",
                size === "sm" ? "px-3 py-1.5" : "px-4 py-2",
                active
                  ? "bg-white dark:bg-surface-inverted text-textc shadow-card"
                  : "text-textc-muted hover:text-textc"
              )}
              style={{ flex: fullWidth ? 1 : undefined }}
            >
              <span>{tab.label}</span>
              {tab.badge && <span className="ml-2">{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
