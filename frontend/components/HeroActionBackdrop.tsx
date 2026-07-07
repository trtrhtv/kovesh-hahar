import type { StoryListItem } from "@/lib/api";
import { getFeaturedStory } from "@/lib/stories";

/**
 * רקע ה"אקשן" המלא של ה-hero - לא תמונת סטוק, אלא תמונת השער האמיתית
 * של הסיפור עם הכי הרבה לייקים באתר. ברגע שיש תוכן אמיתי, זה נראה כמו
 * צילום אקשן אמיתי; כל עוד אין, הרכיב לא מרנדר כלום והעמוד נופל בחזרה
 * לאנימציית האופנוע המופשטת.
 */
export default function HeroActionBackdrop({ stories }: { stories: StoryListItem[] }) {
  const featured = getFeaturedStory(stories);
  if (!featured?.cover_photo_url) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={featured.cover_photo_url}
        alt=""
        className="slow-pan w-full h-full object-cover"
      />
      {/* וינייטה כבדה - שומרת על ניגודיות מלאה לטקסט מעל, גם בשמש חזקה */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(var(--bg-main-rgb) / 0.6), rgb(var(--bg-main-rgb) / 0.85), rgb(var(--bg-main-rgb)))",
        }}
      />
    </div>
  );
}
