"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import { useGetMeQuery } from "@/store/api/usersApi";

/**
 * The signed-in account's picture: the company logo for employers (else their own
 * photo), the user's photo for everyone else, and the first letter of their name
 * when there is no picture or it fails to load.
 */
export function AccountAvatar({
  size = "default",
  className,
}: {
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { data: me } = useGetMeQuery();
  const { data: companies } = useGetMyCompaniesQuery(undefined, {
    skip: me?.role !== "employer",
  });

  const logo = me?.role === "employer" ? companies?.[0]?.logoUrl : null;
  const src = logo || me?.profilePictureUrl || undefined;
  const letter = (me?.firstName?.trim() || me?.email || "")
    .charAt(0)
    .toUpperCase();

  return (
    <Avatar size={size} className={className}>
      {/* Keyed by URL so a newly uploaded picture is loaded afresh. */}
      {src ? <AvatarImage key={src} src={src} alt="" /> : null}
      <AvatarFallback className="bg-accent-soft font-semibold text-accent-text">
        {letter}
      </AvatarFallback>
    </Avatar>
  );
}
