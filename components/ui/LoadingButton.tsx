import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading = false,
  variant = "primary",
  children,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const baseClass =
    variant === "primary" ? "qhl-btn-primary" : "qhl-btn-secondary";

  return (
    <button
      className={`${baseClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
