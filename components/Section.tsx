// components/Section.tsx
import React from "react";

interface SectionProps {
  children: React.ReactNode;
  /** e.g. "bg-gradient-to-t from-purple-900 to-purple-200" */
  bgClass?: string;
  /** e.g. "px-4" */
  pxClass?: string;
  /** e.g. "py-12" */
  pyClass?: string;
  /** if true, wraps content in a centered container */
  container?: boolean;
}

export default function Section({
  children,
  bgClass = "",
  pxClass = "px-4",
  pyClass = "py-12",
  container = false,
}: SectionProps) {
  return (
    <section className={`${bgClass} ${pxClass} ${pyClass}`}>
      {container ? (
        <div className="max-w-6xl mx-auto">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
