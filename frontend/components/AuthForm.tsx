"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/lib/auth";

/**
 * טופס הזדהות אחיד - משמש גם את /login וגם את שערי ההעלאה (סיפור/אירוע).
 * מקור אמת יחיד: כל מקום מקבל את אותם שדות, את אותה כניסת גוגל, ואת אותה לוגיקה.
 * הצהרת האחריות מוצגת ונדרשת רק בהרשמה (במצב התחברות אין צ'קבוקס, גם לא לגוגל).
 * onSuccess נקרא רק אחרי login/register באימייל שהצליחו (גוגל מבצע reload בעצמו).
 */
export default function AuthForm({
  subtitle,
  onSuccess,
}: {
  subtitle?: string;
  onSuccess?: () => void;
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await register(email, password, displayName, accepted, phoneNumber, username);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">{isRegister ? "הרשמה" : "התחברות"}</h1>
      {subtitle && <p className="text-textDim mb-6 text-sm">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {isRegister && (
          <input
            type="text"
            placeholder="שם תצוגה"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        )}
        {isRegister && (
          <div>
            <input
              type="text"
              placeholder="שם משתמש (לא חובה - אנגלית בלבד)"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
            <p className="text-[11px] text-textDim mt-1">
              זה מה שתשתמש בו כדי להתחבר בפעם הבאה, בלי להקליד אימייל מלא
            </p>
          </div>
        )}
        <input
          type="text"
          placeholder={isRegister ? "אימייל" : "אימייל או שם משתמש"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          required
          minLength={isRegister ? 8 : undefined}
        />
        {!isRegister && (
          <Link href="/forgot-password" className="text-xs text-textDim hover:text-moto self-start">
            שכחת סיסמה?
          </Link>
        )}
        {isRegister && (
          <div>
            <input
              type="tel"
              placeholder="טלפון (לא חובה)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
            <p className="text-[11px] text-textDim mt-1">
              רק אם תרצה שרוכבים אחרים יוכלו לפנות אליך ב-WhatsApp מתוך הסיפורים שלך
            </p>
          </div>
        )}
        {isRegister && (
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
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy || (isRegister && !accepted)}
          className="tactical-btn bg-moto text-onAccent hover:bg-motoDark disabled:opacity-50"
        >
          {busy ? "רגע..." : isRegister ? "הרשם" : "התחבר"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(isRegister ? "login" : "register");
          setError(null);
        }}
        className="text-sm text-moto hover:underline mt-4"
      >
        {isRegister ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הרשם"}
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-edge" />
        <span className="text-xs text-textDim">או</span>
        <div className="flex-1 h-px bg-edge" />
      </div>

      {/* בהרשמה גוגל מושבת עד אישור ההצהרה; בהתחברות הוא פעיל מיד (משתמש חוזר) */}
      <GoogleSignInButton disabled={isRegister && !accepted} onError={setError} />
    </div>
  );
}
