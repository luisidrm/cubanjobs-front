"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Session from "supertokens-web-js/recipe/session";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Logo } from "@/components/layout/wordmark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/session";
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi";
import { useGetMeQuery } from "@/store/api/usersApi";

export function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const { status } = useSession();
  const { data: me } = useGetMeQuery(undefined, {
    skip: status !== "authenticated",
  });
  // Unread badge on the bell; refreshed every minute.
  const { data: unread = 0 } = useGetUnreadCountQuery(undefined, {
    skip: status !== "authenticated",
    pollingInterval: 60_000,
  });

  async function handleSignOut() {
    await Session.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-3 z-40 mx-3 mt-3 sm:mx-auto sm:w-[calc(100%-3rem)] sm:max-w-6xl">
      <div className="glass flex h-14 items-center justify-between gap-4 rounded-full pr-2 pl-5">
        <Link href="/" aria-label="Brújula" className="text-xl">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link
            href="/jobs"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            {t("tabs.explore")}
          </Link>
          <Link
            href="/companies"
            className="text-foreground/80 transition-colors hover:text-foreground"
          >
            {t("tabs.companies")}
          </Link>
          {me?.role === "employee" ? (
            <Link
              href="/activity"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t("tabs.activity")}
            </Link>
          ) : null}
          {me?.role === "employee" ? (
            <Link
              href="/freelancers"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t("tabs.freelancers")}
            </Link>
          ) : null}
          {me?.role === "employer" ? (
            <Link
              href="/my-jobs"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t("tabs.myJobs")}
            </Link>
          ) : null}
          {me?.role === "employer" ? (
            <Link
              href="/talent"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t("tabs.exploreWorkers")}
            </Link>
          ) : null}
          {me?.role === "employer" ? (
            <Link
              href="/freelancers"
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {t("tabs.freelancers")}
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {status === "loading" ? (
            <Skeleton className="h-9 w-24 rounded-full" />
          ) : status === "authenticated" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("notifications.title")}
                nativeButton={false}
                render={<Link href="/notifications" />}
                className="relative"
              >
                <Bell />
                {unread > 0 ? (
                  <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Button>
              {/* Phones get the bottom tab bar; employees reach Plans and Sign out from its Profile tab. */}
              <div
                className={
                  me?.role === "employee" ? "hidden sm:block" : undefined
                }
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("tabs.profile")}
                      >
                        <Avatar size="sm">
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {me?.role === "employee" ? (
                      <>
                        <DropdownMenuItem render={<Link href="/profile" />}>
                          {t("tabs.profile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/activity" />}>
                          {t("tabs.activity")}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {me?.role === "employer" ? (
                      <>
                        <DropdownMenuItem render={<Link href="/my-jobs" />}>
                          {t("tabs.myJobs")}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/talent" />}>
                          {t("tabs.exploreWorkers")}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/company" />}>
                          {t("employer.myCompany")}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/team" />}>
                          {t("tabs.team")}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/billing" />}>
                          {t("billing.title")}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {me && me.role !== "admin" ? (
                      <DropdownMenuItem render={<Link href="/plans" />}>
                        {t("plans.menu")}
                      </DropdownMenuItem>
                    ) : null}
                    {me?.role === "admin" ? (
                      <DropdownMenuItem
                        render={<Link href="/admin/payments" />}
                      >
                        {t("adminPay.menu")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleSignOut}
                    >
                      {t("profile.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                // The bottom tab bar already has Sign In on phones; keeping both overflowed the header.
                className="max-sm:hidden"
                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                {t("login.signIn")}
              </Button>
              <Button nativeButton={false} render={<Link href="/sign-up" />}>
                {t("signUp.submit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
