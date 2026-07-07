"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { deleteEvent, checkIsAdmin } from "@/lib/api";

export default function DeleteEventButton({
  eventId,
  organizerId,
}: {
  eventId: string;
  organizerId: string;
}) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (token) checkIsAdmin(token).then(setIsAdmin);
  }, [token]);

  if (!user || !token) return null;
  if (user.id !== organizerId && !isAdmin) return null;

  async function handleDelete() {
    if (!token) return;
    setBusy(true);
    try {
      await deleteEvent(eventId, token);
      router.push("/events");
    } catch (err: any) {
      alert(err.message);
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-xs text-textDim hover:text-moto underline">
        {isAdmin && user.id !== organizerId ? "בטל אירוע (מנהל)" : "בטל את האירוע שלי"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-textDim">בטוח שאתה רוצה לבטל את האירוע?</span>
      <button onClick={handleDelete} disabled={busy} className="text-moto font-bold hover:underline disabled:opacity-50">
        {busy ? "מבטל..." : "כן, בטל"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-textDim hover:underline">
        לא
      </button>
    </div>
  );
}
