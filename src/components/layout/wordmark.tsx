import { cn } from "@/lib/utils";

/** Brújula wordmark: Geist Bold with -0.04em tracking. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("font-bold tracking-[-0.04em] text-foreground", className)}
    >
      Brújula
    </span>
  );
}

/**
 * The compass-needle mark: ring + split needle (north in the brand teal,
 * south in ink). Same geometry as the original logo; colored from theme
 * tokens so it works in light and dark.
 */
export function LogoMark({
  className,
  strokeWidth = 3,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("size-[1.15em] shrink-0", className)}
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={strokeWidth}
      />
      <polygon points="50,12 63,50 50,50" fill="var(--primary)" />
      <polygon points="50,88 37,50 50,50" fill="var(--foreground)" />
    </svg>
  );
}

/** Horizontal lockup: mark on the left, wordmark on the right. Size it with a text-* class. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.36em]", className)}>
      <LogoMark />
      <Wordmark />
    </span>
  );
}
