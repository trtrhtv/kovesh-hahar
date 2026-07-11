"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import PageBackdrop from "@/components/PageBackdrop";
import PasswordInput from "@/components/PasswordInput";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-5 py-24 text-center text-textDim">טוען...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("הסיסמאות לא תואמות");
      return;
    }

    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageBackdrop>
      <main className="max-w-md mx-auto px-5 py-24">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <h1 className="text-2xl font-black mb-6">קביעת סיסמה חדשה</h1>

        {!token ? (
          <p className="text-moto">
            הקישור הזה לא תקין. תבקש קישור איפוס חדש{" "}
            <Link href="/forgot-password" className="underline">
              כאן
            </Link>
            .
          </p>
        ) : done ? (
          <p className="text-emerald-400">הסיסמה עודכנה בהצלחה! מעביר אותך להתחברות...</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <PasswordInput value={password} onChange={setPassword} placeholder="סיסמה חדשה" required minLength={8} />
            <PasswordInput value={confirm} onChange={setConfirm} placeholder="אימות סיסמה" required minLength={8} />
            {error && <p className="text-danger text-sm">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="tactical-btn bg-moto text-onAccent hover:bg-motoDark disabled:opacity-50"
            >
              {busy ? "מעדכן..." : "עדכן סיסמה"}
            </button>
          </form>
        )}
      </main>
    </PageBackdrop>
  );
}
