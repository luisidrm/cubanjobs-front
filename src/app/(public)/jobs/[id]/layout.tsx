import type { Metadata } from "next";
import { fetchPublicJob, SITE_URL } from "@/lib/public-api";
import type { Job, JobType } from "@/types/job";

type Params = { params: Promise<{ id: string }> };

const EMPLOYMENT_TYPE: Record<JobType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  freelance: "CONTRACTOR",
  internship: "INTERN",
};

// MLC is not an ISO currency, so Google would reject a salary quoted in it.
const ISO_CURRENCIES = new Set(["CUP", "USD"]);

function summary(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchPublicJob(id);
  if (!job) return { title: "Brújula — Empleos en Cuba" };

  const title = `${job.title} — ${job.company.name}`;
  const description = summary(job.description);
  const url = `${SITE_URL}/jobs/${job.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      ...(job.coverImageUrl ? { images: [job.coverImageUrl] } : {}),
    },
  };
}

/** schema.org JobPosting: what makes a job eligible for Google's job search. */
function jobPostingJsonLd(job: Job) {
  const salary =
    job.currency &&
    ISO_CURRENCIES.has(job.currency) &&
    (job.salaryMin != null || job.salaryMax != null)
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.currency,
            value: {
              "@type": "QuantitativeValue",
              ...(job.salaryMin != null ? { minValue: job.salaryMin } : {}),
              ...(job.salaryMax != null ? { maxValue: job.salaryMax } : {}),
              unitText: "MONTH",
            },
          },
        }
      : {};

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    ...(job.jobType ? { employmentType: EMPLOYMENT_TYPE[job.jobType] } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.logoUrl ? { logo: job.company.logoUrl } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(job.location ? { addressLocality: job.location } : {}),
        addressCountry: "CU",
      },
    },
    ...(job.isRemote ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...salary,
    url: `${SITE_URL}/jobs/${job.id}`,
  };
}

export default async function JobLayout({
  children,
  params,
}: Params & { children: React.ReactNode }) {
  const { id } = await params;
  const job = await fetchPublicJob(id);

  return (
    <>
      {job ? (
        <script
          type="application/ld+json"
          // `<` is escaped so a job description can never close the script tag.
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON-LD, escaped above
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jobPostingJsonLd(job)).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
      ) : null}
      {children}
    </>
  );
}
