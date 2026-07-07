"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toggleEventRSVP } from "@/lib/api";

export default function RSVPButton({
  eventId,
  initialAttending,
  initialCount,
}: {
  eventId: string;
  initialAttending: boolean;
  initialCount: number;
}) {
  const { token } = useAuth();
  const [attending, setAttending] = useState(initialAttending);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!token) {
      window.location.href = "/events/new";
      return;
    }
    setBusy(true);
    try {
      const res = await toggleEventRSVP(eventId, token);
      setAttending(res.attending);
      setCount((c) => c + (res.attending ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`tactical-btn disabled:opacity-50 ${
        attending ? "bg-emerald-600 text-carbon hover:bg-emerald-500" : "bg-moto text-carbon hover:bg-motoDark"
      }`}
    >
      {attending ? "✓ אני מגיע - 👥" : "אני מגיע 👥"} {count}
    </button>
  );
}
