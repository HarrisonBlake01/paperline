import * as Sentry from "@sentry/nextjs";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentrySpan,
} from "@/lib/observability/sentry-privacy";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    queryParams: false,
    genAI: { inputs: false, outputs: false },
  },
  includeLocalVariables: false,
  enableLogs: false,
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    if (name.includes("/api/health") || name.includes("/api/readiness")) return 0;
    return inheritOrSampleWith(process.env.NODE_ENV === "development" ? 1 : 0.05);
  },
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
  beforeSendSpan: scrubSentrySpan,
  beforeBreadcrumb: scrubSentryBreadcrumb,
});
