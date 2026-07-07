"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchComments, postComment, type Comment } from "@/lib/api";

export default function CommentsSection({ storyId }: { storyId: string }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments(storyId).then(setComments);
  }, [storyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const comment = await postComment(storyId, text.trim(), token);
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="font-bold text-sm tracking-wider text-char/60 mb-4">
        תגובות ({comments.length})
      </h2>

      <div className="flex flex-col gap-4 mb-6">
        {comments.map((c) => (
          <div key={c.id} className="border-b border-char/10 pb-4">
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="font-bold">{c.author.display_name}</span>
              <span className="text-char/40 text-xs">
                {new Date(c.created_at).toLocaleDateString("he-IL")}
              </span>
            </div>
            <p className="text-char/80 text-sm">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-char/50 text-sm">עדיין אין תגובות - היה הראשון להגיב.</p>
        )}
      </div>

      {token ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="הוסף תגובה..."
            maxLength={2000}
            className="flex-1 border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="bg-char text-sand px-4 py-2 text-sm font-bold hover:bg-oxide transition-colors disabled:opacity-50"
          >
            שלח
          </button>
        </form>
      ) : (
        <a href="/stories/new" className="text-oxide text-sm hover:underline">
          התחבר כדי להגיב
        </a>
      )}
      {error && <p className="text-oxide text-sm mt-2">{error}</p>}
    </div>
  );
}
