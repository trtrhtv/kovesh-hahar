"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toggleEventRSVP } from "@/lib/api";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (attending) {
        await toggleEventRSVP(eventId, token);
        setAttending(false);
        setCount((c) => Math.max(0, c - myGuests));
      } else {
        const res = await toggleEventRSVP(eventId, token, myGuests);
        setAttending(true);
        setCount((c) => c + res.guest_count);
      }
    } catch (err: any) {
      setError(err.message || "הפעולה נכשלה - נסה שוב");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {!attending && (
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
        )}
        <button
          onClick={handleClick}
          disabled={busy}
          className={`tactical-btn disabled:opacity-50 ${
            attending ? "bg-emerald-600 text-carbon hover:bg-emerald-500" : "bg-moto text-carbon hover:bg-motoDark"
          }`}
        >
          {attending ? `✓ אני מגיע (${myGuests}) - 👥` : "אני מגיע 👥"} {count}
        </button>
      </div>
      {error && <p className="text-moto text-xs">{error}</p>}
    </div>
  );
}
