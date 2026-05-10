export function errorDescription(
  detail: unknown,
  fallback = "Unknown error",
): string {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail instanceof Error) return detail.message;
  if (detail && typeof detail === "object") {
    const maybeZod = detail as {
      formErrors?: unknown;
      fieldErrors?: Record<string, unknown>;
      message?: unknown;
      error?: unknown;
    };

    if (typeof maybeZod.message === "string") return maybeZod.message;
    if (typeof maybeZod.error === "string") return maybeZod.error;

    const fieldMessages = Object.entries(maybeZod.fieldErrors ?? {})
      .flatMap(([field, messages]) => {
        if (Array.isArray(messages)) {
          return messages.map((message) => `${field}: ${String(message)}`);
        }
        return messages ? [`${field}: ${String(messages)}`] : [];
      });
    if (fieldMessages.length) return fieldMessages.join("; ");

    if (Array.isArray(maybeZod.formErrors) && maybeZod.formErrors.length) {
      return maybeZod.formErrors.map(String).join("; ");
    }

    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
