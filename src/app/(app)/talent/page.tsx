"use client";

import {
  ChevronRight,
  Lock,
  MapPin,
  Search,
  SearchX,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { hasCandidateSearchAccess } from "@/lib/plans";
import { useSkillLabel } from "@/lib/skills";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import {
  useGetMeQuery,
  useGetWorkerSkillsQuery,
  useSearchWorkersQuery,
} from "@/store/api/usersApi";
import type { WorkerSearchFilters, WorkerSummary } from "@/types/user";

const PAGE_SIZE = 24;

function WorkerCard({ worker }: { worker: WorkerSummary }) {
  const skillLabel = useSkillLabel();
  const name =
    [worker.firstName, worker.lastName].filter(Boolean).join(" ") || "?";
  return (
    <Link
      href={`/applicants/${worker.id}`}
      className="flex flex-col gap-3.5 rounded-xl bg-card p-4 ring-1 ring-separator transition-colors hover:bg-fill-1"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-lg font-bold text-accent-text">
          {worker.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worker.profilePictureUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-semibold">{name}</span>
          {worker.location ? (
            <span className="flex items-center gap-1 text-sm text-text-3">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{worker.location}</span>
            </span>
          ) : null}
        </div>
        <ChevronRight className="size-[18px] shrink-0 text-text-3" />
      </div>
      {worker.bio ? (
        <p className="line-clamp-2 text-[15px] text-muted-foreground">
          {worker.bio}
        </p>
      ) : null}
      {worker.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {worker.skills.slice(0, 3).map((s) => (
            <Badge key={s.id} variant="secondary">
              {skillLabel(s.skill)}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

/** Employer-only candidate directory; paid plans only (mirrors the mobile Talent tab). */
export default function TalentPage() {
  const { t } = useTranslation();
  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const employer = me?.role === "employer";
  const { data: companies, isLoading: companiesLoading } =
    useGetMyCompaniesQuery(undefined, {
      skip: !employer,
    });
  const company = companies?.[0];
  const hasAccess = !!company && hasCandidateSearchAccess(company.planTier);

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(id);
  }, [input]);

  const { data: skillsList } = useGetWorkerSkillsQuery(undefined, {
    skip: !hasAccess,
  });
  const skillLabel = useSkillLabel();

  const filters = useMemo<WorkerSearchFilters>(() => {
    const f: WorkerSearchFilters = { limit, offset: 0 };
    if (query) f.q = query;
    if (activeSkills.size > 0) f.skills = Array.from(activeSkills).join(",");
    return f;
  }, [query, activeSkills, limit]);

  const {
    data: workers,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSearchWorkersQuery(filters, { skip: !hasAccess });

  function toggleSkill(skill: string) {
    setLimit(PAGE_SIZE);
    setActiveSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  function clearFilters() {
    setInput("");
    setQuery("");
    setActiveSkills(new Set());
    setLimit(PAGE_SIZE);
  }

  const loading = meLoading || (employer && companiesLoading);
  const canLoadMore = !!workers && workers.length >= limit;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">{t("exploreWorkers.title")}</h1>
        <p className="text-muted-foreground">{t("exploreWorkers.subtitle")}</p>
      </div>

      {loading ? <Skeleton className="h-40 rounded-xl" /> : null}

      {!loading && me && !employer ? (
        <EmptyState icon={Lock} message={t("team.noCompany")} />
      ) : null}

      {!loading && employer && !hasAccess ? (
        <EmptyState
          icon={Lock}
          message={`${t("exploreWorkers.upgradeTitle")}. ${t("exploreWorkers.upgradeMessage")}`}
          action={
            <Button nativeButton={false} render={<Link href="/plans" />}>
              {t("exploreWorkers.upgradeButton")}
            </Button>
          }
        />
      ) : null}

      {hasAccess ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-3" />
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder={t("exploreWorkers.searchPlaceholder")}
              className="pl-10"
              type="search"
            />
          </div>

          {skillsList && skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <Chip
                  key={skill}
                  variant="filter"
                  label={skillLabel(skill)}
                  selected={activeSkills.has(skill)}
                  onClick={() => toggleSkill(skill)}
                />
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : null}

          {isError && !isLoading ? (
            <EmptyState
              icon={WifiOff}
              tone="danger"
              message={t("exploreWorkers.error")}
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  {t("jobDetails.retry")}
                </Button>
              }
            />
          ) : null}

          {!isLoading && !isError && workers && workers.length === 0 ? (
            <EmptyState
              icon={SearchX}
              message={t("exploreWorkers.empty")}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {t("explore.clearFilters")}
                </Button>
              }
            />
          ) : null}

          {workers && workers.length > 0 ? (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {workers.map((w) => (
                  <WorkerCard key={w.id} worker={w} />
                ))}
              </div>
              {canLoadMore ? (
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    disabled={isFetching}
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                  >
                    {t("exploreWorkers.loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
