import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Session from "supertokens-web-js/recipe/session";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",

  // Crucial for Web: Automatically includes the HttpOnly session cookies in cross-origin requests.
  // supertokens-web-js also patches window.fetch for requests to apiDomain, attaching the
  // anti-csrf/fdi-version headers and access token itself — nothing to add here.
  credentials: "include",

  // Lets the backend build emailed links (password reset, email verification)
  // against the web app's domain; without it every link points at the mobile app.
  // See back/src/lib/supertokens.ts (readPlatform).
  prepareHeaders: (headers) => {
    headers.set("x-platform", "web");
    return headers;
  },
});

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Execute the initial browser request (cookies are attached automatically)
  let result = await rawBaseQuery(args, api, extraOptions);

  // If the API returns a 401 Unauthorized status, try refreshing the cookies
  if (result.error && result.error.status === 401) {
    try {
      // This tells the SuperTokens client SDK to trigger a /auth/session/refresh call
      const refreshSuccess = await Session.attemptRefreshingSession();

      if (refreshSuccess) {
        // Retry the original query with the updated browser session cookies
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        // Session is fully dead or revoked; clear browser tokens and redirect
        await Session.signOut();
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
      }
    } catch {
      // attemptRefreshingSession throws on network/server failures, not when
      // the session is actually dead (that returns false above). Signing the
      // user out here would turn a transient API hiccup into a forced logout,
      // so surface the failure and let them retry instead.
      return {
        error: { status: "FETCH_ERROR", error: "Could not refresh the session" },
      };
    }
  }

  return result;
};
