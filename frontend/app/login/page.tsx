"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <p className="text-textDim mb-4">אתה כבר מחובר בתור {user.display_name}.</p>
        <Link href="/" className="text-moto font-bold hover:underline">
          למסך הראשי ←
        </Link>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName, accepted, phoneNumber, username);
      }
      router.push("/");
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
        <h1 className="text-2xl font-black mb-6">{mode === "login" ? "התחברות" : "הרשמה"}</h1>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "register" && (
            <input
              type="text"
              placeholder="שם תצוגה"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
          )}
          {mode === "register" && (
            <input
              type="text"
              placeholder="שם משתמש (לא חובה - אנגלית בלבד)"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
          )}
          <input
            type="text"
            placeholder={mode === "login" ? "אימייל או שם משתמש" : "אימייל"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
          <PasswordInput value={password} onChange={setPassword} required minLength={mode === "register" ? 8 : undefined} />
          {mode === "register" && (
            <input
              type="tel"
              placeholder="טלפון (לא חובה)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
          )}
          {mode === "register" && (
            <label className="flex items-start gap-2.5 text-xs text-textDim leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                required
                className="mt-0.5 w-5 h-5 shrink-0 accent-moto"
              />
              <span>
                האתר אינו אחראי על תוכן המסלולים, תנאי השטח, או חוקיות המעבר בהם. הרכיבה היא על
                אחריות הרוכב בלבד.
              </span>
            </label>
          )}
          {error && <p className="text-moto text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50"
          >
            {busy ? "רגע..." : mode === "login" ? "התחבר" : "הרשם"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-sm text-moto hover:underline mt-4"
        >
          {mode === "login" ? "אין לך חשבון? הרשם" : "כבר יש לך חשבון? התחבר"}
        </button>
      </main>
    </PageBackdrop>
  );
}
