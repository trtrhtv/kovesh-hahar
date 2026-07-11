"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { voteStory } from "@/lib/api";

export default function LikeButton({
  storyId,
  initialCount,
  initialMyVote = 0,
}: {
  storyId: string;
  initialCount: number;
  initialMyVote?: number;
}) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialCount);
  const [myVote, setMyVote] = useState(initialMyVote);
  const [busy, setBusy] = useState(false);

  async function handleVote(value: 1 | -1) {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    try {
      const res = await voteStory(storyId, value);
      setScore((s) => s - myVote + res.my_vote);
      setMyVote(res.my_vote);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center border-2 border-edge">
      <button
        onClick={() => handleVote(1)}
        disabled={busy}
        className={`px-3 py-2.5 min-h-[44px] font-bold transition-colors ${
          myVote === 1 ? "bg-moto text-onAccent" : "hover:bg-surfaceHi"
        }`}
        aria-label="בעד"
      >
        ▲
      </button>
      <span className="px-3 font-black text-lg min-w-[2.5ch] text-center">{score}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={busy}
        className={`px-3 py-2.5 min-h-[44px] font-bold transition-colors ${
          myVote === -1 ? "bg-textDim text-carbon" : "hover:bg-surfaceHi"
        }`}
        aria-label="נגד"
      >
        ▼
      </button>
    </div>
  );
}
