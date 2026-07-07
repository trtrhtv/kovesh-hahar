"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { deleteStory, checkIsAdmin } from "@/lib/api";

export default function DeleteStoryButton({
  storyId,
  authorId,
}: {
  storyId: string;
  authorId: string;
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
  if (user.id !== authorId && !isAdmin) return null;

  async function handleDelete() {
    if (!token) return;
    setBusy(true);
    try {
      await deleteStory(storyId, token);
      router.push("/stories");
    } catch (err: any) {
      alert(err.message);
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-textDim hover:text-moto underline"
      >
        {isAdmin && user.id !== authorId ? "מחק סיפור (מנהל)" : "מחק את הסיפור שלי"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-textDim">בטוח שאתה רוצה למחוק לצמיתות?</span>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="text-moto font-bold hover:underline disabled:opacity-50"
      >
        {busy ? "מוחק..." : "כן, מחק"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-textDim hover:underline">
        ביטול
      </button>
    </div>
  );
}
