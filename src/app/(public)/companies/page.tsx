"use client";

import { BadgeCheck, Building2, MapPin, Search, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompanyLogo } from "@/components/jobs/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchCompaniesQuery } from "@/store/api/companiesApi";

export default function CompaniesPage() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  // Wait for a pause in typing before querying.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const { data, isLoading, isError, refetch } = useSearchCompaniesQuery({
    q: q || undefined,
    limit: 50,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-4xl">{t("companies.title")}</h1>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("companies.searchPlaceholder")}
          aria-label={t("companies.searchPlaceholder")}
          className="pl-11"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("companies.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <EmptyState icon={Building2} message={t("companies.empty")} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((c) => (
          <article
            key={c.id}
            className="relative flex min-w-0 items-center gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-separator transition-[transform,box-shadow] duration-200 ease-spring hover:shadow-md active:scale-[0.99]"
          >
            <CompanyLogo
              name={c.name}
              logoUrl={c.logoUrl}
              className="size-[52px] rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 text-base leading-tight font-semibold">
                <Link
                  href={`/companies/${c.id}`}
                  className="truncate outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-4 focus-visible:after:ring-ring/45"
                >
                  {c.name}
                </Link>
                {c.isVerified ? (
                  <BadgeCheck
                    className="size-4 shrink-0 text-primary"
                    aria-label={t("explore.verifiedCompany")}
                  />
                ) : null}
              </h2>
              {c.industry ? (
                <p className="truncate text-sm text-muted-foreground">
                  {c.industry}
                </p>
              ) : null}
              {c.location ? (
                <p className="flex items-center gap-1 text-[13px] text-text-3">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{c.location}</span>
                </p>
              ) : null}
            </div>
            {c.openJobs > 0 ? (
              <Badge>{t("companies.openJobs", { count: c.openJobs })}</Badge>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
