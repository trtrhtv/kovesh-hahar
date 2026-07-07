"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageBackdrop>
      <main className="max-w-md mx-auto px-5 py-24">
        <div className="mb-4">
          <BackNav />
        </div>
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <h1 className="text-2xl font-black mb-2">שכחת סיסמה</h1>
        <p className="text-textDim mb-6 text-sm">תזין את האימייל שנרשמת איתו, ונשלח קישור לאיפוס.</p>

        {done ? (
          <div className="moto-card p-4">
            <p className="text-ink">
              אם קיים חשבון עם המייל הזה - קישור לאיפוס סיסמה נשלח אליו. תבדוק גם בתיקיית ספאם.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="האימייל שלך"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
            {error && <p className="text-moto text-sm">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50"
            >
              {busy ? "שולח..." : "שלח קישור איפוס"}
            </button>
          </form>
        )}

        <Link href="/login" className="text-sm text-moto hover:underline mt-4 inline-block">
          חזרה להתחברות
        </Link>
      </main>
    </PageBackdrop>
  );
}
