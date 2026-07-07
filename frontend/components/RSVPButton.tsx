"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { setEventRSVP, cancelEventRSVP } from "@/lib/api";

export default function RSVPButton({
  eventId,
  initialAttending,
  initialCount,
  initialGuestCount,
}: {
  eventId: string;
  initialAttending: boolean;
  initialCount: number;
  initialGuestCount: number;
}) {
  const { token } = useAuth();
  const [attending, setAttending] = useState(initialAttending);
  const [count, setCount] = useState(initialCount);
  const [myGuests, setMyGuests] = useState(initialGuestCount || 1);
  const [savedGuests, setSavedGuests] = useState(initialGuestCount || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetRSVP() {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await setEventRSVP(eventId, token, myGuests);
      setCount((c) => c - savedGuests + res.guest_count);
      setSavedGuests(res.guest_count);
      setAttending(true);
    } catch (err: any) {
      setError(err.message || "הפעולה נכשלה - נסה שוב");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await cancelEventRSVP(eventId, token);
      setCount((c) => Math.max(0, c - savedGuests));
      setSavedGuests(0);
      setAttending(false);
    } catch (err: any) {
      setError(err.message || "הביטול נכשל - נסה שוב");
    } finally {
      setBusy(false);
    }
  }

  const changed = attending && myGuests !== savedGuests;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-textDim">
          כמה מגיעים:
          <select
            value={myGuests}
            onChange={(e) => setMyGuests(Number(e.target.value))}
            className="border border-edge bg-surface px-2 py-1.5 focus:border-moto outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleSetRSVP}
          disabled={busy || (attending && !changed)}
          className={`tactical-btn disabled:opacity-50 ${
            attending ? "bg-emerald-600 text-carbon hover:bg-emerald-500" : "bg-moto text-carbon hover:bg-motoDark"
          }`}
        >
          {attending
            ? changed
              ? `עדכן ל-${myGuests} 👥`
              : `✓ אני מגיע (${savedGuests}) - 👥`
            : "אני מגיע 👥"}{" "}
          {count}
        </button>

        {attending && (
          <button
            onClick={handleCancel}
            disabled={busy}
            className="text-xs text-textDim hover:text-moto underline disabled:opacity-50"
          >
            ביטול הגעה
          </button>
        )}
      </div>
      {error && <p className="text-moto text-xs">{error}</p>}
    </div>
  );
}
