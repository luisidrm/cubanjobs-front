import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Shared by the browser and server setup. Reporting stays off until
 * NEXT_PUBLIC_SENTRY_DSN is set (the DSN is a public identifier, not a secret).
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development",
  // Errors are always sent; performance traces are sampled to stay inside the free quota.
  tracesSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05,
  ),
  // Never ship cookies, auth headers or request bodies (passwords, payment details).
  beforeSend(event: ErrorEvent): ErrorEvent {
    if (event.request) {
      const { cookies: _c, headers: _h, data: _d, ...safe } = event.request;
      event.request = safe;
    }
    return event;
  },
};
