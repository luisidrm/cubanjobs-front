"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PostForm } from "@/components/freelancers/post-form";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFreelancerAccess } from "@/lib/freelancer";

export default function NewFreelancerPostPage() {
  const { t } = useTranslation();
  const { isLoading, canPost } = useFreelancerAccess();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/freelancers/mine" />
      <h1 className="text-4xl">{t("freelancers.newPost")}</h1>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : null}
      {!isLoading && !canPost ? (
        <EmptyState
          icon={Lock}
          message={t("freelancers.postingLocked")}
          action={
            <Button nativeButton={false} render={<Link href="/plans" />}>
              {t("freelancers.upgrade")}
            </Button>
          }
        />
      ) : null}
      {canPost ? <PostForm /> : null}
    </div>
  );
}
