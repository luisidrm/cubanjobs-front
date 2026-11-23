import type { MetadataRoute } from "next";
import { fetchPublicJobs, SITE_URL } from "@/lib/public-api";

// Rendered on request (and cached by fetch), not at build time, so a build
// without the API running doesn't freeze an empty sitemap.
export const dynamic = "force-dynamic";

const PAGE = 100; // the API's maximum page size
const MAX_PAGES = 50; // 5,000 jobs: well under the 50,000-URL sitemap limit

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs: MetadataRoute.Sitemap = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await fetchPublicJobs(PAGE, page * PAGE);
    if (!batch) break;
    for (const job of batch) {
      jobs.push({
        url: `${SITE_URL}/jobs/${job.id}`,
        lastModified: job.createdAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    if (batch.length < PAGE) break;
  }

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: "daily", priority: 0.9 },
    ...jobs,
  ];
}
