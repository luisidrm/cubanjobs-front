"use client";

import { CalendarClock, CreditCard, LayoutDashboard, Tags, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetAdminPaymentsQuery } from "@/store/api/adminPaymentsApi";
import { useGetMeQuery } from "@/store/api/usersApi";

const NAV = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/payments", key: "payments", icon: CreditCard },
  { href: "/admin/accounts", key: "accounts", icon: CalendarClock },
  { href: "/admin/plans", key: "plans", icon: Tags },
  { href: "/admin/tools", key: "tools", icon: Wrench },
] as const;

/**
 * Admin console shell: floating glass sidebar on desktop, a pill nav on top
 * on small screens. Route access is also enforced by the API (admin role);
 * this only keeps non-admins from seeing an empty console.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { data: me, isLoading } = useGetMeQuery();
  const isAdmin = me?.role === "admin";

  const { data: pending } = useGetAdminPaymentsQuery("pending", {
    skip: !isAdmin,
    pollingInterval: 60_000,
  });
  const pendingCount = pending?.pending ?? 0;

  useEffect(() => {
    if (!isLoading && me && me.role !== "admin") router.replace("/");
  }, [isLoading, me, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start">
      <nav
        aria-label={t("adminPay.menu")}
        className="glass flex shrink-0 gap-1 max-sm:hidden overflow-x-auto rounded-full p-1.5 lg:sticky lg:top-24 lg:w-[248px] lg:flex-col lg:rounded-[28px] lg:p-3"
      >
        <p className="hidden px-3 pt-2 pb-3 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase lg:block">
          {t("adminPay.menu")}
        </p>
        {NAV.map((item) => {
          const on = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/45 lg:rounded-[10px]",
                on
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-foreground hover:bg-fill-1",
              )}
            >
              <item.icon className="size-[18px]" />
              <span className="flex-1">{t(`adminPay.nav.${item.key}`)}</span>
              {item.key === "payments" && pendingCount > 0 ? (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums",
                    on ? "bg-white/25" : "bg-primary text-primary-foreground",
                  )}
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
