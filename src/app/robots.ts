import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/public-api";

// Public pages (landing, job board, job and company pages) are open to
// crawlers; everything behind a login has nothing to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/profile",
        "/onboarding",
        "/my-jobs",
        "/team",
        "/plans",
        "/activity",
        "/talent",
        "/freelancers",
        "/applicants",
        "/company",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
