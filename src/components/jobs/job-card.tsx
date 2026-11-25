"use client";

import { BadgeCheck, Bookmark, BookmarkCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/job";

function formatSalary(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

/** Job card: initial tile, title + company, bookmark; salary + currency (mono), location, Remote badge. */
export function JobCard({
  job,
  href,
  isSaved,
  onToggleSave,
}: {
  job: Job;
  href: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
}) {
  const { t } = useTranslation();
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <article className="group/job relative flex flex-col gap-3.5 overflow-hidden rounded-xl bg-card pb-4 shadow-sm ring-1 ring-separator transition-[transform,box-shadow] duration-200 ease-spring hover:shadow-md active:scale-[0.99]">
      {job.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={job.coverImageUrl}
          alt=""
          className="h-36 w-full bg-fill-2 object-cover"
        />
      ) : null}
      <div
        className={cn(
          "flex items-center gap-3 px-4",
          !job.coverImageUrl && "pt-4",
        )}
      >
        <CompanyLogo name={job.company?.name} logoUrl={job.company?.logoUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base leading-tight font-semibold tracking-normal">
            {/* The stretched link makes the whole card the hit target. */}
            <Link
              href={href}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-4 focus-visible:after:ring-ring/45"
            >
              {job.title}
            </Link>
          </h3>
          <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            <span className="truncate">{job.company?.name ?? ""}</span>
            {job.company?.isVerified ? (
              <BadgeCheck
                className="size-4 shrink-0 text-primary"
                aria-label={t("explore.verifiedCompany")}
              />
            ) : null}
          </p>
        </div>
        {onToggleSave ? (
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={isSaved ? "Unsave" : "Save"}
            aria-pressed={!!isSaved}
            className={cn(
              "relative z-10 grid size-11 shrink-0 place-items-center rounded-full outline-none transition-[background-color,transform] duration-200 ease-spring focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-90",
              isSaved
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-fill-1",
            )}
          >
            {isSaved ? (
              <BookmarkCheck className="size-5" />
            ) : (
              <Bookmark className="size-5" />
            )}
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 px-4">
        {salary ? (
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tabular-nums">{salary}</span>
            {job.currency ? (
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                {job.currency}
              </span>
            ) : null}
          </div>
        ) : (
          <span />
        )}
        <div className="flex min-w-0 items-center gap-2">
          {job.location ? (
            <span className="flex min-w-0 items-center gap-1 text-[13px] text-text-3">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{job.location}</span>
            </span>
          ) : null}
          {job.isRemote ? <Badge>{t("explore.remote")}</Badge> : null}
        </div>
      </div>
    </article>
  );
}
