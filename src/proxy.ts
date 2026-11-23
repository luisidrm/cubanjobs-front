import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import NextJS from "supertokens-node/nextjs";
import "@/lib/supertokensServer";

// Optimistic only: verifies the access token's signature and expiry against
// the SuperTokens core's cached JWKS, no database/API lookup. Real
// authorization still happens at the API layer (requireAuth) — this just
// keeps obviously-unauthenticated requests from ever reaching a protected
// page, and bounces already-signed-in users off the auth screens.
const PROTECTED_ROUTES = [
  "/onboarding",
  "/plans",
  "/admin",
  "/team",
  "/talent",
  "/my-jobs",
  "/company",
  "/billing",
  "/profile",
  "/activity",
  "/notifications",
  "/applicants",
  "/freelancers",
];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // accessTokenPayload, not hasToken: hasToken is true for any present
  // cookie, expired or not — accessTokenPayload is only set once the JWT's
  // signature and expiry have actually verified against the core's JWKS.
  const { accessTokenPayload } = await NextJS.getSSRSession(
    req.cookies.getAll(),
  );
  const hasValidSession = accessTokenPayload !== undefined;

  if (isProtectedRoute && !hasValidSession) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
