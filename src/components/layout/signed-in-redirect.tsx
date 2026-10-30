"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor } from "@/lib/home";
import { useSession } from "@/lib/session";
import { useGetMeQuery } from "@/store/api/usersApi";

/**
 * "/" is the marketing page for visitors. Anyone already signed in (after
 * signing in, from the logo, or via the auth-page bounce) goes straight to
 * their own home instead: admins to the console, employers to their jobs,
 * employees to the job board.
 */
export function SignedInRedirect() {
  const router = useRouter();
  const { status } = useSession();
  const { data: me } = useGetMeQuery(undefined, {
    skip: status !== "authenticated",
  });

  useEffect(() => {
    if (me) router.replace(homeFor(me.role));
  }, [me, router]);

  return null;
}
