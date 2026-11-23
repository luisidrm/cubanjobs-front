"use client";

import {
  Copy,
  RefreshCw,
  Share2,
  UserMinus,
  Users,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { JoinCompanyForm } from "@/components/employer/join-company-form";
import { Badge } from "@/components/ui/badge";
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
import {
  useCreateInviteMutation,
  useGetMyCompaniesQuery,
  useGetTeamQuery,
  useRemoveTeamMemberMutation,
  useRevokeInviteMutation,
} from "@/store/api/companiesApi";
import { useGetMeQuery } from "@/store/api/usersApi";
import type { TeamMember } from "@/types/company";

function memberName(m: TeamMember) {
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
}

export default function TeamPage() {
  const { t, i18n } = useTranslation();
  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const employer = me?.role === "employer";
  const { data: companies, isLoading: companiesLoading } =
    useGetMyCompaniesQuery(undefined, { skip: !employer });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const company = companies?.find((c) => c.id === selectedId) ?? companies?.[0];

  const {
    data: team,
    isLoading,
    isError,
    refetch,
  } = useGetTeamQuery(company?.id ?? "", {
    skip: !company,
  });
  const [createInvite, { isLoading: creating }] = useCreateInviteMutation();
  const [revokeInvite, { isLoading: revoking }] = useRevokeInviteMutation();
  const [removeMember] = useRemoveTeamMemberMutation();
  const [target, setTarget] = useState<TeamMember | null>(null);

  const full = team
    ? team.seatLimit !== null && team.seatsUsed >= team.seatLimit
    : false;
  const leaving = target?.userId === me?.id;

  async function handleGenerate() {
    if (!company) return;
    try {
      await createInvite(company.id).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("team.inviteError")));
    }
  }

  async function handleRevoke() {
    if (!company) return;
    try {
      await revokeInvite(company.id).unwrap();
      toast.info(t("team.revoked"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("team.inviteError")));
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.info(t("team.copied"));
    } catch {
      toast.error(t("team.inviteError"));
    }
  }

  async function handleShare(code: string) {
    if (!company) return;
    const text = t("team.shareMessage", { company: company.name, code });
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // Dismissing the share sheet is not an error.
      }
    } else {
      await handleCopy(code);
    }
  }

  async function confirmRemove() {
    if (!company || !target) return;
    const member = target;
    setTarget(null);
    try {
      await removeMember({
        companyId: company.id,
        userId: member.userId,
      }).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("team.removeError")));
    }
  }

  const loading = meLoading || (employer && companiesLoading);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-4xl">{t("team.title")}</h1>

      {loading ? <Skeleton className="h-40 rounded-xl" /> : null}

      {!loading && me && !employer ? (
        <EmptyState icon={Users} message={t("team.noCompany")} />
      ) : null}

      {!loading && employer && !company ? (
        <>
          <EmptyState icon={Users} message={t("team.noCompany")} />
          <JoinCompanyForm />
        </>
      ) : null}

      {company ? (
        <>
          {companies && companies.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {companies.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={c.id === company.id ? "default" : "outline"}
                  onClick={() => setSelectedId(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          ) : null}

          {isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}
          {isError && !isLoading ? (
            <EmptyState
              icon={WifiOff}
              tone="danger"
              message={t("team.error")}
              action={
                <Button variant="secondary" onClick={() => refetch()}>
                  {t("jobDetails.retry")}
                </Button>
              }
            />
          ) : null}

          {team ? (
            <>
              <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{t("team.seats")}</h2>
                  <Badge variant={full ? "warning" : "default"}>
                    {team.seatLimit === null
                      ? t("team.seatsUnlimited", { used: team.seatsUsed })
                      : t("team.seatsOf", {
                          used: team.seatsUsed,
                          limit: team.seatLimit,
                        })}
                  </Badge>
                </div>
                {team.seatLimit !== null ? (
                  <div className="h-2 overflow-hidden rounded-full bg-fill-2">
                    <div
                      className={
                        full ? "h-full bg-warning" : "h-full bg-primary"
                      }
                      style={{
                        width: `${Math.min(100, (team.seatsUsed / team.seatLimit) * 100)}%`,
                      }}
                    />
                  </div>
                ) : null}
              </section>

              {team.canManage ? (
                <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator">
                  <h2 className="text-lg font-semibold">
                    {t("team.inviteTitle")}
                  </h2>
                  {full ? (
                    <>
                      <p className="text-[15px] text-muted-foreground">
                        {t("team.seatLimitMessage", {
                          plan: t(`billing.tiers.${team.planTier}.name`),
                          limit: team.seatLimit,
                        })}
                      </p>
                      <Button
                        nativeButton={false}
                        render={<Link href="/plans" />}
                      >
                        {t("team.seatLimitUpgrade")}
                      </Button>
                    </>
                  ) : team.invite ? (
                    <>
                      <p className="text-[15px] text-muted-foreground">
                        {t("team.inviteHelp")}
                      </p>
                      <div className="flex flex-col items-center gap-1 rounded-xl bg-accent-soft py-4">
                        <span className="font-mono text-3xl font-bold tracking-[0.25em] text-accent-text select-all">
                          {team.invite.code}
                        </span>
                        <span className="text-[13px] text-text-3">
                          {t("team.inviteExpires", {
                            date: new Date(
                              team.invite.expiresAt,
                            ).toLocaleDateString(i18n.language, {
                              day: "numeric",
                              month: "short",
                            }),
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleCopy(team.invite!.code)}
                        >
                          <Copy />
                          {t("team.copy")}
                        </Button>
                        <Button onClick={() => handleShare(team.invite!.code)}>
                          <Share2 />
                          {t("team.share")}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={creating}
                          onClick={handleGenerate}
                        >
                          <RefreshCw />
                          {t("team.regenerate")}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={revoking}
                          onClick={handleRevoke}
                        >
                          {t("team.revoke")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[15px] text-muted-foreground">
                        {t("team.inviteHelp")}
                      </p>
                      <Button disabled={creating} onClick={handleGenerate}>
                        {t("team.generate")}
                      </Button>
                    </>
                  )}
                </section>
              ) : (
                <p className="px-1 text-[13px] text-text-3">
                  {t("team.ownerOnly")}
                </p>
              )}

              <section className="flex flex-col gap-2">
                <h2 className="px-1 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                  {t("team.membersTitle")}
                </h2>
                <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-separator">
                  {team.members.map((m) => {
                    const isYou = m.userId === me?.id;
                    const actionable =
                      m.role !== "owner" && (team.canManage || isYou);
                    return (
                      <li
                        key={m.userId}
                        className="flex min-h-14 items-center gap-3 border-b border-separator px-4 py-2 last:border-b-0"
                      >
                        <div className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-sm font-bold text-accent-text">
                          {m.profilePictureUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.profilePictureUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            memberName(m).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {memberName(m)}
                            {isYou ? ` · ${t("team.you")}` : ""}
                          </p>
                          <p className="truncate text-[13px] text-text-3">
                            {m.email}
                          </p>
                        </div>
                        {m.role === "owner" ? (
                          <Badge>{t("team.owner")}</Badge>
                        ) : actionable ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              isYou ? t("team.leave") : t("team.remove")
                            }
                            onClick={() => setTarget(m)}
                          >
                            <UserMinus className="text-destructive" />
                          </Button>
                        ) : (
                          <Badge variant="ghost">{t("team.member")}</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          ) : null}
        </>
      ) : null}

      <Dialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
      >
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>
              {leaving
                ? t("team.leaveTitle")
                : t("team.removeTitle", {
                    name: target ? memberName(target) : "",
                  })}
            </DialogTitle>
            <DialogDescription>
              {leaving ? t("team.leaveMessage") : t("team.removeMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setTarget(null)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              {leaving ? t("team.leave") : t("team.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
