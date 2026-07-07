"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import { useAuth } from "@/lib/auth";
import { updateProfile, addBike, deleteBike } from "@/lib/api";
import { VEHICLE_TYPE_LABELS } from "@/lib/labels";
import { ISRAEL_REGIONS } from "@/lib/locations";

export default function SettingsPage() {
  const { user, token, loading, refreshUser } = useAuth();

  if (loading) {
    return <div className="max-w-2xl mx-auto px-5 py-24 text-center text-textDim">טוען...</div>;
  }

  if (!user || !token) {
    return (
      <main className="max-w-md mx-auto px-5 py-24 text-center">
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <p className="text-textDim mb-4">צריך להתחבר כדי לערוך פרופיל.</p>
        <Link href="/stories/new" className="text-moto font-bold hover:underline">
          להתחברות ←
        </Link>
      </main>
    );
  }

  return (
    <PageBackdrop>
      <main className="max-w-2xl mx-auto px-5 py-12">
        <div className="mb-4">
          <BackNav />
        </div>
        <Link href="/" className="block mb-8">
          <Logo />
        </Link>
        <h1 className="text-3xl font-black mb-8">הגדרות פרופיל</h1>

        <ProfileForm token={token} user={user} onSaved={refreshUser} />

        <div className="contour-divider my-8" />

        <BikesSection token={token} bikes={user.bikes || []} onChanged={refreshUser} />
      </main>
    </PageBackdrop>
  );
}

function ProfileForm({ token, user, onSaved }: { token: string; user: any; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [homeRegion, setHomeRegion] = useState(user.home_region || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notifications_enabled !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateProfile(
        { display_name: displayName, phone_number: phoneNumber, home_region: homeRegion, notifications_enabled: notificationsEnabled },
        token
      );
      await onSaved();
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="moto-card p-5 flex flex-col gap-4">
      <h2 className="font-bold text-sm tracking-wider text-textDim">פרטים אישיים</h2>

      <label className="block">
        <span className="block text-xs font-bold text-textDim mb-1.5">שם תצוגה</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-bold text-textDim mb-1.5">
          טלפון (לצורך יצירת קשר ב-WhatsApp - לא חובה)
        </span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="050-1234567"
          className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-bold text-textDim mb-1.5">אזור מגורים (לא חובה)</span>
        <select
          value={homeRegion}
          onChange={(e) => setHomeRegion(e.target.value)}
          className="w-full border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none"
        >
          <option value="">לא צוין</option>
          {ISRAEL_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => setNotificationsEnabled(e.target.checked)}
          className="w-5 h-5 accent-moto"
        />
        <span className="text-sm text-ink">קבל התראות (תגובות, לייקים, עדכוני שטח)</span>
      </label>

      {error && <p className="text-moto text-sm">{error}</p>}
      {saved && <p className="text-emerald-400 text-sm">נשמר בהצלחה</p>}

      <button
        type="submit"
        disabled={busy}
        className="tactical-btn bg-moto text-carbon hover:bg-motoDark disabled:opacity-50 self-start"
      >
        {busy ? "שומר..." : "שמור שינויים"}
      </button>
    </form>
  );
}

function BikesSection({
  token,
  bikes,
  onChanged,
}: {
  token: string;
  bikes: { id: string; model_name: string; vehicle_type?: string }[];
  onChanged: () => void;
}) {
  const [modelName, setModelName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!modelName.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await addBike(modelName.trim(), vehicleType || undefined, token);
      setModelName("");
      setVehicleType("");
      await onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(bikeId: string) {
    await deleteBike(bikeId, token);
    await onChanged();
  }

  return (
    <div className="moto-card p-5">
      <h2 className="font-bold text-sm tracking-wider text-textDim mb-1">
        האופנועים שלי
      </h2>
      <p className="text-xs text-textDim mb-4">
        רוכבים על כמה כלים? תוסיף את כולם - זה יוצג בפרופיל הציבורי שלך.
      </p>

      {bikes.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {bikes.map((bike) => (
            <div
              key={bike.id}
              className="flex items-center justify-between border border-edge px-3 py-2.5"
            >
              <div className="text-sm">
                <span className="font-bold text-ink">{bike.model_name}</span>
                {bike.vehicle_type && (
                  <span className="text-textDim">
                    {" "}
                    · {VEHICLE_TYPE_LABELS[bike.vehicle_type] || bike.vehicle_type}
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(bike.id)}
                className="text-xs text-moto hover:underline"
              >
                הסר
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="text"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="דגם - לדוגמה KTM 500 EXC-F"
          maxLength={60}
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none text-sm"
        />
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="border border-edge bg-surface px-3 py-2.5 focus:border-moto outline-none text-sm"
        >
          <option value="">סוג (לא חובה)</option>
          {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !modelName.trim()}
          className="switch-btn text-sm font-bold text-ink px-4 py-2.5 disabled:opacity-50"
        >
          + הוסף
        </button>
      </form>
      {error && <p className="text-moto text-sm mt-2">{error}</p>}
    </div>
  );
}
