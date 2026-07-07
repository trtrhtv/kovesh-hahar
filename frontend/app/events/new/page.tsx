"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/lib/auth";
import { createEvent } from "@/lib/api";
import { ISRAEL, ISRAEL_REGIONS, COUNTRIES } from "@/lib/locations";
import { VEHICLE_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";

export default function NewEventPage() {
  const { user, token, loading, login, register } = useAuth();

  return (
    <PageBackdrop>
      {loading ? (
        <div className="max-w-2xl mx-auto px-5 py-24 text-center text-textDim">טוען...</div>
      ) : !user || !token ? (
        <QuickAuthGate onLogin={login} onRegister={register} />
      ) : (
        <EventForm token={token} />
      )}
    </PageBackdrop>
  );
}

function QuickAuthGate({
  onLogin,
  onRegister,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    email: string,
    password: string,
    displayName: string,
    acceptedDisclaimer: boolean
  ) => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await onLogin(email, password);
      else await onRegister(email, password, displayName, accepted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-24">
      <div className="mb-4">
        <BackNav />
      </div>
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-2xl font-black mb-6">כדי לארגן אירוע, צריך קודם חשבון</h1>
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
        <input
          type="text"
          placeholder={mode === "login" ? "אימייל או שם משתמש" : "אימייל"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />
        <PasswordInput value={password} onChange={setPassword} required />
        {mode === "register" && (
          <label className="flex items-start gap-2.5 text-xs text-textDim leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
              className="mt-0.5 w-5 h-5 shrink-0 accent-moto"
            />
            <span>מאשר/ת את הצהרת האחריות של האתר.</span>
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
  );
}

function EventForm({ token }: { token: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [country, setCountry] = useState(ISRAEL);
  const [region, setRegion] = useState("");
  const [meetingLabel, setMeetingLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!eventDate) {
      setError("יש לבחור תאריך ושעה");
      return;
    }
    if (!region.trim()) {
      setError(country === ISRAEL ? "יש לבחור אזור" : "יש לציין שם מקום");
      return;
    }
    if (description.trim().length < 10) {
      setError("התיאור קצר מדי");
      return;
    }

    setBusy(true);
    try {
      const event = await createEvent(
        {
          title,
          description,
          event_date: new Date(eventDate).toISOString(),
          vehicle_type: vehicleType || undefined,
          difficulty: difficulty || undefined,
          country,
          region,
          meeting_point_label: meetingLabel || undefined,
        },
        token
      );
      router.push(`/events/${event.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <div className="mb-4">
        <BackNav />
      </div>
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-3xl font-black mb-1">ארגון אירוע רכיבה</h1>
      <p className="text-textDim mb-8 text-sm">כמו "יוצאים לרמת הנגב בשבת" - שאחרים ידעו ויצטרפו.</p>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="כותרת">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="לדוגמה: רכיבת בוקר במכתש רמון"
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="תאריך ושעה">
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="תיאור">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="פרטים על הרכיבה - קצב, מסלול משוער, מה להביא..."
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="סוג אופנוע (לא חובה)">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              <option value="">כל סוג</option>
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="רמת קושי (לא חובה)">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              <option value="">כל רמה</option>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="מדינה">
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setRegion("");
              }}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label={country === ISRAEL ? "אזור" : "שם מקום"}>
            {country === ISRAEL ? (
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              >
                <option value="">בחר אזור...</option>
                {ISRAEL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              />
            )}
          </Field>
        </div>

        <Field label="נקודת כינוס (לא חובה)">
          <input
            type="text"
            value={meetingLabel}
            onChange={(e) => setMeetingLabel(e.target.value)}
            placeholder="לדוגמה: חניון מכתש רמון, 08:00"
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        {error && <p className="text-moto text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50"
        >
          {busy ? "מפרסם..." : "פרסם אירוע"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-textDim mb-1.5 tracking-wide">{label}</span>
      {children}
    </label>
  );
}
