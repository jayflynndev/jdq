// components/ui/Card.tsx
"use client";
import * as React from "react";
import clsx from "clsx";

type CardVariant = "pop" | "plain"; // "pop" is the new default

export function Card({
  className,
  variant = "pop",
  hover = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  hover?: boolean;
}) {
  const base = "rounded-lg border borderc shadow-lg p-4 sm:p-6 transition-all";
  const variants: Record<CardVariant, string> = {
    pop:
      // glassy white that works on purple gradient, with subtle brand tint
      "bg-white/85 dark:bg-surface-inverted/50 backdrop-blur-md " +
      "border-white/40 dark:border-white/10 " +
      "shadow-purple-900/15",
    plain: "bg-white dark:bg-surface-inverted/60 shadow-card", // your previous look
  };
  const hoverFx =
    hover && variant === "pop"
      ? "hover:translate-y-[-2px] hover:shadow-xl hover:shadow-purple-900/20"
      : "";

  return (
    <div
      className={clsx(base, variants[variant], hoverFx, className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx("font-heading text-xl text-textc", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-sm text-textc-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("space-y-3", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mt-4", className)} {...props} />;
}
