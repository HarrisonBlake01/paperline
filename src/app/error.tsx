"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <p>Paperline could not complete this request.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
