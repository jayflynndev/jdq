import React from "react";
import clsx from "clsx";

type Variant = "accent" | "gold" | "brand" | "neutral";
type Size = "sm" | "md";

const sizes: Record<Size, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

const variants: Record<Variant, string> = {
  accent: "bg-accent/15 text-accent",
  gold: "bg-highlight/15 text-highlight",
  brand: "bg-brand/15 text-brand",
  // in variants:
  neutral:
    "bg-transparent text-textc-muted ring-1 ring-borderc/70 dark:ring-white/20",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "badge inline-flex items-center rounded-full font-medium",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
