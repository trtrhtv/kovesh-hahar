"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import { useAuth } from "@/lib/auth";
import { fetchStory, updateStory, checkIsAdmin, type StoryDetail } from "@/lib/api";
import { ISRAEL, ISRAEL_REGIONS, COUNTRIES } from "@/lib/locations";
import {
  VEHICLE_TYPE_LABELS,
  RIDE_STYLE_LABELS,
  DIFFICULTY_LABELS,
  SEASON_LABELS,
  PARKING_SECURITY_LABELS,
} from "@/lib/labels";

const MIN_BODY_WORDS = 30;
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EditStoryPage() {
  const params = useParams();
  const storyId = params.id as string;
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetchStory(storyId).then(setStory);
  }, [storyId]);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    checkIsAdmin(token).then((result) => {
      setIsAdmin(result);
      setChecking(false);
    });
  }, [token]);

  if (authLoading || checking || !story) {
    return <div className="max-w-2xl mx-auto px-5 py-24 text-center text-textDim">טוען...</div>;
  }

  const canEdit = user && (user.id === story.author.id || isAdmin);

  if (!canEdit) {
    return (
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <p className="text-textDim">אין לך הרשאה לערוך את הסיפור הזה.</p>
      </main>
    );
  }

  return (
    <PageBackdrop>
      <EditForm story={story} token={token!} onDone={() => router.push(`/stories/${storyId}`)} />
    </PageBackdrop>
  );
}

function EditForm({
  story,
  token,
  onDone,
}: {
  story: StoryDetail;
  token: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(story.title);
  const [body, setBody] = useState(story.body);
  const [vehicleType, setVehicleType] = useState(story.vehicle_type);
  const [vehicleTypeOther, setVehicleTypeOther] = useState(story.vehicle_type_other || "");
  const [rideStyle, setRideStyle] = useState(story.ride_style);
  const [difficulty, setDifficulty] = useState(story.difficulty);
  const [season, setSeason] = useState(story.season);
  const [country, setCountry] = useState(story.country);
  const [region, setRegion] = useState(story.region);
  const [meetingLabel, setMeetingLabel] = useState(story.meeting_point_label || "");
  const [parkingSecurity, setParkingSecurity] = useState(story.parking_security || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function validate(): string | null {
    if (!region.trim()) {
      return country === ISRAEL ? "יש לבחור אזור" : "יש לציין שם מקום";
    }
    if (vehicleType === "other" && !vehicleTypeOther.trim()) {
      return "יש לפרט את סוג האופנוע";
    }
    const wordCount = countWords(body);
    if (wordCount < MIN_BODY_WORDS) {
      return `הסיפור קצר מדי - נדרשות לפחות ${MIN_BODY_WORDS} מילים (יש כרגע ${wordCount})`;
    }
    return null;
  }

  function requestSave(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function confirmSave() {
    setBusy(true);
    try {
      await updateStory(
        story.id,
        {
          title,
          body,
          vehicle_type: vehicleType,
          vehicle_type_other: vehicleType === "other" ? vehicleTypeOther : undefined,
          ride_style: rideStyle,
          difficulty,
          season,
          country,
          region,
          meeting_point_label: meetingLabel || undefined,
          parking_security: parkingSecurity || undefined,
        },
        token
      );
      onDone();
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
      <h1 className="text-3xl font-black mb-1">עריכת סיפור</h1>
      <p className="text-textDim mb-8 text-sm">
        לא ניתן לשנות כאן תמונות או קובץ GPX בשלב הזה - רק את פרטי הסיפור.
      </p>

      <form onSubmit={requestSave} className="flex flex-col gap-5">
        <Field label="כותרת">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="הסיפור">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none resize-y"
          />
          <p className={`text-xs mt-1 ${countWords(body) >= MIN_BODY_WORDS ? "text-emerald-400" : "text-textDim"}`}>
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
            {vehicleType === "other" && (
              <input
                type="text"
                value={vehicleTypeOther}
                onChange={(e) => setVehicleTypeOther(e.target.value)}
                placeholder="איזה סוג אופנוע?"
                maxLength={60}
                className="w-full border border-edge bg-surface px-3 py-2.5 mt-2 focus:border-moto outline-none text-sm"
              />
            )}
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
                className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
              />
            )}
          </Field>
        </div>

        <Field label="נקודת כינוס (שם בלבד - קואורדינטות לא ניתנות לעריכה כאן)">
          <input
            type="text"
            value={meetingLabel}
            onChange={(e) => setMeetingLabel(e.target.value)}
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          />
        </Field>

        <Field label="מצב החניה באזור">
          <select
            value={parkingSecurity}
            onChange={(e) => setParkingSecurity(e.target.value)}
            className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
          >
            <option value="">לא ידוע / לא רלוונטי</option>
            {Object.entries(PARKING_SECURITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-moto text-sm">{error}</p>}

        {!confirming ? (
          <button
            type="submit"
            className="tactical-btn bg-moto text-carbon hover:bg-motoDark"
          >
            שמור שינויים
          </button>
        ) : (
          <div className="moto-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <span className="text-sm text-ink font-bold">
              לשמור את השינויים? זה יעדכן את הסיפור המפורסם.
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={confirmSave}
                disabled={busy}
                className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50 !py-2.5 !px-5"
              >
                {busy ? "שומר..." : "כן, שמור"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="switch-btn text-ink text-sm font-bold px-5 py-2.5"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
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
