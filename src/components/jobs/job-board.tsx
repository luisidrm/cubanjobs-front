"use client";

import { Search, SearchX, WifiOff } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GuestDialog } from "@/components/jobs/guest-dialog";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/session";
import { usePagedOffset } from "@/lib/use-paged-offset";
import { useGetTagsQuery, useSearchJobsQuery } from "@/store/api/jobsApi";
import {
  useGetMySavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from "@/store/api/savedJobsApi";
import type { Currency, JobSearchFilters } from "@/types/job";

type ChipKey = "remote" | "CUP" | "MLC" | "USD" | "fullTime";
const CURRENCIES: ChipKey[] = ["CUP", "MLC", "USD"];
const PAGE_SIZE = 20;

/**
 * Job list with search + filter chips. Public: works signed out (save prompts
 * sign-in). Used by the landing page (hero) and /jobs (explore).
 */
export function JobBoard({ hero = false }: { hero?: boolean }) {
  const { t } = useTranslation();
  const { status } = useSession();
  const guest = status !== "authenticated";

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<ChipKey>>(new Set());
  const [tagIds, setTagIds] = useState<Set<string>>(new Set());
  const [guestOpen, setGuestOpen] = useState(false);

  const { data: tags } = useGetTagsQuery();

  const baseFilters = useMemo<JobSearchFilters>(() => {
    const f: JobSearchFilters = { limit: PAGE_SIZE };
    if (query.trim()) f.q = query.trim();
    if (active.has("remote")) f.isRemote = true;
    if (active.has("fullTime")) f.jobType = "full_time";
    const currency = CURRENCIES.find((c) => active.has(c));
    if (currency) f.currency = currency as Currency;
    if (tagIds.size > 0) f.tagIds = Array.from(tagIds).join(",");
    return f;
  }, [query, active, tagIds]);
  const paging = usePagedOffset(JSON.stringify(baseFilters));
  const filters = useMemo<JobSearchFilters>(
    () => ({ ...baseFilters, offset: paging.offset }),
    [baseFilters, paging.offset],
  );

  const { data: jobs, isLoading, isFetching, isError, refetch } = useSearchJobsQuery(filters);
  const { data: saved } = useGetMySavedJobsQuery(undefined, { skip: guest });
  const savedIds = useMemo(() => new Set(saved?.map((s) => s.jobId)), [saved]);
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();

  function toggleChip(key: ChipKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        if (CURRENCIES.includes(key)) for (const c of CURRENCIES) next.delete(c);
        next.add(key);
      }
      return next;
    });
  }

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setActive(new Set());
    setTagIds(new Set());
  }

  function toggleSave(id: string) {
    if (guest) return setGuestOpen(true);
    if (savedIds.has(id)) void unsaveJob(id);
    else void saveJob(id);
  }

  const chips: { key: ChipKey; label: string }[] = [
    { key: "remote", label: t("explore.remote") },
    { key: "CUP", label: "CUP" },
    { key: "MLC", label: "MLC" },
    { key: "USD", label: "USD" },
    { key: "fullTime", label: t("explore.fullTime") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-8 pb-40 sm:px-6">
      <div className="flex flex-col gap-1.5 px-1">
        {hero ? (
          <h1 className="text-balance text-4xl leading-[1.1] sm:text-5xl">
            {t("explore.headline")}{" "}
            <span className="text-accent-text">{t("explore.headlineAccent")}</span>
          </h1>
        ) : (
          <h1 className="text-3xl sm:text-4xl">{t("tabs.explore")}</h1>
        )}
        <p className="text-[15px] text-muted-foreground">
          {t("explore.opportunitiesNear", { count: jobs?.length ?? 0 })}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-text-3" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("explore.searchPlaceholder")}
          aria-label={t("explore.searchPlaceholder")}
          className="pl-10"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <Chip
            key={c.key}
            variant="filter"
            label={c.label}
            selected={active.has(c.key)}
            onClick={() => toggleChip(c.key)}
            className="shrink-0"
          />
        ))}
        {tags?.map((tag) => (
          <Chip
            key={tag.id}
            variant="filter"
            label={tag.name}
            selected={tagIds.has(tag.id)}
            onClick={() => toggleTag(tag.id)}
            className="shrink-0"
          />
        ))}
      </div>

      <p className="px-1 pt-2 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
        {t("explore.latest")}
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-3.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("explore.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : jobs && jobs.length > 0 ? (
        <ul className="flex flex-col gap-3.5">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard
                job={job}
                href={`/jobs/${job.id}`}
                isSaved={savedIds.has(job.id)}
                onToggleSave={() => toggleSave(job.id)}
              />
            </li>
          ))}
          {jobs.length >= paging.offset + PAGE_SIZE ? (
            <li className="flex justify-center pt-1">
              <Button
                variant="secondary"
                disabled={isFetching}
                onClick={() => paging.loadMore(jobs.length)}
              >
                {t("explore.loadMore")}
              </Button>
            </li>
          ) : null}
        </ul>
      ) : (
        <EmptyState
          icon={SearchX}
          message={t("explore.empty")}
          action={
            <Button variant="secondary" onClick={clearFilters}>
              {t("explore.clearFilters")}
            </Button>
          }
        />
      )}

      <GuestDialog open={guestOpen} onOpenChange={setGuestOpen} />

      {hero && guest && status !== "loading" ? <GuestBar /> : null}
    </div>
  );
}

function GuestBar() {
  const { t } = useTranslation();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-3">
      <div className="glass-strong pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-[28px] p-4">
        <p className="text-center text-[15px] leading-snug font-medium">
          {t("welcome.barText")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href="/sign-in" />}>
            {t("login.signIn")}
          </Button>
          <Button nativeButton={false} render={<Link href="/sign-up" />}>
            {t("signUp.title")}
          </Button>
        </div>
      </div>
    </div>
  );
}
