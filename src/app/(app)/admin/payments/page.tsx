"use client";

import { Building2, CheckCheck, ImageIcon, User, WifiOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PaymentDetail } from "@/components/admin/payment-detail";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetAdminPaymentsQuery } from "@/store/api/adminPaymentsApi";
import type { PaymentStatus } from "@/types/plan";

/**
 * Payments review queue. Desktop: list on the left, a sticky detail panel on
 * the right. Small screens: the detail opens in a dialog.
 */
export default function AdminPaymentsPage() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdminPaymentsQuery(
    status,
    {
      pollingInterval: 60_000,
    },
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="px-1 text-3xl">{t("adminPay.tabs.payments")}</h1>

      <Segmented<PaymentStatus>
        className="max-w-md"
        value={status}
        onChange={(s) => {
          setStatus(s);
          setSelected(null);
        }}
        options={[
          {
            value: "pending",
            label: `${t("adminPay.filter.pending")}${data && status === "pending" && data.pending > 0 ? ` (${data.pending})` : ""}`,
          },
          { value: "approved", label: t("adminPay.filter.approved") },
          { value: "rejected", label: t("adminPay.filter.rejected") },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </>
          ) : null}

          {isError ? (
            <EmptyState
              icon={WifiOff}
              tone="danger"
              message={t("adminPay.loadError")}
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  {t("jobDetails.retry")}
                </Button>
              }
            />
          ) : null}

          {data && data.items.length === 0 && !isError ? (
            <EmptyState
              icon={CheckCheck}
              message={
                status === "pending"
                  ? t("adminPay.emptyPending")
                  : t("adminPay.emptyList")
              }
            />
          ) : null}

          {data?.items.map((p) => {
            const on = p.id === selected;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full min-w-0 flex-col gap-2.5 rounded-xl bg-card p-4 text-left shadow-sm transition-[transform,box-shadow] duration-200 ease-spring outline-none focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-[0.99]",
                  on
                    ? "ring-2 ring-primary"
                    : "ring-1 ring-separator hover:shadow-md",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
                    {p.audience === "employer" ? (
                      <Building2 className="size-5" />
                    ) : (
                      <User className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {p.companyName ?? p.payerEmail}
                    </span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {p.planName} · {t("plans.month", { count: p.months })}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums">
                      {p.amountCup.toLocaleString()}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      CUP
                    </span>
                  </span>
                </span>
                <span className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
                  <span className="truncate font-mono text-muted-foreground">
                    {p.transferNumber}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-text-3">
                    {p.hasScreenshot ? <ImageIcon className="size-4" /> : null}
                    {new Date(p.createdAt).toLocaleDateString(i18n.language, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: sticky glass detail panel. */}
        <aside className="hidden xl:sticky xl:top-24 xl:block">
          {selected ? (
            <PaymentDetail
              key={selected}
              id={selected}
              onDone={() => setSelected(null)}
            />
          ) : data && data.items.length > 0 ? (
            // Only hint at picking something when there is something to pick.
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border-1 p-6 text-center text-[15px] text-text-3">
              {t("adminPay.detail.pick")}
            </div>
          ) : null}
        </aside>
      </div>

      {/* Small screens: dialog. */}
      <div className="xl:hidden">
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("adminPay.detail.title")}</DialogTitle>
            </DialogHeader>
            {selected ? (
              <PaymentDetail
                key={selected}
                id={selected}
                onDone={() => setSelected(null)}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
