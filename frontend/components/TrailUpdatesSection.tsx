"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchTrailUpdates, postTrailUpdate, type TrailUpdate } from "@/lib/api";
import { TRAIL_STATUS_LABELS, TRAIL_STATUS_COLORS } from "@/lib/labels";

const STATUS_OPTIONS = ["open", "blocked", "muddy", "unknown"];

export default function TrailUpdatesSection({ storyId }: { storyId: string }) {
  const { token } = useAuth();
  const [updates, setUpdates] = useState<TrailUpdate[]>([]);
  const [status, setStatus] = useState("open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTrailUpdates(storyId).then(setUpdates);
  }, [storyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const update = await postTrailUpdate(storyId, status, note.trim(), token);
      setUpdates((prev) => [update, ...prev]);
      setNote("");
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const latest = updates[0];

  return (
    <div className="border-2 border-char/20 p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-bold text-sm tracking-wider text-char/60">עדכוני שטח</h2>
        {token && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-sm font-bold text-oxide border-2 border-oxide px-4 py-2.5 min-h-[44px] hover:bg-oxide hover:text-sand active:bg-oxide active:text-sand transition-colors"
          >
            {showForm ? "ביטול" : "+ עדכן מצב"}
          </button>
        )}
      </div>

      {latest && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className="difficulty-stamp text-xs font-bold px-2 py-0.5"
            style={{ color: TRAIL_STATUS_COLORS[latest.status] }}
          >
            {TRAIL_STATUS_LABELS[latest.status] || latest.status}
          </span>
          <span className="text-xs text-char/50">
            עודכן {new Date(latest.created_at).toLocaleDateString("he-IL")}
          </span>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="flex flex-col gap-3 mb-4 bg-sandDark/40 p-3">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`text-sm font-bold px-4 py-3 min-h-[44px] border-2 transition-colors ${
                  status === s
                    ? "text-sand"
                    : "border-char/25 hover:border-oxide"
                }`}
                style={status === s ? { backgroundColor: TRAIL_STATUS_COLORS[s], borderColor: TRAIL_STATUS_COLORS[s] } : {}}
              >
                {TRAIL_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="פרטים נוספים (לא חובה) - למשל 'קריסה אחרי הגשם'"
            maxLength={500}
            className="border border-char/25 bg-sand px-3 py-2 text-sm focus:border-oxide outline-none"
          />
          {error && <p className="text-oxide text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-char text-sand py-3.5 min-h-[48px] text-base font-bold hover:bg-oxide transition-colors disabled:opacity-50 w-full sm:w-auto sm:self-start px-6"
          >
            {busy ? "שולח..." : "פרסם עדכון"}
          </button>
        </form>
      )}

      {updates.length > 1 && (
        <div className="flex flex-col gap-2 mt-2">
          {updates.slice(1, 5).map((u) => (
            <div key={u.id} className="text-xs text-char/60 flex items-center gap-2">
              <span style={{ color: TRAIL_STATUS_COLORS[u.status] }} className="font-bold">
                {TRAIL_STATUS_LABELS[u.status]}
              </span>
              <span>{u.note}</span>
              <span className="text-char/40">
                · {new Date(u.created_at).toLocaleDateString("he-IL")}
              </span>
            </div>
          ))}
        </div>
      )}

      {updates.length === 0 && (
        <p className="text-char/50 text-sm">עדיין אין עדכוני שטח על המסלול הזה.</p>
      )}

      {!token && (
        <a href="/stories/new" className="text-oxide text-sm hover:underline block mt-2">
          התחבר כדי לעדכן על מצב המסלול
        </a>
      )}
    </div>
  );
}
