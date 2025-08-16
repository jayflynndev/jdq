"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

type Variant = "brand" | "accent" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string; // ✅ Allow link
}

const base =
  "btn rounded-lg font-medium inline-flex items-center justify-center transition-transform duration-200 ease-out-soft focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-[15px]",
  lg: "h-12 px-5 text-base",
};

const variantStyles: Record<Variant, string> = {
  brand:
    "bg-brand text-white shadow-card hover:shadow-hover hover:translate-y-[-1px] active:translate-y-0 focus:ring-4 focus:ring-brand/30",
  accent:
    "bg-accent text-accent-900 shadow-card hover:shadow-hover hover:translate-y-[-1px] active:translate-y-0 focus:ring-4 focus:ring-accent/30",
  ghost:
    "bg-transparent hover:bg-brand/10 text-brand border border-transparent",
  outline:
    "bg-transparent border borderc text-textc hover:bg-brand/10 hover:border-brand/40",
};

export function BrandButton({
  variant = "brand",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  href, // ✅ Now supported
  ...props
}: BrandButtonProps) {
  const classes = clsx(
    base,
    sizeStyles[size],
    variantStyles[variant],
    className
  );

  const content = (
    <>
      {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
      <span className={clsx(loading && "opacity-0")}>{children}</span>
      {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
      {loading && (
        <span
          className="absolute inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden
        />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
