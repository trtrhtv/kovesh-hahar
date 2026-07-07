"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import StoryCard from "@/components/StoryCard";
import { fetchNearbyStories } from "@/lib/api";
import type { StoryListItem } from "@/lib/api";

export default function NearbyStoriesPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [radiusKm, setRadiusKm] = useState(50);

  function search(radius: number) {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("הדפדפן הזה לא תומך באיתור מיקום");
      return;
    }
    setStatus("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const results = await fetchNearbyStories(pos.coords.latitude, pos.coords.longitude, radius);
        setStories(results);
        setStatus("done");
      },
      () => {
        setStatus("error");
        setError("לא הצלחנו לאתר את המיקום שלך - ודא שנתת הרשאת מיקום לדפדפן");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <div className="mb-4">
        <BackNav />
      </div>
      <Link href="/" className="block mb-8">
        <Logo />
      </Link>
      <h1 className="text-3xl font-black mb-1">מסלולים בקרבתי</h1>
      <p className="text-textDim mb-8 text-sm">
        מאתר את המיקום שלך ומראה סיפורים עם נקודת כינוס קרובה, ממוין מהקרוב לרחוק.
      </p>

      {status === "idle" && (
        <div className="moto-card p-6 flex flex-col sm:flex-row items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            רדיוס חיפוש:
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="border border-edge bg-surface px-2 py-1.5 focus:border-moto outline-none"
            >
              <option value={20}>20 ק"מ</option>
              <option value={50}>50 ק"מ</option>
              <option value={100}>100 ק"מ</option>
              <option value={300}>הכל</option>
            </select>
          </label>
          <button
            onClick={() => search(radiusKm)}
            className="tactical-btn bg-moto text-carbon hover:bg-motoDark"
          >
            📍 אתר את המיקום שלי וחפש
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="rpm-loader" />
          <p className="text-textDim text-sm">מאתר מיקום ומחפש מסלולים...</p>
        </div>
      )}

      {status === "error" && (
        <div className="moto-card p-6 text-center">
          <p className="text-moto mb-4">{error}</p>
          <button onClick={() => setStatus("idle")} className="switch-btn text-ink text-sm font-bold px-4 py-2.5">
            נסה שוב
          </button>
        </div>
      )}

      {status === "done" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-textDim text-sm">{stories.length} מסלולים נמצאו ברדיוס {radiusKm} ק"מ</p>
            <button onClick={() => setStatus("idle")} className="text-moto text-sm hover:underline">
              חפש שוב
            </button>
          </div>
          {stories.length === 0 ? (
            <div className="border border-dashed border-edge p-12 text-center text-textDim">
              לא נמצאו מסלולים באזור הזה. נסה רדיוס גדול יותר.
            </div>
          ) : (
            <div className="grid gap-4">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
