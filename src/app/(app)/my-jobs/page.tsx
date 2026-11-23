"use client";

import { Building2, Eye, Pencil, Plus, Users, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { JoinCompanyForm } from "@/components/employer/join-company-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlanJobLimit } from "@/lib/plans";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import { useGetJobsByCompanyQuery } from "@/store/api/jobsApi";
import type { JobStatus } from "@/types/job";

const STATUS_VARIANT: Record<
  JobStatus,
  "ghost" | "success" | "destructive" | "warning"
> = {
  draft: "ghost",
  active: "success",
  closed: "destructive",
  expired: "warning",
};

export default function MyJobsPage() {
  const { t, i18n } = useTranslation();
  const [limitOpen, setLimitOpen] = useState(false);

  const { data: companies, isLoading: companiesLoading } =
    useGetMyCompaniesQuery();
  const company = companies?.[0];
  const {
    data: jobs,
    isLoading: jobsLoading,
    isError,
    refetch,
  } = useGetJobsByCompanyQuery(company?.id ?? "", { skip: !company });

  const activeCount = jobs?.filter((j) => j.status === "active").length ?? 0;
  const limit = company ? getPlanJobLimit(company.planTier) : null;
  const atLimit = limit !== null && activeCount >= limit;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-4xl">{t("tabs.myJobs")}</h1>
          {company ? (
            <p className="text-[15px] text-muted-foreground">
              {limit === null
                ? t("employer.activeUnlimited", { active: activeCount })
                : t("employer.activeOf", { active: activeCount, limit })}
            </p>
          ) : null}
        </div>
        {company ? (
          atLimit ? (
            <Button onClick={() => setLimitOpen(true)}>
              <Plus />
              {t("myJobs.postJob")}
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/my-jobs/new" />}>
              <Plus />
              {t("myJobs.postJob")}
            </Button>
          )
        ) : null}
      </div>

      {companiesLoading ? <Skeleton className="h-28 rounded-xl" /> : null}

      {!companiesLoading && !company ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            icon={Building2}
            message={`${t("myJobs.noCompanyTitle")}. ${t("myJobs.noCompanySubtitle")}`}
            action={
              <Button nativeButton={false} render={<Link href="/company" />}>
                {t("myJobs.createCompany")}
              </Button>
            }
          />
          <p className="text-center text-[13px] text-text-3">
            {t("employer.noCompanyJoin")}
          </p>
          <JoinCompanyForm />
        </div>
      ) : null}

      {company && jobsLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : null}

      {company && isError && !jobsLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("explore.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {company && !jobsLoading && !isError && jobs?.length === 0 ? (
        <EmptyState
          icon={Building2}
          message={t("myJobs.noJobs")}
          action={
            <Button nativeButton={false} render={<Link href="/my-jobs/new" />}>
              {t("myJobs.postJob")}
            </Button>
          }
        />
      ) : null}

      <ul className="flex flex-col gap-3">
        {jobs?.map((job) => (
          <li
            key={job.id}
            className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-separator"
          >
            <div className="flex items-start gap-3">
              {job.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.coverImageUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-xl bg-fill-2 object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold">
                  {job.title}
                </h2>
                <p className="flex items-center gap-3 text-[13px] text-text-3">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    <span className="tabular-nums">{job.viewCount}</span>
                  </span>
                  <span>
                    {t("employer.posted", {
                      date: new Date(job.createdAt).toLocaleDateString(
                        i18n.language,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      ),
                    })}
                  </span>
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[job.status]}>
                {t(`jobStatus.${job.status}`)}
              </Badge>
            </div>
            <div className="flex gap-2 border-t border-separator pt-3">
              <Button
                variant="secondary"
                size="sm"
                nativeButton={false}
                render={<Link href={`/my-jobs/${job.id}/applicants`} />}
              >
                <Users />
                {t("employer.applicants")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/my-jobs/${job.id}`} />}
              >
                <Pencil />
                {t("employer.edit")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("myJobs.limitReachedTitle")}</DialogTitle>
            <DialogDescription>
              {t("myJobs.limitReachedMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setLimitOpen(false)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button nativeButton={false} render={<Link href="/billing" />}>
              {t("myJobs.upgrade")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
