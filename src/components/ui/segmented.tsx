"use client";

import { cn } from "@/lib/utils";

/** Pill switch for 2-4 mutually exclusive options, with a raised thumb on the active one. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-grid w-full auto-cols-fr grid-flow-col rounded-full bg-fill-1 p-[3px]",
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3.5 font-medium whitespace-nowrap transition-[background-color,box-shadow,color] duration-300 ease-spring outline-none focus-visible:ring-4 focus-visible:ring-ring/45",
              size === "sm" ? "h-8 text-[13px]" : "h-[38px] text-sm",
              on
                ? "bg-raised font-semibold text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
