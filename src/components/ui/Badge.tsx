import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "ready" | "preorder" | "soldout" | "category" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "neutral",
  size = "md",
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
  };

  const variantStyles = {
    ready: "bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 font-semibold",
    preorder: "bg-butter-100 text-amber-900 border border-butter-300 font-semibold",
    soldout: "bg-rose-100 text-rose-800 border border-rose-200 font-semibold",
    category: "bg-caramel-100/80 text-caramel-800 border border-caramel-200/60 font-medium",
    neutral: "bg-vanilla-200 text-cocoa-700 border border-vanilla-300 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {variant === "ready" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
      )}
      {children}
    </span>
  );
};
