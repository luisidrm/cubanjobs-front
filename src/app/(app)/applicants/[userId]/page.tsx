"use client";

import { ExternalLink, MapPin, MessageCircle, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/layout/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkillLabel } from "@/lib/skills";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { useGetPublicProfileQuery } from "@/store/api/usersApi";

/** Employer-facing view of an applicant (or talent-search result). */
export default function ApplicantProfilePage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const skillLabel = useSkillLabel();
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useGetPublicProfileQuery(userId);

  const name = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      t("applicantProfile.unnamed")
    : "";
  const whatsapp = profile?.phone?.replace(/\D/g, "") ?? "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6">
      <BackButton fallback="/talent" />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("applicantProfile.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {profile ? (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="grid size-24 place-items-center overflow-hidden rounded-full bg-accent-soft text-3xl font-bold text-accent-text">
              {profile.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePictureUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <h1 className="text-3xl">{name}</h1>
            {profile.location ? (
              <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground">
                <MapPin className="size-3.5" />
                {profile.location}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {whatsapp ? (
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={
                    // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
                    <a
                      href={whatsappChatUrl(whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <MessageCircle />
                  {t("jobApplicants.contactWhatsapp")}
                </Button>
              ) : null}
              {profile.linkedinUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  nativeButton={false}
                  render={
                    // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <ExternalLink />
                  {t("applicantProfile.viewLinkedin")}
                </Button>
              ) : null}
            </div>
          </div>

          {profile.bio ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl">{t("applicantProfile.about")}</h2>
              <p className="whitespace-pre-line text-base text-muted-foreground">
                {profile.bio}
              </p>
            </section>
          ) : null}

          {profile.skills.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl">{t("applicantProfile.skills")}</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="h-8 px-3 text-sm"
                  >
                    {s.yearsExperience
                      ? `${skillLabel(s.skill)} · ${s.yearsExperience}`
                      : skillLabel(s.skill)}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          {profile.experience.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl">{t("applicantProfile.experience")}</h2>
              <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-separator">
                {profile.experience.map((e) => (
                  <li
                    key={e.id}
                    className="border-b border-separator px-4 py-3 last:border-b-0"
                  >
                    <p className="font-semibold">{e.title}</p>
                    {e.organization ? (
                      <p className="text-[15px] text-muted-foreground">
                        {e.organization}
                      </p>
                    ) : null}
                    {e.description ? (
                      <p className="mt-1 whitespace-pre-line text-[14px] text-text-3">
                        {e.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
