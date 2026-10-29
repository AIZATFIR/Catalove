import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full select-none touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

    const sizeStyles = {
      sm: "text-xs px-4 py-2 min-h-[38px]",
      md: "text-sm px-6 py-2.5 min-h-[44px]",
      lg: "text-base px-8 py-3.5 min-h-[50px] font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-caramel-600 text-white shadow-soft hover:bg-caramel-700 active:bg-caramel-800",
      secondary:
        "bg-butter-500 text-cocoa-900 shadow-soft hover:bg-butter-600 active:bg-butter-600 font-semibold",
      outline:
        "border border-caramel-300 text-cocoa-900 bg-transparent hover:bg-caramel-50 active:bg-caramel-100",
      ghost:
        "text-cocoa-800 bg-transparent hover:bg-caramel-50/80 active:bg-caramel-100",
      whatsapp:
        "bg-[#25D366] text-white shadow-soft hover:bg-[#20BD5A] active:bg-[#1DA850] font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>Memproses...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
