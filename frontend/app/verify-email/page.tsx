"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PageBackdrop from "@/components/PageBackdrop";
import { verifyEmail } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-5 py-24 text-center text-textDim">טוען...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("קישור לא תקין");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        refreshUser();
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <PageBackdrop>
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>

        {status === "loading" && <p className="text-textDim">מאמת...</p>}
        {status === "success" && (
          <div>
            <p className="text-emerald-400 text-lg font-bold mb-4">✓ האימייל אומת בהצלחה!</p>
            <Link href="/" className="text-moto hover:underline">
              למסך הראשי ←
            </Link>
          </div>
        )}
        {status === "error" && (
          <div>
            <p className="text-moto mb-4">{error}</p>
            <Link href="/settings" className="text-moto hover:underline">
              אפשר לבקש קישור חדש מההגדרות ←
            </Link>
          </div>
        )}
      </main>
    </PageBackdrop>
  );
}
