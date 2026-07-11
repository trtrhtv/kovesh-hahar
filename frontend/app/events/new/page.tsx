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
import { VEHICLE_TYPE_LABELS, DIFFICULTY_LABELS, TIME_PERIOD_LABELS, TIME_PERIOD_HOURS } from "@/lib/labels";

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
        {mode === "login" && (
          <Link href="/forgot-password" className="text-xs text-textDim hover:text-moto self-start">
            שכחת סיסמה?
          </Link>
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
            <span>מאשר/ת את הצהרת האחריות של האתר.</span>
          </label>
        )}
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="tactical-btn bg-moto text-onAccent hover:bg-motoDark disabled:opacity-50"
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
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDateOnly, setEventDateOnly] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [timeMode, setTimeMode] = useState<"exact" | "approximate">("exact");
  const [approxPeriod, setApproxPeriod] = useState("morning");
  const [vehicleType, setVehicleType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [country, setCountry] = useState(ISRAEL);
  const [region, setRegion] = useState("");
  const [meetingLabel, setMeetingLabel] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!eventDateOnly) {
      setError("יש לבחור תאריך");
      return;
    }
    if (multiDay && !endDate) {
      setError("יש לבחור תאריך סיום לטיול");
      return;
    }
    if (!region.trim()) {
      setError(country === ISRAEL ? "יש לבחור אזור" : "יש לציין שם מקום");
      return;
    }
    if (description.trim().split(/\s+/).filter(Boolean).length < 3) {
      setError("התיאור קצר מדי");
      return;
    }
    if (!meetingLabel.trim()) {
      setError("יש לציין נקודת כינוס - זה מה שמאפשר לאנשים בכלל להגיע");
      return;
    }
    if (!contactPhone.trim()) {
      setError("יש לציין טלפון ליצירת קשר - כדי שמי שבא יוכל לתאם איתך");
      return;
    }

    const timeToUse = timeMode === "exact" ? eventTime : TIME_PERIOD_HOURS[approxPeriod];

    setBusy(true);
    try {
      const event = await createEvent(
        {
          title,
          description,
          event_date: new Date(`${eventDateOnly}T${timeToUse}`).toISOString(),
          end_date: multiDay && endDate ? new Date(`${endDate}T23:59`).toISOString() : undefined,
          time_is_approximate: timeMode === "approximate",
          approximate_period: timeMode === "approximate" ? approxPeriod : undefined,
          vehicle_type: vehicleType || undefined,
          difficulty: difficulty || undefined,
          country,
          region,
          meeting_point_label: meetingLabel,
          contact_phone: contactPhone,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={multiDay ? "תאריך התחלה" : "תאריך"}>
            <input
              type="date"
              value={eventDateOnly}
              onChange={(e) => setEventDateOnly(e.target.value)}
              required
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
          </Field>

          <Field label="שעה">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTimeMode("exact")}
                className={`switch-btn text-xs font-bold px-3 py-2 flex-1 ${timeMode === "exact" ? "active text-moto" : "text-ink"}`}
              >
                שעה מדויקת
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("approximate")}
                className={`switch-btn text-xs font-bold px-3 py-2 flex-1 ${timeMode === "approximate" ? "active text-moto" : "text-ink"}`}
              >
                זמן כללי
              </button>
            </div>
            {timeMode === "exact" ? (
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              />
            ) : (
              <select
                value={approxPeriod}
                onChange={(e) => setApproxPeriod(e.target.value)}
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              >
                {Object.entries(TIME_PERIOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={multiDay}
            onChange={(e) => setMultiDay(e.target.checked)}
            className="w-5 h-5 accent-moto"
          />
          זה טיול של כמה ימים
        </label>

        {multiDay && (
          <Field label="תאריך סיום">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={eventDateOnly}
              required
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
          </Field>
        )}

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

        <Field label="נקודת כינוס">
          <input
            type="text"
            value={meetingLabel}
            onChange={(e) => setMeetingLabel(e.target.value)}
            required
            placeholder="לדוגמה: חניון מכתש רמון, 08:00"
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="טלפון ליצירת קשר">
          <div className="flex gap-2">
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              placeholder="050-1234567"
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
            {user?.phone_number && !contactPhone && (
              <button
                type="button"
                onClick={() => setContactPhone(user.phone_number!)}
                className="switch-btn text-xs font-bold text-ink px-3 whitespace-nowrap"
              >
                מהפרופיל שלי
              </button>
            )}
          </div>
          <p className="text-[11px] text-textDim mt-1">
            כדי שמי שבא לאירוע יוכל לתאם איתך ישירות ב-WhatsApp - לא חייב להיות אותו מספר שבפרופיל שלך
          </p>
        </Field>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="tactical-btn bg-moto text-onAccent hover:bg-motoDark disabled:opacity-50"
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
