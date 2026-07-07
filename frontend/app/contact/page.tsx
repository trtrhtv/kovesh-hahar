"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { sendContactMessage } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendContactMessage(name, email, message);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-5 py-12">
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>

      {sent ? (
        <div className="border border-edge p-8 text-center">
          <h1 className="text-2xl font-black mb-2">ההודעה נשלחה</h1>
          <p className="text-textDim">תודה שפנית - נחזור אליך בהקדם.</p>
          <Link href="/" className="text-moto font-bold hover:underline mt-4 inline-block">
            חזרה לעמוד הבית ←
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-black mb-1">צור קשר</h1>
          <p className="text-textDim mb-8 text-sm">
            שאלה, הצעה, דיווח על בעיה, או כל דבר אחר - נשמח לשמוע.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="שם"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border border-edge bg-surface px-3 py-3 min-h-[48px] focus:border-moto outline-none"
            />
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-edge bg-surface px-3 py-3 min-h-[48px] focus:border-moto outline-none"
            />
            <textarea
              placeholder="ההודעה שלך"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              minLength={10}
              className="border border-edge bg-surface px-3 py-3 focus:border-moto outline-none resize-y"
            />

            {error && <p className="text-moto text-sm">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="moto-btn bg-moto text-carbon py-3.5 min-h-[48px] text-base font-bold hover:bg-motoDark transition-colors disabled:opacity-50"
            >
              {busy ? "שולח..." : "שלח הודעה"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
