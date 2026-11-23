"use client";

import { Eye, Lock, Search, SearchX, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { authorName, useFreelancerAccess } from "@/lib/freelancer";
import { usePagedOffset } from "@/lib/use-paged-offset";
import { useListFreelancerPostsQuery } from "@/store/api/freelancerApi";
import type { FreelancerPostSummary } from "@/types/freelancer";

const PAGE_SIZE = 20;

function PostCard({ post }: { post: FreelancerPostSummary }) {
  const { t } = useTranslation();
  const name = authorName(post.author);
  return (
    <Link
      href={`/freelancers/${post.id}`}
      className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-separator transition-colors hover:bg-fill-1"
    >
      {post.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.images[0]}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-3 p-4">
        <h2 className="line-clamp-2 text-lg font-semibold">{post.title}</h2>
        <p className="line-clamp-3 text-[15px] text-muted-foreground">
          {post.description}
        </p>
        <div className="mt-auto flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-sm font-bold text-accent-text">
            {post.author.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.profilePictureUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {name}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-sm text-text-3">
            <Eye className="size-4" />
            {t("freelancers.viewers", { count: post.viewCount })}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** The freelancer board: paying employees and paid companies browse offers here. */
export default function FreelancersPage() {
  const { t } = useTranslation();
  const {
    me,
    isLoading: accessLoading,
    canBrowse,
    canPost,
  } = useFreelancerAccess();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 350);
    return () => clearTimeout(id);
  }, [input]);

  const paging = usePagedOffset(query);
  const {
    data: posts,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListFreelancerPostsQuery(
    { q: query || undefined, limit: PAGE_SIZE, offset: paging.offset },
    { skip: !canBrowse },
  );

  const locked = !accessLoading && me && !canBrowse;
  const lockedMessage =
    me?.role === "employer"
      ? t("freelancers.lockedEmployer")
      : t("freelancers.lockedEmployee");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">{t("freelancers.title")}</h1>
          <p className="text-muted-foreground">{t("freelancers.subtitle")}</p>
        </div>
        {me?.role === "employee" ? (
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/freelancers/mine" />}
          >
            {t("freelancers.myPosts")}
          </Button>
        ) : null}
      </div>

      {accessLoading ? <Skeleton className="h-40 rounded-xl" /> : null}

      {locked ? (
        <EmptyState
          icon={Lock}
          message={`${t("freelancers.lockedTitle")}. ${lockedMessage}`}
          action={
            <Button nativeButton={false} render={<Link href="/plans" />}>
              {t("freelancers.upgrade")}
            </Button>
          }
        />
      ) : null}

      {canBrowse ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-text-3" />
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              placeholder={t("freelancers.searchPlaceholder")}
              className="pl-10"
              type="search"
            />
          </div>

          {isLoading ? (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : null}

          {isError && !isLoading ? (
            <EmptyState
              icon={WifiOff}
              tone="danger"
              message={t("freelancers.error")}
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  {t("freelancers.retry")}
                </Button>
              }
            />
          ) : null}

          {!isLoading && !isError && posts?.length === 0 ? (
            <EmptyState
              icon={SearchX}
              message={
                query ? t("freelancers.emptySearch") : t("freelancers.empty")
              }
            />
          ) : null}

          {posts && posts.length > 0 ? (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
              {posts.length >= paging.offset + PAGE_SIZE ? (
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    disabled={isFetching}
                    onClick={() => paging.loadMore(posts.length)}
                  >
                    {t("freelancers.loadMore")}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {me?.role === "employee" && !canPost && !accessLoading ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("freelancers.postingLocked")}
        </p>
      ) : null}
    </div>
  );
}
