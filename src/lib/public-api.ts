import { cache } from "react";
import type { Job } from "@/types/job";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Public data for crawlers and link previews: no session, cached for a few
// minutes so a burst of bots can't turn into a burst of API calls.
const REVALIDATE_SECONDS = 300;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return ((await res.json()) as { data: T }).data;
  } catch {
    // API down while building or rendering: the page still works, just without metadata.
    return null;
  }
}

/** One public job. `cache` shares the result between generateMetadata and the layout. */
export const fetchPublicJob = cache((id: string) =>
  getJson<Job>(`/api/v1/jobs/${encodeURIComponent(id)}`),
);

export function fetchPublicJobs(limit: number, offset: number) {
  return getJson<Job[]>(`/api/v1/jobs?limit=${limit}&offset=${offset}`);
}

export interface PublicCompany {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
}

export const fetchPublicCompany = cache((id: string) =>
  getJson<PublicCompany>(`/api/v1/companies/${encodeURIComponent(id)}`),
);
