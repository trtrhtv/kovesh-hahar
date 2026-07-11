"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-5 gap-6">
      <div className="font-mono text-xs text-moto tracking-[0.3em]">[ERR // המנוע נעצר]</div>
      <h1 className="text-4xl sm:text-5xl font-black text-ink">משהו השתבש</h1>
      <p className="text-textDim max-w-md leading-relaxed">
        נתקלנו בתקלה בלתי צפויה. הצוות קיבל התראה אוטומטית. אפשר לנסות שוב, ואם זה חוזר - לחזור לדף הבית.
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => reset()}
          className="tactical-btn bg-moto text-carbon hover:bg-motoDark !px-5"
        >
          נסה שוב
        </button>
        <Link href="/" className="switch-btn text-ink px-4 py-2.5 text-sm font-bold">
          ⌂ לדף הבית
        </Link>
      </div>
    </main>
  );
}
