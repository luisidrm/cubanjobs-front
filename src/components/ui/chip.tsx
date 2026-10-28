"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * selectable: 40px, fill when off, accent + check when on (onboarding skills).
 * filter: 36px, white hairline when off, accent when on (search filters).
 * removable: 36px white hairline with a trailing x (selected summary).
 */
export function Chip({
  label,
  variant = "selectable",
  selected,
  onClick,
  onRemove,
  removeLabel,
  disabled,
  className,
}: {
  label: string;
  variant?: "selectable" | "filter" | "removable";
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  if (variant === "removable") {
    return (
      <span
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full bg-card pr-1.5 pl-3.5 text-sm font-semibold ring-1 ring-separator",
          className,
        )}
      >
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${label}`}
          className="grid size-6 place-items-center rounded-full text-text-3 transition-colors hover:bg-fill-1 hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/45 focus-visible:outline-none"
        >
          <X className="size-[15px]" />
        </button>
      </span>
    );
  }

  const selectable = variant === "selectable";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!!selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-sm font-semibold transition-[background-color,transform] duration-200 ease-spring outline-none focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-95 disabled:opacity-60",
        selectable ? "h-10 px-[15px]" : "h-9 px-4",
        selected
          ? "bg-primary text-primary-foreground"
          : selectable
            ? "bg-fill-1 text-foreground hover:bg-fill-2"
            : "bg-card text-foreground ring-1 ring-separator hover:bg-fill-1",
        className,
      )}
    >
      {selectable && selected ? <Check className="size-[15px]" /> : null}
      {label}
    </button>
  );
}
