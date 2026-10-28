"use client";

import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAdminMetricsQuery } from "@/store/api/adminPaymentsApi";
import type { AdminMetrics } from "@/types/admin-payments";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-separator">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Figure({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`truncate font-semibold tabular-nums ${strong ? "text-3xl text-primary" : "text-2xl"}`}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-text-3">{sub}</span> : null}
    </div>
  );
}

/** One labelled bar whose width is its share of `max`. */
function Bar({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate">{label}</span>
        <span className="font-medium tabular-nums">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-fill-1">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function monthLabel(key: string, locale: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, {
    month: "short",
    timeZone: "UTC",
  });
}

function Loaded({ m }: { m: AdminMetrics }) {
  const { t, i18n } = useTranslation();
  const n = (v: number) => v.toLocaleString(i18n.language);
  const cup = (v: number) => `${n(v)} CUP`;
  const r = m.revenue;
  const maxMonth = Math.max(...r.byMonth.map((x) => x.amountCup), 0);
  const maxPlan = Math.max(...r.byPlan.map((x) => x.amountCup), 0);

  return (
    <>
      <Card title={t("adminPay.metrics.users")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Figure
            label={t("adminPay.metrics.totalUsers")}
            value={n(m.users.total)}
            strong
          />
          <Figure
            label={t("adminPay.metrics.employees")}
            value={n(m.users.employees)}
          />
          <Figure
            label={t("adminPay.metrics.employers")}
            value={n(m.users.employers)}
          />
          <Figure
            label={t("adminPay.metrics.newWeek")}
            value={n(m.users.newLast7Days)}
            sub={`${t("adminPay.metrics.newMonth")}: ${n(m.users.newLast30Days)}`}
          />
        </div>
      </Card>

      <Card title={t("adminPay.metrics.platforms")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Figure
            label={`${t("adminPay.metrics.web")} · ${t("adminPay.metrics.activeIn", { days: m.platforms.activeDays })}`}
            value={n(m.platforms.web.activeLast30Days)}
            sub={`${t("adminPay.metrics.seenSoFar")}: ${n(m.platforms.web.everSeen)}`}
            strong
          />
          <Figure
            label={`${t("adminPay.metrics.app")} · ${t("adminPay.metrics.activeIn", { days: m.platforms.activeDays })}`}
            value={n(m.platforms.app.activeLast30Days)}
            sub={`${t("adminPay.metrics.seenSoFar")}: ${n(m.platforms.app.everSeen)}`}
            strong
          />
          <Figure
            label={t("adminPay.metrics.both")}
            value={n(m.platforms.both)}
          />
        </div>
        <p className="text-xs text-text-3">
          {t("adminPay.metrics.trackingNote")}
        </p>
      </Card>

      <Card title={t("adminPay.metrics.plans")}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminPay.metrics.employeePlans")}
            </h3>
            <Bar
              label={t("adminPay.metrics.free")}
              value={m.plans.employees.free}
              max={m.plans.employees.free + m.plans.employees.paid}
              display={n(m.plans.employees.free)}
            />
            <Bar
              label={t("adminPay.metrics.paid")}
              value={m.plans.employees.paid}
              max={m.plans.employees.free + m.plans.employees.paid}
              display={n(m.plans.employees.paid)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminPay.metrics.companyPlans")}
            </h3>
            {(["free", "basic", "pro"] as const).map((tier) => (
              <Bar
                key={tier}
                label={t(`adminPay.metrics.${tier}`)}
                value={m.plans.companies[tier]}
                max={
                  m.plans.companies.free +
                  m.plans.companies.basic +
                  m.plans.companies.pro
                }
                display={n(m.plans.companies[tier])}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card title={t("adminPay.metrics.revenue")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Figure
            label={t("adminPay.metrics.totalRevenue")}
            value={cup(r.totalCup)}
            sub={t("adminPay.metrics.approvedCount", {
              count: r.approvedCount,
            })}
            strong
          />
          <Figure
            label={t("adminPay.metrics.last30")}
            value={cup(r.last30DaysCup)}
          />
          <Figure
            label={t("adminPay.metrics.thisMonth")}
            value={cup(r.thisMonthCup)}
          />
          <Figure
            label={t("adminPay.metrics.waiting")}
            value={cup(r.pendingCup)}
            sub={n(r.pendingCount)}
          />
        </div>

        {r.approvedCount === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            {t("adminPay.metrics.noRevenue")}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("adminPay.metrics.byMonth")}
              </h3>
              {r.byMonth.map((x) => (
                <Bar
                  key={x.month}
                  label={monthLabel(x.month, i18n.language)}
                  value={x.amountCup}
                  max={maxMonth}
                  display={cup(x.amountCup)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("adminPay.metrics.byPlan")}
              </h3>
              {r.byPlan.map((x) => (
                <Bar
                  key={x.code}
                  label={`${x.name} (${x.count})`}
                  value={x.amountCup}
                  max={maxPlan}
                  display={cup(x.amountCup)}
                />
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-text-3">
          {t("adminPay.metrics.stripeNote")}
        </p>
      </Card>
    </>
  );
}

/** Admin overview metrics: people per client, per plan, and money received. */
export function AdminMetricsPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetAdminMetricsQuery(undefined, {
    pollingInterval: 120_000,
  });

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <>
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </>
      ) : null}
      {isError ? (
        <p className="text-[15px] text-destructive">
          {t("adminPay.metrics.loadError")}
        </p>
      ) : null}
      {data ? <Loaded m={data} /> : null}
    </div>
  );
}
