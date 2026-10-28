"use client";

import {
  Briefcase,
  CalendarClock,
  Compass,
  CreditCard,
  Factory,
  Handshake,
  LayoutDashboard,
  ListChecks,
  LogIn,
  type LucideIcon,
  Tags,
  User,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isBottomBarHidden } from "@/lib/bottom-bar";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useGetAdminPaymentsQuery } from "@/store/api/adminPaymentsApi";
import { useGetMeQuery } from "@/store/api/usersApi";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Match only this exact path (otherwise any path beneath it counts too). */
  exact?: boolean;
  /** Show the signed-in user’s photo instead of the icon. */
  avatar?: boolean;
}

/**
 * Phone-width navigation: the same role-based tab set as the mobile app,
 * pinned to the bottom of the screen. Hidden from `sm` up, where the header's
 * own nav takes over.
 */
export function BottomTabBar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { status } = useSession();
  const { data: me } = useGetMeQuery(undefined, {
    skip: status !== "authenticated",
  });
  const isAdmin = me?.role === "admin";
  const { data: pending } = useGetAdminPaymentsQuery("pending", {
    skip: !isAdmin,
    pollingInterval: 60_000,
  });

  let tabs: Tab[] | null = null;
  if (status === "unauthenticated") {
    tabs = [
      { href: "/jobs", label: t("tabs.explore"), icon: Compass },
      { href: "/companies", label: t("tabs.companies"), icon: Factory },
      { href: "/sign-in", label: t("login.signIn"), icon: LogIn },
    ];
  } else if (me?.role === "employee") {
    tabs = [
      { href: "/jobs", label: t("tabs.explore"), icon: Compass },
      { href: "/companies", label: t("tabs.companies"), icon: Factory },
      { href: "/activity", label: t("tabs.activity"), icon: ListChecks },
      { href: "/freelancers", label: t("tabs.freelancers"), icon: Handshake },
      { href: "/profile", label: t("tabs.profile"), icon: User, avatar: true },
    ];
  } else if (me?.role === "employer") {
    tabs = [
      { href: "/my-jobs", label: t("tabs.myJobs"), icon: Briefcase },
      { href: "/talent", label: t("tabs.exploreWorkers"), icon: Users },
      { href: "/freelancers", label: t("tabs.freelancers"), icon: Handshake },
      { href: "/team", label: t("tabs.team"), icon: UserPlus },
      // /profile sends employers on to their company page.
      { href: "/company", label: t("tabs.profile"), icon: User, avatar: true },
    ];
  } else if (isAdmin) {
    // The same five links as the console's sidebar.
    tabs = [
      {
        href: "/admin",
        label: t("adminPay.nav.overview"),
        icon: LayoutDashboard,
        exact: true,
      },
      {
        href: "/admin/payments",
        label: t("adminPay.nav.payments"),
        icon: CreditCard,
        badge: pending?.pending ?? 0,
      },
      {
        href: "/admin/accounts",
        label: t("adminPay.nav.accounts"),
        icon: CalendarClock,
      },
      { href: "/admin/plans", label: t("adminPay.nav.plans"), icon: Tags },
      { href: "/admin/tools", label: t("adminPay.nav.tools"), icon: Wrench },
    ];
  }

  // Still resolving the session/role: render nothing rather than a bar that
  // reshuffles itself a moment later.
  if (!tabs || isBottomBarHidden(pathname)) return null;

  return (
    <>
      {/* Reserves the bar's height so it never covers the end of the page. */}
      <div aria-hidden className="h-14 sm:hidden" />
      <nav
        aria-label={t("tabs.explore")}
        className="fixed inset-x-3 bottom-3 z-40 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="glass flex gap-1 rounded-full p-1.5">
          {tabs.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-13 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] leading-none transition-colors",
                    active
                      ? "bg-accent-soft font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.avatar && me ? (
                    <Avatar
                      size="sm"
                      className={cn("size-6", active && "ring-2 ring-primary")}
                    >
                      <AvatarImage
                        src={me.profilePictureUrl ?? undefined}
                        alt=""
                      />
                      <AvatarFallback>
                        {(me.firstName ?? me.email ?? "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon className="size-5.5" aria-hidden />
                  )}
                  <span className="max-w-full truncate px-1">{tab.label}</span>
                  {tab.badge ? (
                    <span className="absolute top-1 left-1/2 ml-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
