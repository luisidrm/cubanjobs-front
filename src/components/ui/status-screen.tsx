import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-success-soft text-success-text",
  danger: "bg-danger-soft text-danger-text",
  accent: "bg-accent-soft text-accent-text",
} as const;

/**
 * Outcome screen (forgot success, reset success/invalid, verify email): 80px
 * tone tile, title, message, then the primary and secondary actions.
 */
export function StatusScreen({
  icon: Icon,
  spinner,
  tone = "accent",
  title,
  message,
  children,
}: {
  icon?: LucideIcon;
  spinner?: boolean;
  tone?: keyof typeof TONES;
  title?: string;
  message: string;
  /** Actions (Buttons), rendered full width under the copy. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <div
        className={cn(
          "grid size-20 place-items-center rounded-3xl",
          TONES[tone],
        )}
      >
        {spinner ? (
          <Loader2 className="size-9 animate-spin" />
        ) : Icon ? (
          <Icon className="size-[38px]" />
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {title ? (
          <h1 className="text-balance text-3xl leading-tight">{title}</h1>
        ) : null}
        <p className="text-base text-muted-foreground">{message}</p>
      </div>
      {children ? (
        <div className="flex w-full flex-col gap-2">{children}</div>
      ) : null}
    </div>
  );
}
