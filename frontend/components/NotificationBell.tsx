"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api";

const POLL_MS = 30000;

const TYPE_ICON: Record<string, string> = {
  comment: "💬",
  trail_update: "🔴",
  like: "❤️",
};

export default function NotificationBell() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const refreshCount = useCallback(() => {
    if (token) fetchUnreadCount(token).then(setCount);
  }, [token]);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, [refreshCount]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && token) {
      const list = await fetchNotifications(token);
      setNotifications(list);
    }
  }

  async function handleClickItem(n: Notification) {
    if (!token || n.is_read) return;
    await markNotificationRead(n.id, token);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    setCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setCount(0);
  }

  if (!token) return null;

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-label="התראות"
        className="relative w-10 h-10 flex items-center justify-center hover:text-moto transition-colors"
      >
        🔔
        {count > 0 && (
          <span className="absolute top-0.5 left-0.5 bg-moto text-carbon text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 moto-card w-80 max-w-[90vw] max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b border-edge">
            <span className="text-xs font-bold text-textDim tracking-wide">התראות</span>
            {count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-moto hover:underline">
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-textDim text-sm p-4 text-center">אין עדיין התראות.</p>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.story_id ? `/stories/${n.story_id}` : "#"}
                  onClick={() => handleClickItem(n)}
                  className={`flex items-start gap-2 px-3 py-3 border-b border-edge last:border-0 hover:bg-surfaceHi transition-colors ${
                    !n.is_read ? "bg-moto/5" : ""
                  }`}
                >
                  <span className="shrink-0">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-ink leading-snug">{n.message}</p>
                    <p className="text-[10px] text-textDim mt-1">
                      {new Date(n.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-moto shrink-0 mt-1.5" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
