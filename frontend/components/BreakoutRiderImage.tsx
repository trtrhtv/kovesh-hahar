import type { StoryListItem } from "@/lib/api";

/**
 * לוקחת את תמונת השער של הסיפור עם הכי הרבה לייקים ומציבה אותה "פורצת"
 * מפינת הגריד - עם מסכת דעיכה (CSS mask, לא Photoshop) שמטשטשת קצוות
 * ומעגלת אשליה של תמונה חופשית, לא מלבן סטטי. אין כאן תמונת סטוק - זו
 * תמונה אמיתית שרוכב אמיתי העלה.
 */
export default function BreakoutRiderImage({ stories }: { stories: StoryListItem[] }) {
  const featured = [...stories]
    .filter((s) => s.cover_photo_url)
    .sort((a, b) => b.like_count - a.like_count)[0];

  if (!featured?.cover_photo_url) return null;

  return (
    <div
      className="hidden md:block absolute -top-10 left-0 w-56 lg:w-72 aspect-square z-20 pointer-events-none"
      style={{ transform: "rotate(-6deg)" }}
      aria-hidden="true"
    >
      <div
        className="w-full h-full"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 70% at 45% 40%, black 55%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 45% 40%, black 55%, transparent 85%)",
          filter: "drop-shadow(0 12px 28px rgb(var(--accent-rgb) / 0.35))",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={featured.cover_photo_url}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
