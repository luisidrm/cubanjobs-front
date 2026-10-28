"use client";

import { Check, Copy, ImageOff, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import {
  useApprovePaymentMutation,
  useGetAdminPaymentQuery,
  useRejectPaymentMutation,
} from "@/store/api/adminPaymentsApi";
import type { PaymentStatus } from "@/types/plan";

const STATUS_VARIANT: Record<PaymentStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-text-3">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}

/** One payment to check: amount, payer, transfer number, screenshot, the account's plan now, approve / reject. */
export function PaymentDetail({ id, onDone }: { id: string; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const { data: payment, isLoading, isError, refetch } = useGetAdminPaymentQuery(id);
  const [approve, { isLoading: approving }] = useApprovePaymentMutation();
  const [reject, { isLoading: rejecting }] = useRejectPaymentMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }
  if (isError || !payment) {
    return (
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
    );
  }

  const who = payment.companyName ?? payment.payerEmail;
  const pending = payment.status === "pending";

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(payment!.transferNumber);
      toast.success(t("adminPay.detail.copied"));
    } catch {
      toast.error(payment!.transferNumber);
    }
  }

  async function doApprove() {
    setConfirmOpen(false);
    try {
      await approve(id).unwrap();
      toast.success(t("adminPay.approvedToast"));
      onDone();
    } catch (err) {
      // e.g. 409: the company has a live card subscription, or it was already reviewed
      toast.error(getErrorMessage(err, t("plans.submitError")));
    }
  }

  async function doReject() {
    if (reason.trim().length < 3) {
      setReasonError(true);
      return;
    }
    try {
      await reject({ id, reason: reason.trim() }).unwrap();
      setRejectOpen(false);
      toast.success(t("adminPay.rejectedToast"));
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, t("plans.submitError")));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums">
              {payment.amountCup.toLocaleString()}
            </span>
            <span className="font-mono text-sm font-medium text-muted-foreground">CUP</span>
          </span>
          <Badge variant={STATUS_VARIANT[payment.status]}>
            <span className="size-1.5 rounded-full bg-current" />
            {t(`plans.status.${payment.status}`)}
          </Badge>
        </div>
        <Row label={t("adminPay.detail.payer")}>
          <span className="font-mono text-[13px] break-all">{payment.payerEmail}</span>
        </Row>
        {payment.companyName ? (
          <Row label={t("adminPay.detail.company")}>
            <span className="font-medium">{payment.companyName}</span>
          </Row>
        ) : null}
        <Row label={t("adminPay.detail.plan")}>
          <span className="font-medium">
            {payment.planName} · {t("plans.month", { count: payment.months })}
          </span>
        </Row>
        <Row label={t("adminPay.detail.sent")}>{fmtDate(payment.createdAt)}</Row>
        {payment.reviewedAt ? (
          <Row label={t("adminPay.detail.reviewed")}>{fmtDate(payment.reviewedAt)}</Row>
        ) : null}
        {payment.rejectReason ? (
          <p className="text-[13px] text-danger-text">
            {t("plans.rejectedReason", { reason: payment.rejectReason })}
          </p>
        ) : null}
      </Card>

      <Card className="flex-row items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
            {t("adminPay.detail.transfer")}
          </p>
          <p className="font-mono text-lg font-medium break-all select-all">
            {payment.transferNumber}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("adminPay.detail.copy")}
          onClick={() => void copyNumber()}
        >
          <Copy />
        </Button>
      </Card>

      <section className="flex flex-col gap-2">
        <p className="px-1 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
          {t("adminPay.detail.screenshot")}
        </p>
        {payment.screenshotUrl ? (
          <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payment.screenshotUrl}
              alt={t("adminPay.detail.screenshot")}
              className="max-h-[420px] w-full rounded-xl bg-fill-1 object-contain"
            />
          </a>
        ) : (
          <Card variant="grouped" className="flex-row items-center gap-2.5 p-4">
            <ImageOff className="size-[18px] text-text-3" />
            <p className="text-sm text-muted-foreground">{t("adminPay.detail.noScreenshot")}</p>
          </Card>
        )}
      </section>

      {payment.account ? (
        <Card className="gap-2">
          <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
            {t("adminPay.detail.account")}
          </p>
          <p className="font-semibold">{payment.account.label}</p>
          <Row label={t("adminPay.detail.plan")}>
            <span className="font-medium">{payment.account.plan}</span>
          </Row>
          <Row label={t("adminPay.detail.expiry")}>
            {payment.account.planExpiresAt
              ? fmtDate(payment.account.planExpiresAt)
              : t("adminPay.detail.none")}
          </Row>
          <Row label={t("adminPay.detail.source")}>
            {t(`adminPay.source.${payment.account.planSource}`)}
          </Row>
        </Card>
      ) : null}

      {pending ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => {
              setReason("");
              setReasonError(false);
              setRejectOpen(true);
            }}
          >
            <X />
            {t("adminPay.reject")}
          </Button>
          <Button size="lg" disabled={approving} onClick={() => setConfirmOpen(true)}>
            <Check />
            {t("adminPay.approve")}
          </Button>
        </div>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("adminPay.approveTitle")}</DialogTitle>
            <DialogDescription>
              {t("adminPay.approveMessage", {
                plan: payment.planName,
                months: t("plans.month", { count: payment.months }),
                who,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button onClick={doApprove}>{t("adminPay.approve")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminPay.rejectTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(false);
              }}
              placeholder={t("adminPay.reasonPlaceholder")}
              aria-invalid={reasonError}
              autoFocus
            />
            {reasonError ? (
              <p className="pl-1 text-xs text-danger-text">{t("adminPay.reasonRequired")}</p>
            ) : null}
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button variant="destructive" disabled={rejecting} onClick={doReject}>
              {t("adminPay.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
