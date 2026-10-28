import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline non-field error above a form: danger-soft fill, no accent border. */
export function DangerBanner({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger-text",
        className,
      )}
    >
      <CircleAlert className="mt-px size-[18px] shrink-0" />
      <span>{message}</span>
    </div>
  );
}
