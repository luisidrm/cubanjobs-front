import { cn } from "@/lib/utils";

/** Company logo tile; falls back to the company's initial on the accent tint. */
export function CompanyLogo({
  name,
  logoUrl,
  className,
}: {
  name: string | null | undefined;
  logoUrl: string | null | undefined;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent-soft text-lg font-bold text-accent-text",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-full object-cover" />
      ) : (
        (name ?? "?").charAt(0).toUpperCase()
      )}
    </div>
  );
}
