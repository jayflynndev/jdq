import React from "react";
import clsx from "clsx";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h2 className="font-heading text-2xl sm:text-3xl text-textc">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-textc-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
