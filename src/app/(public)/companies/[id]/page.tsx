"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ExternalLink,
  MapPin,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { JobCard } from "@/components/jobs/job-card";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareButton } from "@/components/ui/share-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCompanyByIdQuery } from "@/store/api/companiesApi";
import { useSearchJobsQuery } from "@/store/api/jobsApi";

export default function CompanyPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const {
    data: company,
    isLoading,
    isError,
    refetch,
  } = useGetCompanyByIdQuery(id);
  const { data: openJobs, isLoading: jobsLoading } = useSearchJobsQuery({
    companyId: id,
    limit: 50,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6">
      <div className="flex items-center justify-between">
        <Button
          variant="glass"
          size="icon"
          aria-label={t("common.back")}
          nativeButton={false}
          render={<Link href="/jobs" />}
        >
          <ArrowLeft />
        </Button>
        {company ? (
          <div className="flex items-center gap-2">
            <ShareButton
              title={company.name}
              text={t("share.company", { company: company.name })}
            />
            <ReportButton targetType="company" targetId={company.id} />
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-[84px] rounded-3xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("companyView.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {company ? (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="grid size-[84px] place-items-center overflow-hidden rounded-3xl bg-accent-soft text-primary">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-8" />
              )}
            </div>
            <h1 className="flex items-center gap-2 text-3xl">
              {company.name}
              {company.isVerified ? (
                <BadgeCheck
                  className="size-6 text-primary"
                  aria-label={t("explore.verifiedCompany")}
                />
              ) : null}
            </h1>
            {company.location ? (
              <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
                <MapPin className="size-3.5" />
                {company.location}
              </p>
            ) : null}
          </div>

          {company.description ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl">{t("companyView.about")}</h2>
              <p className="whitespace-pre-line text-base text-muted-foreground">
                {company.description}
              </p>
            </section>
          ) : null}

          <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-separator">
            {company.website ? (
              <li className="border-b border-separator last:border-b-0">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-13 items-center justify-between gap-3 px-4 py-2 font-medium transition-colors hover:bg-fill-1"
                >
                  <span className="truncate text-accent-text">
                    {company.website}
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-text-3" />
                </a>
              </li>
            ) : null}
            {company.industry ? (
              <li className="flex min-h-13 items-center justify-between gap-3 border-b border-separator px-4 py-2 last:border-b-0">
                <span className="font-medium">{t("companyView.industry")}</span>
                <span className="text-muted-foreground">
                  {company.industry}
                </span>
              </li>
            ) : null}
            {company.employeeCount ? (
              <li className="flex min-h-13 items-center justify-between gap-3 px-4 py-2">
                <span className="font-medium">{t("companyView.size")}</span>
                <span className="text-muted-foreground tabular-nums">
                  {company.employeeCount}
                </span>
              </li>
            ) : null}
          </ul>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl">{t("companyView.openJobsTitle")}</h2>
            {jobsLoading ? <Skeleton className="h-32 rounded-xl" /> : null}
            {!jobsLoading && (openJobs?.length ?? 0) === 0 ? (
              <p className="text-[15px] text-muted-foreground">
                {t("companyView.noOpenJobs")}
              </p>
            ) : null}
            {openJobs?.map((job) => (
              <JobCard key={job.id} job={job} href={`/jobs/${job.id}`} />
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
