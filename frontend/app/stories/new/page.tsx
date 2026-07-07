"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { createStory } from "@/lib/api";
import { ISRAEL, ISRAEL_REGIONS, COUNTRIES } from "@/lib/locations";
import { VEHICLE_TYPE_LABELS, RIDE_STYLE_LABELS, DIFFICULTY_LABELS, SEASON_LABELS } from "@/lib/labels";

const MAX_PHOTOS = 10;

export default function NewStoryPage() {
  const { user, token, loading, login, register } = useAuth();

  if (loading) {
    return <div className="max-w-2xl mx-auto px-5 py-24 text-center text-textDim">טוען...</div>;
  }

  if (!user || !token) {
    return <AuthGate onLogin={login} onRegister={register} />;
  }

  return <StoryForm token={token} />;
}

function AuthGate({
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
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, displayName, acceptedDisclaimer);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-24">
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-2xl font-black mb-1">
        {mode === "login" ? "התחברות" : "הרשמה"}
      </h1>
      <p className="text-textDim mb-6 text-sm">כדי לשתף סיפור נסיעה, צריך קודם חשבון.</p>

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
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />

        {mode === "register" && (
          <label className="flex items-start gap-2.5 text-xs text-textDim leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedDisclaimer}
              onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
              required
              className="mt-0.5 w-5 h-5 shrink-0 accent-moto"
            />
            <span>
              האתר אינו אחראי על תוכן המסלולים, תנאי השטח, או חוקיות המעבר בהם. הרכיבה
              היא על אחריות הרוכב בלבד. יש לבדוק שטחי אש ואישורי מעבר מול הגורמים
              הרלוונטיים לפני היציאה לשטח.
            </span>
          </label>
        )}

        {error && <p className="text-moto text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy || (mode === "register" && !acceptedDisclaimer)}
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

const MIN_BODY_WORDS = 30;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function StoryForm({ token }: { token: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [vehicleType, setVehicleType] = useState("enduro_light");
  const [rideStyle, setRideStyle] = useState("technical_singles");
  const [difficulty, setDifficulty] = useState("moderate");
  const [season, setSeason] = useState("all_year");
  const [country, setCountry] = useState(ISRAEL);
  const [region, setRegion] = useState("");
  const [meetingLabel, setMeetingLabel] = useState("");
  const [meetingLat, setMeetingLat] = useState("");
  const [meetingLon, setMeetingLon] = useState("");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_PHOTOS) {
      setError(`אפשר להעלות עד ${MAX_PHOTOS} תמונות`);
      return;
    }
    setError(null);
    setPhotos(files);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setMeetingLat(String(pos.coords.latitude.toFixed(6)));
      setMeetingLon(String(pos.coords.longitude.toFixed(6)));
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!region.trim()) {
      setError(country === ISRAEL ? "יש לבחור אזור" : "יש לציין שם מקום");
      return;
    }

    const wordCount = countWords(body);
    if (wordCount < MIN_BODY_WORDS) {
      setError(`הסיפור קצר מדי - נדרשות לפחות ${MIN_BODY_WORDS} מילים (יש כרגע ${wordCount})`);
      return;
    }

    setBusy(true);
    try {
      const story = await createStory(
        {
          title,
          body,
          vehicle_type: vehicleType,
          ride_style: rideStyle,
          difficulty,
          season,
          country,
          region,
          meetingPointLabel: meetingLabel || undefined,
          meetingPointLat: meetingLat ? Number(meetingLat) : null,
          meetingPointLon: meetingLon ? Number(meetingLon) : null,
          gpxFile,
          photos,
        },
        token
      );
      router.push(`/stories/${story.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-3xl font-black mb-1">שתף סיפור נסיעה</h1>
      <p className="text-textDim mb-8 text-sm">
        קובץ GPX מומלץ מאוד - הוא זה שמפיק את המרחק, הטיפוס, ואת קו החתימה של הסיפור.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field label="כותרת">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            placeholder="לדוגמה: מכתש רמון בשקיעה"
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="הסיפור">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            placeholder="איך הייתה הרכיבה, מה כדאי לדעת לפני שיוצאים, אתגרים בדרך..."
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none resize-y"
          />
          <p
            className={`text-xs mt-1 ${
              countWords(body) >= MIN_BODY_WORDS ? "text-cyan" : "text-textDim"
            }`}
          >
            {countWords(body)} / {MIN_BODY_WORDS} מילים לפחות
          </p>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="סוג אופנוע">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="סגנון רכיבה">
            <select
              value={rideStyle}
              onChange={(e) => setRideStyle(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              {Object.entries(RIDE_STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="רמת קושי">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="עונה מומלצת">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            >
              {Object.entries(SEASON_LABELS).map(([key, label]) => (
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
                placeholder="עיר / אזור"
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              />
            )}
          </Field>
        </div>

        <div className="border border-edge p-4">
          <p className="text-xs font-bold text-textDim mb-3 tracking-wide">
            נקודת כינוס (לא חובה, אבל מייצרת כפתור ניווט ישיר ל-Waze/Google Maps בסיפור)
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={meetingLabel}
              onChange={(e) => setMeetingLabel(e.target.value)}
              placeholder="שם המקום - לדוגמה: חניון עין גדי"
              className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
            />
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={meetingLat}
                onChange={(e) => setMeetingLat(e.target.value)}
                placeholder="קו רוחב (lat)"
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none text-sm"
              />
              <input
                type="text"
                inputMode="decimal"
                value={meetingLon}
                onChange={(e) => setMeetingLon(e.target.value)}
                placeholder="קו אורך (lon)"
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none text-sm"
              />
              <button
                type="button"
                onClick={useMyLocation}
                className="col-span-2 sm:col-span-1 border border-edge px-3 py-2 sm:py-0 text-xs font-bold hover:border-moto whitespace-nowrap"
              >
                המיקום שלי
              </button>
            </div>
          </div>
        </div>

        <Field label="קובץ GPX (לא חובה, אבל ממש מומלץ)">
          <input
            type="file"
            accept=".gpx"
            onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </Field>

        <Field label={`תמונות (עד ${MAX_PHOTOS})`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotos}
            className="w-full text-sm"
          />
          {photos.length > 0 && (
            <p className="text-xs text-textDim mt-1">{photos.length} תמונות נבחרו</p>
          )}
        </Field>

        {error && <p className="text-moto text-sm">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50"
        >
          {busy ? "מעלה..." : "פרסם סיפור"}
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
