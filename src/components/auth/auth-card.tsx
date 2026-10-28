import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/wordmark";

interface AuthCardProps {
  /** 56px accent-soft tile above the title (forgot / reset). */
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Shared centered shell for the five auth screens — mirrors mobile's consistent layout. */
export function AuthCard({ icon: Icon, title, subtitle, children }: AuthCardProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <Logo className="text-4xl" />
      {Icon ? (
        <div className="grid size-14 place-items-center rounded-[17px] bg-accent-soft text-accent-text">
          <Icon className="size-[26px]" />
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-3xl">{title}</h1>
        {subtitle ? (
          <p className="text-base text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-4">{children}</div>
    </div>
  );
}
