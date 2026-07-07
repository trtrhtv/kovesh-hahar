"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toggleLike } from "@/lib/api";

export default function LikeButton({
  storyId,
  initialCount,
}: {
  storyId: string;
  initialCount: number;
}) {
  const { token, user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!token) {
      window.location.href = "/stories/new"; // שער ההתחברות המשותף
      return;
    }
    setBusy(true);
    try {
      const res = await toggleLike(storyId, token);
      setLiked(res.liked);
      setCount((c) => c + (res.liked ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`border px-4 py-2 text-sm font-bold transition-colors ${
        liked ? "bg-oxide text-sand border-oxide" : "border-char/25 hover:border-oxide"
      }`}
    >
      {liked ? "אהבתי ✓" : "אהבתי"} · {count}
    </button>
  );
}
