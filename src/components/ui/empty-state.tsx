import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Empty / error block: 64px tone tile, message, optional action (pass a Button). */
export function EmptyState({
  icon: Icon,
  tone = "accent",
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  tone?: "accent" | "danger";
  message: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3.5 px-6 py-12 text-center",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-16 place-items-center rounded-[20px]",
          tone === "danger"
            ? "bg-danger-soft text-danger-text"
            : "bg-accent-soft text-accent-text",
        )}
      >
        <Icon className="size-7" />
      </div>
      <p className="max-w-xs text-[15px] leading-snug text-muted-foreground">
        {message}
      </p>
      {action}
    </div>
  );
}
