"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { useGetMeQuery } from "@/store/api/usersApi";

/**
 * Admins have no use for the public job board: whenever they land on "/"
 * (after signing in, from the logo, or via the auth-page bounce) send them to
 * the console. Everyone else sees the page untouched.
 */
export function AdminHomeRedirect() {
  const router = useRouter();
  const { status } = useSession();
  const { data: me } = useGetMeQuery(undefined, {
    skip: status !== "authenticated",
  });

  useEffect(() => {
    if (me?.role === "admin") router.replace("/admin");
  }, [me?.role, router]);

  return null;
}
