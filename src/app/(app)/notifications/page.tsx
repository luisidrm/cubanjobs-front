"use client";

import { Bell, BellOff, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/store/api/notificationsApi";
import type { Notification } from "@/types/notification";

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery({ limit: 50 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] =
    useMarkAllNotificationsReadMutation();

  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  function open(n: Notification) {
    if (!n.read) void markRead(n.id);
    // Application updates open the job; plan and payment notices open the plan page.
    if (n.data?.jobId) router.push(`/jobs/${n.data.jobId}`);
    else if (n.type.startsWith("plan_") || n.type.startsWith("payment_"))
      router.push("/plans");
    else if (n.type === "team_member_joined") router.push("/team");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl">{t("notifications.title")}</h1>
        {hasUnread ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={markingAll}
            onClick={() => markAll()}
          >
            {t("notifications.markAllRead")}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("notifications.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && notifications?.length === 0 ? (
        <EmptyState icon={BellOff} message={t("notifications.empty")} />
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {notifications?.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl p-4 text-left ring-1 ring-separator transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/45",
                n.read ? "bg-card hover:bg-fill-1" : "bg-accent-soft",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-[10px]",
                  n.read
                    ? "bg-fill-1 text-muted-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <Bell className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{n.title}</span>
                <span className="block text-[15px] text-muted-foreground">
                  {n.body}
                </span>
                <span className="mt-1.5 block text-xs text-text-3">
                  {new Date(n.createdAt).toLocaleDateString(i18n.language, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
