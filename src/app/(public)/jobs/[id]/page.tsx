"use client";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Globe,
  MapPin,
  Send,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { GuestDialog } from "@/components/jobs/guest-dialog";
import { ActionBar } from "@/components/ui/action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { isEmployeePlanActive } from "@/lib/plan-status";
import { useSession } from "@/lib/session";
import {
  useApplyToJobMutation,
  useGetMyApplicationsQuery,
} from "@/store/api/applicationsApi";
import { useGetJobByIdQuery } from "@/store/api/jobsApi";
import { useGetMeQuery } from "@/store/api/usersApi";
import {
  useGetMySavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from "@/store/api/savedJobsApi";

function salaryRange(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

export default function JobDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { status } = useSession();
  const guest = status !== "authenticated";

  const { data: job, isLoading, isError, refetch } = useGetJobByIdQuery(id);
  const { data: myApplications } = useGetMyApplicationsQuery(undefined, {
    skip: guest,
  });
  const { data: saved } = useGetMySavedJobsQuery(undefined, { skip: guest });
  const [applyToJob, { isLoading: applying }] = useApplyToJobMutation();
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { data: me } = useGetMeQuery(undefined, { skip: guest });

  const hasApplied = myApplications?.some(
    (a) => a.job.id === id && a.status !== "withdrawn",
  );
  const isSaved = saved?.some((s) => s.jobId === id) ?? false;

  function handleSave() {
    if (guest) return setGuestOpen(true);
    void (isSaved ? unsaveJob(id) : saveJob(id));
  }

  function handleApply() {
    if (guest) return setGuestOpen(true);
    // Employees apply only with an active plan. Checked first so the pay page
    // opens before they confirm anything; the API enforces it too (402).
    if (me?.role === "employee" && !isEmployeePlanActive(me)) return setPaywallOpen(true);
    setConfirmOpen(true);
  }

  async function doApply() {
    setConfirmOpen(false);
    try {
      await applyToJob({ jobId: id }).unwrap();
      toast.success(t("jobDetails.applySuccessMessage"));
    } catch (err) {
      if ((err as { status?: number })?.status === 402) {
        setPaywallOpen(true);
        return;
      }
      toast.error(t("jobDetails.applyError"));
    }
  }

  const salary = job ? salaryRange(job.salaryMin, job.salaryMax) : null;
  const posted = job
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000),
      )
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-40 sm:px-6">
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
        <Button
          variant={isSaved ? "default" : "glass"}
          size="icon"
          aria-label={isSaved ? "Unsave" : "Save"}
          aria-pressed={isSaved}
          onClick={handleSave}
        >
          {isSaved ? <BookmarkCheck /> : <Bookmark />}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-11/12" />
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("jobDetails.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {job ? (
        <>
          {job.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.coverImageUrl}
              alt=""
              className="aspect-video w-full rounded-2xl bg-fill-2 object-cover"
            />
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge variant="success">
                <span className="size-1.5 rounded-full bg-current" />
                {t("jobDetails.active")}
              </Badge>
              <span className="flex items-center gap-1.5 text-[13px] text-text-3">
                <Clock className="size-3.5" />
                {posted === 0
                  ? t("jobDetails.postedToday")
                  : t("jobDetails.postedDaysAgo", { count: posted })}
              </span>
            </div>
            <h1 className="text-balance text-4xl leading-[1.1]">{job.title}</h1>
            {job.company?.name ? (
              <Link
                href={`/companies/${job.company.id}`}
                className="inline-flex min-h-11 items-center gap-2.5 text-[17px] font-semibold text-accent-text"
              >
                <CompanyLogo
                  name={job.company.name}
                  logoUrl={job.company.logoUrl}
                  className="size-8 rounded-lg text-sm"
                />
                {job.company.name}
              </Link>
            ) : null}
          </div>

          <Card className="gap-0 py-0">
            <div className="flex flex-col gap-1 p-4">
              <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                {t("jobDetails.salary")}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  {salary ?? t("jobDetails.salaryNotDisclosed")}
                </span>
                {salary && job.currency ? (
                  <span className="font-mono text-sm text-muted-foreground">
                    {t("jobDetails.perMonth", { currency: job.currency })}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="h-px bg-separator" />
            <div className="grid grid-cols-2 divide-x divide-separator">
              <div className="flex flex-col gap-1 p-4">
                <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                  {t("jobDetails.jobType")}
                </p>
                <p className="font-semibold">
                  {job.jobType ? t(`jobType.${job.jobType}`) : "—"}
                </p>
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                  {t("jobDetails.location")}
                </p>
                <p className="flex items-center gap-1.5 font-semibold">
                  {job.isRemote ? (
                    <Globe className="size-3.5 text-primary" />
                  ) : (
                    <MapPin className="size-3.5 text-primary" />
                  )}
                  {job.isRemote ? t("jobDetails.remote") : (job.location ?? "—")}
                </p>
              </div>
            </div>
          </Card>

          <section className="flex flex-col gap-2.5">
            <h2 className="text-2xl">{t("jobDetails.aboutRole")}</h2>
            <p className="whitespace-pre-line text-base text-muted-foreground">
              {job.description}
            </p>
          </section>

          <ActionBar>
            <Button
              size="lg"
              className="w-full"
              disabled={!!hasApplied || applying}
              onClick={handleApply}
            >
              {hasApplied ? <Check /> : <Send />}
              {hasApplied
                ? t("jobDetails.alreadyApplied")
                : t("jobDetails.applyNow")}
            </Button>
          </ActionBar>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent showCloseButton={false} className="text-center">
              <DialogHeader className="items-center">
                <DialogTitle>{t("jobDetails.confirmApplyTitle")}</DialogTitle>
                <DialogDescription>
                  {t("jobDetails.confirmApplyMessage")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  {t("jobDetails.cancel")}
                </Button>
                <Button onClick={doApply}>{t("jobDetails.confirm")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={paywallOpen} onOpenChange={setPaywallOpen}>
            <DialogContent showCloseButton={false} className="text-center">
              <DialogHeader className="items-center">
                <DialogTitle>{t("plans.paywallTitle")}</DialogTitle>
                <DialogDescription>{t("plans.paywallMessage")}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
                <Button variant="outline" onClick={() => setPaywallOpen(false)}>
                  {t("jobDetails.cancel")}
                </Button>
                <Button nativeButton={false} render={<Link href="/plans" />}>
                  {t("plans.viewPlan")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <GuestDialog open={guestOpen} onOpenChange={setGuestOpen} />
        </>
      ) : null}
    </div>
  );
}
