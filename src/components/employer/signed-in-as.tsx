"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMeQuery } from "@/store/api/usersApi";

/** The person behind the company account, with a way to their own profile. */
export function SignedInAs() {
  const { t } = useTranslation();
  const { data: me } = useGetMeQuery();
  if (!me) return null;

  const name =
    [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email;

  return (
    <Link
      href="/profile"
      className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-separator transition-colors hover:bg-fill-1"
    >
      <Avatar size="lg">
        {me.profilePictureUrl ? (
          <AvatarImage src={me.profilePictureUrl} alt="" />
        ) : null}
        <AvatarFallback className="bg-accent-soft font-semibold text-accent-text">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{name}</span>
        <span className="block truncate text-[13px] text-muted-foreground">
          {me.email}
        </span>
      </span>
      <span className="text-[13px] font-semibold text-accent-text">
        {t("tabs.profile")}
      </span>
      <ChevronRight className="size-5 text-text-3" />
    </Link>
  );
}
