import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

/**
 * Fetch helper for Server Components: forwards the caller's session cookies
 * so `/api/v1/*` sees the same session the browser would. Unlike baseQuery,
 * this cannot refresh an expired access token and retry — Next.js only
 * allows setting cookies from a Server Action or Route Handler, not while
 * rendering a page. Treat a 401 here as "not authenticated" and let the
 * proxy-level session check (added in a later stage) keep expired sessions
 * from reaching these pages in the first place.
 */
export async function serverFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });
}
