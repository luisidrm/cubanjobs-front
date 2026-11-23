"use client";

import { Bookmark, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { JobCard } from "@/components/jobs/job-card";
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
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import {
  useGetMyApplicationsQuery,
  useWithdrawApplicationMutation,
} from "@/store/api/applicationsApi";
import {
  useGetMySavedJobsQuery,
  useUnsaveJobMutation,
} from "@/store/api/savedJobsApi";
import type { ApplicationStatus } from "@/types/application";

type Tab = "applications" | "saved";

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "ghost" | "info" | "success" | "destructive"
> = {
  pending: "ghost",
  reviewed: "info",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "ghost",
};

export default function ActivityPage() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("applications");
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const { data: applications, isLoading: appsLoading } =
    useGetMyApplicationsQuery();
  const { data: saved, isLoading: savedLoading } = useGetMySavedJobsQuery();
  const [withdraw, { isLoading: withdrawing }] =
    useWithdrawApplicationMutation();
  const [unsave] = useUnsaveJobMutation();

  async function confirmWithdraw() {
    if (!withdrawId) return;
    const id = withdrawId;
    setWithdrawId(null);
    try {
      await withdraw(id).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("jobDetails.applyError")));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-4xl">{t("tabs.activity")}</h1>

      <Segmented<Tab>
        aria-label={t("tabs.activity")}
        options={[
          { value: "applications", label: t("activity.tabApplications") },
          { value: "saved", label: t("activity.tabSaved") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "applications" ? (
        appsLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : applications?.length ? (
          <ul className="flex flex-col gap-3">
            {applications.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-separator"
              >
                <div className="flex items-center gap-3">
                  <CompanyLogo name={a.job.company.name} logoUrl={null} />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${a.job.id}`}
                      className="block truncate font-semibold hover:underline"
                    >
                      {a.job.title}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {a.job.company.name}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[a.status]}>
                    {t(`applicationStatus.${a.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-separator pt-3">
                  <span className="text-[13px] text-text-3">
                    {t("activity.appliedOn", {
                      date: new Date(a.createdAt).toLocaleDateString(
                        i18n.language,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      ),
                    })}
                  </span>
                  {a.status === "pending" || a.status === "reviewed" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWithdrawId(a.id)}
                    >
                      {t("activity.withdraw")}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={ListChecks}
            message={t("activity.emptyApplications")}
            action={
              <Button nativeButton={false} render={<Link href="/jobs" />}>
                {t("activity.exploreJobs")}
              </Button>
            }
          />
        )
      ) : savedLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : saved?.length ? (
        <div className="flex flex-col gap-3">
          {saved.map((s) => (
            <JobCard
              key={s.jobId}
              href={`/jobs/${s.job.id}`}
              isSaved
              onToggleSave={() => unsave(s.jobId)}
              job={{
                id: s.job.id,
                title: s.job.title,
                description: "",
                salaryMin: s.job.salaryMin,
                salaryMax: s.job.salaryMax,
                currency: s.job.currency,
                location: s.job.location,
                jobType: null,
                isRemote: s.job.isRemote,
                viewCount: 0,
                coverImageUrl: s.job.coverImageUrl,
                createdAt: s.savedAt,
                company: s.job.company,
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          message={t("activity.emptySaved")}
          action={
            <Button nativeButton={false} render={<Link href="/jobs" />}>
              {t("activity.exploreJobs")}
            </Button>
          }
        />
      )}

      <Dialog
        open={withdrawId !== null}
        onOpenChange={(o) => !o && setWithdrawId(null)}
      >
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("activity.confirmWithdrawTitle")}</DialogTitle>
            <DialogDescription>
              {t("activity.confirmWithdrawMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setWithdrawId(null)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={withdrawing}
              onClick={confirmWithdraw}
            >
              {t("activity.withdraw")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
