"use client";

import {
  Building2,
  Check,
  Copy,
  Hash,
  ImagePlus,
  Receipt,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BackButton, goBackOr } from "@/components/layout/back-button";
import { ActionBar } from "@/components/ui/action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusScreen } from "@/components/ui/status-screen";
import { getErrorMessage } from "@/lib/errors";
import {
  companyPlanExpiry,
  daysUntil,
  isEmployeePlanActive,
} from "@/lib/plan-status";
import { appendFilePart } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import {
  useGetMyPaymentsQuery,
  useGetPaymentDestinationQuery,
  useGetPlansQuery,
  useSubmitPaymentMutation,
} from "@/store/api/plansApi";
import { useGetMeQuery } from "@/store/api/usersApi";
import type { PaymentStatus } from "@/types/plan";

const STATUS_VARIANT: Record<
  PaymentStatus,
  "warning" | "success" | "destructive"
> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const fmtCup = (n: number) => n.toLocaleString();

/**
 * Pay for a plan with Transfermóvil: pick plan + duration, make the transfer,
 * report its number (required) and an optional screenshot. An admin checks it
 * and activates the plan; nothing here changes the plan by itself.
 */
export default function PlansPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: me } = useGetMeQuery();
  const isEmployer = me?.role === "employer";
  const audience = isEmployer ? "employer" : "employee";

  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useGetPlansQuery(audience, { skip: !me });
  const { data: companies } = useGetMyCompaniesQuery(undefined, {
    skip: !isEmployer,
  });
  const company = companies?.[0];
  const { data: dest } = useGetPaymentDestinationQuery(undefined, {
    skip: !me,
  });
  const { data: payments, refetch: refetchPayments } = useGetMyPaymentsQuery();
  const [submitPayment, { isLoading: submitting }] = useSubmitPaymentMutation();

  const [chosenCode, setChosenCode] = useState<string | null>(null);
  const [chosenMonths, setChosenMonths] = useState(1);
  const [transferNumber, setTransferNumber] = useState("");
  const [numberError, setNumberError] = useState(false);
  const [shot, setShot] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // The admin may approve while this tab is open in the background.
  useEffect(() => {
    const onFocus = () => void refetchPayments();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchPayments]);

  useEffect(() => {
    if (!shot) {
      setShotUrl(null);
      return;
    }
    const url = URL.createObjectURL(shot);
    setShotUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [shot]);

  const plan = useMemo(
    () => plans?.find((x) => x.code === chosenCode) ?? plans?.[0],
    [plans, chosenCode],
  );
  const months = plan?.prices.some((x) => x.months === chosenMonths)
    ? chosenMonths
    : (plan?.prices[0]?.months ?? 1);
  const price = plan?.prices.find((x) => x.months === months)?.priceCup ?? null;
  const hasPending = payments?.some((x) => x.status === "pending") ?? false;
  const lang = i18n.language?.startsWith("es") ? "es" : "en";

  const employeeActive = isEmployeePlanActive(me);
  const currentCode = isEmployer
    ? company && company.planTier !== "free"
      ? company.planTier
      : null
    : employeeActive
      ? "employee_paid"
      : null;
  const currentName = currentCode
    ? (plans?.find((x) => x.code === currentCode)?.name ?? currentCode)
    : null;
  const expiry = isEmployer
    ? companyPlanExpiry(company)
    : (me?.planExpiresAt ?? null);
  const expiryDays = daysUntil(expiry);
  const managedByCard =
    isEmployer &&
    company?.planSource === "stripe" &&
    company.planTier !== "free";
  const needsCompany = isEmployer && companies !== undefined && !company;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("plans.copied"));
    } catch {
      toast.error(value);
    }
  }

  async function handleSubmit() {
    if (!plan || price === null) return;
    if (transferNumber.trim().length < 4) {
      setNumberError(true);
      return;
    }
    if (isEmployer && !company) return;

    const form = new FormData();
    form.append("planCode", plan.code);
    form.append("months", String(months));
    form.append("transferNumber", transferNumber.trim());
    if (isEmployer && company) form.append("companyId", company.id);
    if (shot) appendFilePart(form, "screenshot", shot);

    try {
      await submitPayment(form).unwrap();
      setSent(true);
      setTransferNumber("");
      setShot(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t("plans.submitError")));
    }
  }

  if (sent) {
    return (
      <StatusScreen
        icon={Receipt}
        tone="success"
        title={t("plans.sentTitle")}
        message={t("plans.sentMessage")}
      >
        <Button size="lg" onClick={() => goBackOr(router, "/profile")}>
          {t("plans.done")}
        </Button>
      </StatusScreen>
    );
  }

  const showForm = plan && !needsCompany && !managedByCard;
  const instructions =
    lang === "es" ? dest?.instructionsEs : dest?.instructionsEn;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-44 sm:px-6">
      <BackButton fallback="/profile" />
      <h1 className="px-1 text-3xl sm:text-4xl">{t("plans.title")}</h1>

      {/* Current plan */}
      <Card className="gap-1.5">
        <CardLabel>{t("plans.current")}</CardLabel>
        <div className="flex items-center justify-between gap-3">
          <p className="text-2xl font-bold tracking-tight">
            {currentName ?? t("plans.free")}
          </p>
          {currentName ? (
            <Badge variant="success">
              <span className="size-1.5 rounded-full bg-current" />
              {t("plans.paid")}
            </Badge>
          ) : (
            <Badge variant="ghost">{t("plans.free")}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {currentName
            ? managedByCard
              ? t("plans.cardPlan")
              : expiry
                ? expiryDays !== null && expiryDays >= 0 && expiryDays <= 7
                  ? t("plans.expiresIn", { count: expiryDays })
                  : t("plans.activeUntil", {
                      date: new Date(expiry).toLocaleDateString(i18n.language, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })
                : t("plans.noExpiry")
            : isEmployer
              ? t("plans.freeEmployerHint")
              : t("plans.freeEmployeeHint")}
        </p>
      </Card>

      {hasPending ? (
        <Card variant="grouped" className="flex-row items-center gap-3 p-4">
          <Sparkles className="size-5 shrink-0 text-accent-text" />
          <p className="text-sm">{t("plans.pendingBanner")}</p>
        </Card>
      ) : null}

      {plansLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : null}

      {plansError ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("plans.loadError")}
          action={
            <Button variant="secondary" onClick={() => refetchPlans()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {needsCompany ? (
        <EmptyState
          icon={Building2}
          message={t("plans.needCompany")}
          action={
            <Button nativeButton={false} render={<Link href="/onboarding" />}>
              {t("plans.createCompany")}
            </Button>
          }
        />
      ) : null}

      {showForm ? (
        <>
          {/* Plan + duration */}
          <section className="flex flex-col gap-3">
            <CardLabel className="px-1">{t("plans.choosePlan")}</CardLabel>
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              {(plans ?? []).map((pl) => {
                const on = pl.code === plan.code;
                const first = pl.prices[0];
                return (
                  // biome-ignore lint/a11y/useSemanticElements: a card-style radio; a native input cannot hold this layout
                  <button
                    key={pl.code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChosenCode(pl.code)}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl bg-card p-4 text-left shadow-sm transition-[transform,box-shadow] duration-200 ease-spring outline-none focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-[0.98]",
                      on ? "ring-2 ring-primary" : "ring-1 ring-separator",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold tracking-tight">
                        {pl.name}
                      </span>
                      {first ? (
                        <span className="text-sm font-semibold tabular-nums">
                          {fmtCup(first.priceCup / first.months)}{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            {t("plans.perMonthShort")}
                          </span>
                        </span>
                      ) : null}
                    </span>
                    {pl.audience === "employer" ? (
                      <ul className="flex flex-col gap-1">
                        {[
                          pl.jobLimit === null
                            ? t("plans.jobsUnlimited")
                            : t("plans.jobLimit", { count: pl.jobLimit }),
                          pl.candidateSearch
                            ? t("plans.candidateSearch")
                            : null,
                        ]
                          .filter(Boolean)
                          .map((line) => (
                            <li
                              key={line}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <Check className="size-4 text-success" />
                              {line}
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("plans.duration")}</Label>
              <Segmented<string>
                value={String(months)}
                onChange={(v) => setChosenMonths(Number(v))}
                options={plan.prices.map((x) => ({
                  value: String(x.months),
                  label: t("plans.month", { count: x.months }),
                }))}
              />
            </div>

            <div className="flex items-baseline justify-between px-1">
              <span className="text-sm text-muted-foreground">
                {t("plans.total")}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums">
                  {price !== null ? fmtCup(price) : "—"}
                </span>
                <span className="font-mono text-sm font-medium text-muted-foreground">
                  CUP
                </span>
              </span>
            </div>
          </section>

          {/* How to pay */}
          <section className="flex flex-col gap-3">
            <CardLabel className="px-1">{t("plans.howToPay")}</CardLabel>
            <Card className="gap-4">
              <p className="text-sm text-muted-foreground">
                {t("plans.stepSend")}
              </p>
              {(
                [
                  ["card", t("plans.card"), dest?.card],
                  ["phone", t("plans.phone"), dest?.phone],
                  ["holder", t("plans.holder"), dest?.holder],
                ] as const
              ).map(([key, label, value]) =>
                value ? (
                  <div key={key} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-3">{label}</p>
                      <p
                        className={cn(
                          "truncate text-base font-medium select-all",
                          key !== "holder" && "font-mono",
                        )}
                      >
                        {value}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={`${t("plans.copy")} ${label}`}
                      onClick={() => void copy(value)}
                    >
                      <Copy />
                    </Button>
                  </div>
                ) : null,
              )}
              {instructions ? (
                <p className="text-[13px] text-text-3">{instructions}</p>
              ) : null}
            </Card>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-number">
                {t("plans.transferNumber")}
              </Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-text-3" />
                <Input
                  id="transfer-number"
                  value={transferNumber}
                  onChange={(e) => {
                    setTransferNumber(e.target.value);
                    if (numberError) setNumberError(false);
                  }}
                  placeholder={t("plans.transferNumberPlaceholder")}
                  autoCapitalize="characters"
                  autoComplete="off"
                  aria-invalid={numberError}
                  className="pl-10 font-mono"
                />
              </div>
              <p
                className={cn(
                  "pl-1 text-xs",
                  numberError ? "text-danger-text" : "text-text-3",
                )}
              >
                {numberError
                  ? t("plans.transferNumberRequired")
                  : t("plans.transferNumberHint")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("plans.screenshot")}</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setShot(e.target.files?.[0] ?? null)}
              />
              {shot && shotUrl ? (
                <Card className="flex-row items-center gap-3 p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shotUrl}
                    alt=""
                    className="size-16 rounded-[10px] object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {shot.name}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("plans.removeScreenshot")}
                    onClick={() => {
                      setShot(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X />
                  </Button>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus />
                  {t("plans.addScreenshot")}
                </Button>
              )}
            </div>
          </section>
        </>
      ) : null}

      {/* History */}
      <section className="flex flex-col gap-3">
        <CardLabel className="px-1">{t("plans.history")}</CardLabel>
        {payments && payments.length === 0 ? (
          <p className="px-1 text-sm text-text-3">{t("plans.historyEmpty")}</p>
        ) : null}
        {payments?.map((pay) => (
          <Card key={pay.id} className="gap-1.5 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                {pay.planName} · {t("plans.month", { count: pay.months })}
              </span>
              <Badge variant={STATUS_VARIANT[pay.status]}>
                <span className="size-1.5 rounded-full bg-current" />
                {t(`plans.status.${pay.status}`)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-mono text-[13px] text-muted-foreground">
                {pay.transferNumber}
              </span>
              <span className="tabular-nums">{fmtCup(pay.amountCup)} CUP</span>
            </div>
            <span className="text-[13px] text-text-3">
              {new Date(pay.createdAt).toLocaleDateString(i18n.language, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {pay.status === "rejected" && pay.rejectReason ? (
              <span className="text-[13px] text-danger-text">
                {t("plans.rejectedReason", { reason: pay.rejectReason })}
              </span>
            ) : null}
          </Card>
        ))}
      </section>

      {showForm ? (
        <ActionBar>
          <Button
            size="lg"
            className="w-full"
            disabled={price === null || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? t("plans.sending")
              : t("plans.submit", {
                  amount: price !== null ? fmtCup(price) : "—",
                })}
          </Button>
        </ActionBar>
      ) : null}
    </div>
  );
}

function CardLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.06em] text-text-3 uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
