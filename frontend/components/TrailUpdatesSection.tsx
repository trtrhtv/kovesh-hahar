"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { fetchTrailUpdates, postTrailUpdate, type TrailUpdate } from "@/lib/api";
import { TRAIL_STATUS_LABELS, TRAIL_STATUS_COLORS } from "@/lib/labels";
import { spawnDustBurst } from "@/lib/effects";

const STATUS_OPTIONS = ["open", "blocked", "muddy", "unknown"];
const MAX_PHOTOS = 3;
const FRESH_DAYS = 7; // מעבר לזה עדכון נחשב "לא עדכני" (מוצג, לא נמחק)

function formatTerminalTimestamp(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("he-IL", { month: "2-digit", year: "numeric" });
  return `[${time}] [${date}]`;
}

function daysAgo(iso: string): number {
  const then = new Date(iso).setHours(0, 0, 0, 0);
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((now - then) / 86400000);
}

function relativeDays(iso: string): string {
  const d = daysAgo(iso);
  if (d <= 0) return "היום";
  if (d === 1) return "אתמול";
  return `לפני ${d} ימים`;
}

export default function TrailUpdatesSection({ storyId }: { storyId: string }) {
  const { token } = useAuth();
  const [updates, setUpdates] = useState<TrailUpdate[]>([]);
  const [status, setStatus] = useState("open");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchTrailUpdates(storyId).then(setUpdates);
  }, [storyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    spawnDustBurst(submitRef.current);
    setBusy(true);
    setError(null);
    try {
      const update = await postTrailUpdate(storyId, status, note.trim(), token, photos);
      setUpdates((prev) => [update, ...prev]);
      setNote("");
      setPhotos([]);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="moto-card p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-black text-sm tracking-widest text-ink flex items-center gap-2">
          <span className="live-dot" />
          COMMS // עדכוני שטח חיים
        </h2>
        {token && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="switch-btn text-sm font-bold text-moto px-4 py-2.5 min-h-[44px]"
          >
            {showForm ? "ביטול" : "+ עדכן מצב"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="flex flex-col gap-3 mb-4 bg-surfaceHi p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`switch-btn text-sm font-bold px-3 py-3 min-h-[44px] ${status === s ? "active" : ""}`}
                style={
                  status === s
                    ? { color: TRAIL_STATUS_COLORS[s], borderColor: TRAIL_STATUS_COLORS[s] }
                    : {}
                }
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
            className="border border-edge bg-surface px-3 py-2 text-sm focus:border-moto outline-none"
          />

          <label className="text-xs text-textDim flex flex-col gap-1.5">
            <span>תמונות מהשטח (לא חובה, עד {MAX_PHOTOS})</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, MAX_PHOTOS))}
              className="text-xs text-textDim file:bg-surface file:border file:border-edge file:text-ink file:text-xs file:font-bold file:px-3 file:py-2 file:me-2 file:cursor-pointer"
            />
            {photos.length > 0 && (
              <span className="text-[11px] text-moto">{photos.length} תמונות נבחרו</span>
            )}
          </label>

          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            ref={submitRef}
            type="submit"
            disabled={busy}
            className="btn-press moto-btn relative bg-moto text-onAccent py-3.5 min-h-[48px] text-base font-black hover:bg-motoDark transition-colors disabled:opacity-50 w-full sm:w-auto sm:self-start px-6"
          >
            {busy ? "שולח..." : "שלח דיווח סטטוס"}
          </button>
        </form>
      )}

      {/* טרמינל תקשורת - כל העדכונים, כולל האחרון */}
      <div className="comms-terminal p-3">
        {updates.length === 0 ? (
          <p className="text-textDim text-sm font-mono">// אין עדיין עדכוני שטח על המסלול הזה</p>
        ) : (
          <div className="flex flex-col gap-3">
            {updates.map((u) => {
              const stale = daysAgo(u.created_at) > FRESH_DAYS;
              return (
                <div key={u.id} className={stale ? "opacity-60" : ""}>
                  <div className="text-xs sm:text-sm font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-textDim shrink-0">{formatTerminalTimestamp(u.created_at)}</span>
                    <span
                      style={{ color: TRAIL_STATUS_COLORS[u.status] }}
                      className="font-bold shrink-0"
                    >
                      {TRAIL_STATUS_LABELS[u.status]}
                    </span>
                    {u.note && <span className="text-ink/80">- {u.note}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                    <span className="text-textDim">עודכן {relativeDays(u.created_at)}</span>
                    {stale && (
                      <span className="border border-textDim/60 text-textDim px-1.5 py-0.5 tracking-wide">
                        לא עדכני
                      </span>
                    )}
                  </div>
                  {u.photos && u.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.photos.map((p) => (
                        <a
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt="עדכון שטח"
                            loading="lazy"
                            className="w-16 h-16 object-cover border border-edge hover:border-moto transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!token && (
        <Link href="/login" className="text-moto text-sm hover:underline block mt-3">
          התחבר כדי לעדכן על מצב המסלול
        </Link>
      )}
    </div>
  );
}
