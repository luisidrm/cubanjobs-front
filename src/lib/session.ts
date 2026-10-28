import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Session from "supertokens-web-js/recipe/session";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export function useSession() {
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let mounted = true;
    Session.doesSessionExist()
      .then((exists) => {
        if (mounted) setStatus(exists ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (mounted) setStatus("unauthenticated");
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { status };
}

/**
 * For the sign-in/sign-up pages. proxy.ts already bounces authenticated
 * visitors away from these routes, but only checks the access token
 * cookie's signature/expiry — a token that's merely expired (refresh token
 * still valid) reads as "not authenticated" there even though
 * doesSessionExist() below would silently refresh and succeed. This client
 * check closes that gap, mirroring the redirect mobile's own sign-in/sign-up
 * screens do via useSession() + <Redirect>.
 */
export function useRedirectIfAuthenticated(to: string) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(to);
    }
  }, [status, router, to]);
}
