"use client";

import {
  CalendarClock,
  ChevronRight,
  CreditCard,
  Tags,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AdminMetricsPanel } from "@/components/admin/metrics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetAdminPaymentsQuery,
  useGetExpiringAccountsQuery,
} from "@/store/api/adminPaymentsApi";

const EXPIRING_DAYS = 7;
const PREVIEW = 5;

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stat({
  href,
  label,
  value,
  loading,
  highlight,
}: {
  href: string;
  label: string;
  value: number | undefined;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-xl bg-card p-5 ring-1 ring-separator transition-colors hover:bg-fill-1"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-10 w-16" />
      ) : (
        <span
          className={`text-4xl font-semibold tabular-nums ${highlight && value ? "text-primary" : ""}`}
        >
          {value ?? 0}
        </span>
      )}
    </Link>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link
          href={href}
          className="text-sm font-medium text-accent-text hover:underline"
        >
          {t("adminPay.overview.viewAll")}
        </Link>
      </div>
      {children}
    </section>
  );
}

const SHORTCUTS = [
  { href: "/admin/payments", key: "payments", icon: CreditCard },
  { href: "/admin/accounts", key: "accounts", icon: CalendarClock },
  { href: "/admin/plans", key: "plans", icon: Tags },
  { href: "/admin/tools", key: "tools", icon: Wrench },
] as const;

/** Admin landing page: what needs attention now, plus a shortcut to every admin action. */
export default function AdminOverviewPage() {
  const { t, i18n } = useTranslation();
  const { data: pending, isLoading: pendingLoading } =
    useGetAdminPaymentsQuery("pending");
  const { data: expiring, isLoading: expiringLoading } =
    useGetExpiringAccountsQuery(EXPIRING_DAYS);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl">{t("adminPay.nav.overview")}</h1>

      <AdminMetricsPanel />

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Stat
          href="/admin/payments"
          label={t("adminPay.overview.pendingPayments")}
          value={pending?.pending}
          loading={pendingLoading}
          highlight
        />
        <Stat
          href="/admin/accounts"
          label={t("adminPay.overview.expiring", { days: EXPIRING_DAYS })}
          value={expiring?.length}
          loading={expiringLoading}
        />
      </div>

      <Section
        title={t("adminPay.overview.needsReview")}
        href="/admin/payments"
      >
        {pendingLoading ? <Skeleton className="h-24 rounded-lg" /> : null}
        {!pendingLoading && (pending?.items.length ?? 0) === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            {t("adminPay.emptyPending")}
          </p>
        ) : null}
        <ul className="flex flex-col divide-y divide-separator">
          {pending?.items.slice(0, PREVIEW).map((p) => (
            <li key={p.id}>
              <Link
                href="/admin/payments"
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">
                    {p.companyName ?? p.payerEmail}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.planName} · {p.amountCup.toLocaleString()} CUP ·{" "}
                    {formatDate(p.createdAt, i18n.language)}
                  </p>
                </div>
                <ChevronRight className="size-[18px] shrink-0 text-text-3" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={t("adminPay.overview.expiringTitle", { days: EXPIRING_DAYS })}
        href="/admin/accounts"
      >
        {expiringLoading ? <Skeleton className="h-24 rounded-lg" /> : null}
        {!expiringLoading && (expiring?.length ?? 0) === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            {t("adminPay.overview.noneExpiring")}
          </p>
        ) : null}
        <ul className="flex flex-col divide-y divide-separator">
          {expiring?.slice(0, PREVIEW).map((a) => (
            <li key={`${a.kind}-${a.id}`}>
              <Link
                href="/admin/accounts"
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{a.label}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.plan}
                    {a.planExpiresAt
                      ? ` · ${formatDate(a.planExpiresAt, i18n.language)}`
                      : ""}
                  </p>
                </div>
                <ChevronRight className="size-[18px] shrink-0 text-text-3" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-separator transition-colors hover:bg-fill-1"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
              <s.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t(`adminPay.nav.${s.key}`)}</p>
              <p className="text-sm text-muted-foreground">
                {t(`adminPay.overview.shortcuts.${s.key}`)}
              </p>
            </div>
            <ChevronRight className="size-[18px] shrink-0 text-text-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}
