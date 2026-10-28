"use client";

import { SearchX } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PostForm } from "@/components/freelancers/post-form";
import { BackButton } from "@/components/layout/back-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyFreelancerPostsQuery } from "@/store/api/freelancerApi";

export default function EditFreelancerPostPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: posts, isLoading } = useGetMyFreelancerPostsQuery();
  const post = posts?.find((p) => p.id === id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/freelancers/mine" />
      <h1 className="text-4xl">{t("freelancers.editPost")}</h1>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : null}
      {!isLoading && !post ? (
        <EmptyState icon={SearchX} message={t("freelancers.detail.notFound")} />
      ) : null}
      {post ? <PostForm post={post} /> : null}
    </div>
  );
}
