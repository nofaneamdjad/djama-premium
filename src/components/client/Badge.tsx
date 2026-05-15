"use client";

interface BadgeProps {
  label:    string;
    color?:   string;
    bg?:      string;
    border?:  string;
    variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple";
  size?:    "xs" | "sm";
  className?: string;
  dot?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "bg-emerald-50  border-emerald-200 text-emerald-700",
  warning: "bg-amber-50    border-amber-200   text-amber-700",
  error:   "bg-red-50      border-red-200     text-red-600",
  info:    "bg-blue-50     border-blue-200    text-blue-700",
  neutral: "bg-gray-100    border-gray-200    text-gray-600",
  purple:  "bg-violet-50   border-violet-200  text-violet-700",
};

export function Badge({
  label,
  color,
  bg,
  border,
  variant,
  size = "xs",
  className = "",
  dot = false,
}: BadgeProps) {
  const sizeClass = size === "xs"
    ? "px-2 py-0.5 text-[0.65rem]"
    : "px-2.5 py-1 text-xs";

  const variantClass = variant ? VARIANT_CLASSES[variant] : "";

  const inlineStyle = !variant && (color || bg) ? {
    color,
    background: bg,
    borderColor: border ?? (color ? color + "30" : undefined),
  } : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${sizeClass} ${variantClass} ${className}`}
      style={inlineStyle}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: color ?? "currentColor" }}
        />
      )}
      {label}
    </span>
  );
}

export default Badge;
