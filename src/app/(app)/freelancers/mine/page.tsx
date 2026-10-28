"use client";

import { Eye, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { useFreelancerAccess } from "@/lib/freelancer";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  useDeleteFreelancerPostMutation,
  useGetMyFreelancerPostsQuery,
} from "@/store/api/freelancerApi";
import { MAX_FREELANCER_POSTS } from "@/types/freelancer";

export default function MyFreelancerPostsPage() {
  const { t } = useTranslation();
  const { me, isLoading: accessLoading, canPost } = useFreelancerAccess();
  const { data: posts, isLoading } = useGetMyFreelancerPostsQuery(undefined, {
    skip: me?.role !== "employee",
  });
  const [deletePost, { isLoading: deleting }] =
    useDeleteFreelancerPostMutation();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const atLimit = (posts?.length ?? 0) >= MAX_FREELANCER_POSTS;

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deletePost(toDelete).unwrap();
      showSuccessToast(t("freelancers.form.deleted"));
    } catch (err) {
      showErrorToast(getErrorMessage(err, t("freelancers.form.saveFailed")));
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/freelancers" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">{t("freelancers.mine.title")}</h1>
          <p className="text-muted-foreground">
            {t("freelancers.mine.subtitle")}
          </p>
        </div>
        {canPost && !atLimit ? (
          <Button
            nativeButton={false}
            render={<Link href="/freelancers/new" />}
          >
            <Plus />
            {t("freelancers.newPost")}
          </Button>
        ) : null}
      </div>

      {!accessLoading && me && me.role !== "employee" ? (
        <EmptyState icon={Lock} message={t("freelancers.postingLocked")} />
      ) : null}

      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          {t("freelancers.mine.limit", { max: MAX_FREELANCER_POSTS })}
        </p>
      ) : null}

      {isLoading || accessLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : null}

      {!isLoading && posts?.length === 0 ? (
        <EmptyState icon={Pencil} message={t("freelancers.mine.empty")} />
      ) : null}

      <ul className="flex flex-col gap-3">
        {posts?.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-separator"
          >
            <Link
              href={`/freelancers/${p.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0]}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="size-16 shrink-0 rounded-lg bg-fill-1" />
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-semibold">{p.title}</span>
                <span className="flex items-center gap-1 text-sm text-text-3">
                  <Eye className="size-4" />
                  {t("freelancers.viewers", { count: p.viewCount })}
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("freelancers.editPost")}
              nativeButton={false}
              render={<Link href={`/freelancers/${p.id}/edit`} />}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("freelancers.mine.deleteAction")}
              onClick={() => setToDelete(p.id)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!toDelete}
        onOpenChange={(o) => (o ? null : setToDelete(null))}
      >
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("freelancers.mine.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("freelancers.mine.confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {t("freelancers.mine.deleteAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
