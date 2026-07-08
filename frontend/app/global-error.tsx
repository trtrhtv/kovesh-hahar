"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html dir="rtl" lang="he">
      <body>
        <div style={{ padding: 40, textAlign: "center" }}>
          <h1>משהו השתבש</h1>
          <p>הצוות שלנו קיבל התראה. נסה לרענן את הדף.</p>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: "8px 16px" }}>
            נסה שוב
          </button>
        </div>
      </body>
    </html>
  );
}
