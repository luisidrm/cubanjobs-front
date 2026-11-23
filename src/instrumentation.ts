import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

// Server side: initialized once when the Next.js server starts.
export function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init(sentryOptions);
  }
}

// Reports errors thrown while rendering on the server.
export const onRequestError = Sentry.captureRequestError;
