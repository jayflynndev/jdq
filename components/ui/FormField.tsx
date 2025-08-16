import React from "react";
import clsx from "clsx";

interface BaseProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: BaseProps) {
  return (
    <div className={clsx("w-full", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-textc mb-1"
      >
        {label} {required && <span className="text-brand ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-textc-muted">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextInput({
  className,
  leftIcon,
  rightIcon,
  ...props
}: TextInputProps) {
  return (
    <div className={clsx("relative")}>
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {leftIcon}
        </div>
      )}
      <input
        className={clsx(
          "w-full h-10 rounded-lg border borderc bg-white dark:bg-surface-inverted/60",
          "px-3 focus:outline-none focus:ring-4 focus:ring-brand/20",
          leftIcon && "pl-9",
          rightIcon && "pr-10",
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightIcon}
        </div>
      )}
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full h-10 rounded-lg border borderc bg-white dark:bg-surface-inverted/60 px-3",
        "focus:outline-none focus:ring-4 focus:ring-brand/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full min-h-[96px] rounded-lg border borderc bg-white dark:bg-surface-inverted/60 p-3",
        "focus:outline-none focus:ring-4 focus:ring-brand/20",
        className
      )}
      {...props}
    />
  );
}
