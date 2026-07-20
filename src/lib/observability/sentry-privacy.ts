import type { Breadcrumb, Event } from "@sentry/nextjs";

const REDACTED = "[Filtered]";

function stripQuery(value: string | undefined) {
  if (!value) return value;
  try {
    const url = new URL(value, "https://paperline.invalid");
    url.search = "";
    url.hash = "";
    return url.origin === "https://paperline.invalid" ? url.pathname : url.toString();
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function stripRouteIdentifiers(value: string | undefined) {
  return stripQuery(value)
    ?.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "<id>")
    .replace(/\/[A-Za-z0-9_-]{20,}(?=\/|$)/g, "/<id>");
}

/**
 * Paperline handles private documents and model prompts. Sentry receives only
 * error type, stack frames, route shape, and release/runtime metadata—never
 * request bodies, headers, cookies, user identity, prompts, or document text.
 */
export function scrubSentryEvent<T extends Event>(event: T): T {
  delete event.user;
  delete event.extra;
  delete event.contexts;
  delete event.tags;

  if (event.request) {
    event.request = {
      method: event.request.method,
      url: stripRouteIdentifiers(event.request.url),
    };
  }

  if (event.message) event.message = REDACTED;
  if (event.transaction) event.transaction = stripRouteIdentifiers(event.transaction);
  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = REDACTED;
    for (const frame of value.stacktrace?.frames ?? []) {
      delete frame.vars;
      delete frame.pre_context;
      delete frame.context_line;
      delete frame.post_context;
    }
  }

  if (event.breadcrumbs) {
    const breadcrumbs: Breadcrumb[] = [];
    for (const breadcrumb of event.breadcrumbs) {
      const scrubbed = scrubSentryBreadcrumb(breadcrumb);
      if (scrubbed) breadcrumbs.push(scrubbed);
    }
    event.breadcrumbs = breadcrumbs;
  }

  return event;
}

export function scrubSentrySpan<
  T extends { description?: string; data?: Record<string, unknown> },
>(span: T): T {
  span.description = stripRouteIdentifiers(span.description);
  span.data = undefined;
  return span;
}

export function scrubSentryBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category === "console") return null;

  return {
    category: breadcrumb.category,
    level: breadcrumb.level,
    timestamp: breadcrumb.timestamp,
    type: breadcrumb.type,
    message: breadcrumb.message ? REDACTED : undefined,
    data:
      breadcrumb.category === "http" || breadcrumb.category === "fetch" || breadcrumb.category === "xhr"
        ? {
            method: breadcrumb.data?.method,
            status_code: breadcrumb.data?.status_code,
            url: stripRouteIdentifiers(
              typeof breadcrumb.data?.url === "string" ? breadcrumb.data.url : undefined,
            ),
          }
        : undefined,
  };
}
