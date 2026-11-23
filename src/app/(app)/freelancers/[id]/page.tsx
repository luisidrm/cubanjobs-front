"use client";

import {
  ExternalLink,
  Eye,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  SearchX,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/layout/back-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { authorName, type ContactLink, contactLinks } from "@/lib/freelancer";
import { useGetFreelancerPostQuery } from "@/store/api/freelancerApi";

const CONTACT_ICONS: Record<ContactLink["key"], typeof Phone> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  telegram: Send,
};

export default function FreelancerPostPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error } = useGetFreelancerPostQuery(id);
  const [active, setActive] = useState(0);

  const status = error && "status" in error ? error.status : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/freelancers" />
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : null}

      {status === 402 ? (
        <EmptyState
          icon={Lock}
          message={t("freelancers.lockedTitle")}
          action={
            <Button nativeButton={false} render={<Link href="/plans" />}>
              {t("freelancers.upgrade")}
            </Button>
          }
        />
      ) : null}

      {error && status !== 402 ? (
        <EmptyState icon={SearchX} message={t("freelancers.detail.notFound")} />
      ) : null}

      {post ? (
        <>
          {post.images.length > 0 ? (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.images[Math.min(active, post.images.length - 1)]}
                alt=""
                className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-separator"
              />
              {post.images.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {post.images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`${i + 1}/${post.images.length}`}
                      className={`size-16 shrink-0 overflow-hidden rounded-lg ring-2 ${i === active ? "ring-primary" : "ring-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl">{post.title}</h1>
              {post.isOwner ? (
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/freelancers/${post.id}/edit`} />}
                >
                  <Pencil />
                  {t("freelancers.editPost")}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-3">
              <span>
                {t("freelancers.detail.by", { name: authorName(post.author) })}
              </span>
              {post.author.location ? (
                <span>{post.author.location}</span>
              ) : null}
              <span className="flex items-center gap-1">
                <Eye className="size-4" />
                {t("freelancers.viewers", { count: post.viewCount })}
              </span>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed whitespace-pre-line">
            {post.description}
          </p>

          {post.linkUrl ? (
            <Button
              variant="outline"
              className="self-start"
              nativeButton={false}
              render={
                // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                />
              }
            >
              <ExternalLink />
              {t("freelancers.detail.openLink")}
            </Button>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-xl">{t("freelancers.detail.contact")}</h2>
            <div className="flex flex-wrap gap-2">
              {contactLinks(post).map((c) => {
                const Icon = CONTACT_ICONS[c.key];
                const external = c.key === "whatsapp" || c.key === "telegram";
                return (
                  <Button
                    key={c.key}
                    variant="secondary"
                    nativeButton={false}
                    render={
                      // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
                      <a
                        href={c.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                      />
                    }
                  >
                    <Icon />
                    {c.value}
                  </Button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
