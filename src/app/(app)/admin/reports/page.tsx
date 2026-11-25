"use client";

import {
  Briefcase,
  Building2,
  CheckCheck,
  Flag,
  User,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetAdminReportsQuery,
  useResolveReportMutation,
} from "@/store/api/reportsApi";
import type {
  AdminReportRow,
  ReportStatus,
  ReportTargetType,
} from "@/types/report";

const TARGET_ICON: Record<ReportTargetType, typeof Briefcase> = {
  job: Briefcase,
  freelancer_post: User,
  company: Building2,
};

/** Report queue: newest first, with dismiss / mark as handled / take the item down. */
export default function AdminReportsPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<ReportStatus>("open");
  const [confirming, setConfirming] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useGetAdminReportsQuery(
    status,
    { pollingInterval: 60_000 },
  );
  const [resolve, { isLoading: resolving }] = useResolveReportMutation();

  async function act(
    row: AdminReportRow,
    next: "dismissed" | "actioned",
    takedown: boolean,
  ) {
    try {
      await resolve({ id: row.id, status: next, takedown }).unwrap();
      toast.success(t("adminReports.resolved"));
      setConfirming(null);
    } catch {
      toast.error(t("adminReports.resolveError"));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="px-1 text-3xl">{t("adminReports.title")}</h1>

      <Segmented<ReportStatus>
        className="max-w-md"
        value={status}
        onChange={(s) => {
          setStatus(s);
          setConfirming(null);
        }}
        options={[
          { value: "open", label: t("adminReports.filter.open") },
          { value: "actioned", label: t("adminReports.filter.actioned") },
          { value: "dismissed", label: t("adminReports.filter.dismissed") },
        ]}
      />

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : null}

        {isError ? (
          <EmptyState
            icon={WifiOff}
            tone="danger"
            message={t("adminReports.loadError")}
            action={
              <Button variant="secondary" onClick={() => refetch()}>
                {t("jobDetails.retry")}
              </Button>
            }
          />
        ) : null}

        {data && data.length === 0 && !isError ? (
          <EmptyState
            icon={CheckCheck}
            message={
              status === "open"
                ? t("adminReports.emptyOpen")
                : t("adminReports.empty")
            }
          />
        ) : null}

        {data?.map((r) => {
          const Icon = TARGET_ICON[r.targetType];
          const canTakeDown =
            r.status === "open" &&
            r.target.exists &&
            r.targetType !== "company";
          return (
            <article
              key={r.id}
              className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-separator"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.target.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {t(`adminReports.target.${r.targetType}`)}
                    {r.target.extra ? ` · ${r.target.extra}` : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    r.status === "open"
                      ? "warning"
                      : r.status === "actioned"
                        ? "success"
                        : "ghost"
                  }
                >
                  <Flag />
                  {t(`report.reasons.${r.reason}`)}
                </Badge>
              </div>

              {r.note ? (
                <p className="rounded-lg bg-fill-1 px-3 py-2 text-sm whitespace-pre-line">
                  {r.note}
                </p>
              ) : null}

              <p className="text-[13px] text-text-3">
                {r.reporterEmail
                  ? t("adminReports.reportedBy", { email: r.reporterEmail })
                  : t("adminReports.system")}{" "}
                ·{" "}
                {new Date(r.createdAt).toLocaleDateString(i18n.language, {
                  day: "numeric",
                  month: "short",
                })}
              </p>

              {r.status === "open" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolving}
                    onClick={() => act(r, "dismissed", false)}
                  >
                    {t("adminReports.dismiss")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={resolving}
                    onClick={() => act(r, "actioned", false)}
                  >
                    {t("adminReports.handled")}
                  </Button>
                  {canTakeDown ? (
                    confirming === r.id ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={resolving}
                        onClick={() => act(r, "actioned", true)}
                      >
                        {t("adminReports.confirmTakedown")}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={resolving}
                        onClick={() => setConfirming(r.id)}
                      >
                        {r.targetType === "job"
                          ? t("adminReports.closeJob")
                          : t("adminReports.deletePost")}
                      </Button>
                    )
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
