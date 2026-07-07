"use client";

/**
 * רקע וידאו לולאתי מאחורי ה-hero. דורש NEXT_PUBLIC_HERO_VIDEO_URL עם קליפ
 * ברישיון מסחרי ברור (Pexels/Coverr נותנים חינם עם רישיון תקין). בלי המשתנה
 * הזה הקומפוננטה לא מרנדרת כלום - אין וידאו שבור, אין שגיאה.
 *
 * מוסתר במובייל בכוונה: וידאו רקע רץ ברקע = סוללה + נתונים, בדיוק ההפך
 * ממה שרוכב בשטח עם קליטה חלקית צריך. גם מכבד prefers-reduced-motion.
 */
export default function CinematicVideoBackground() {
  const videoUrl = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
  if (!videoUrl) return null;

  return (
    <div
      className="hidden md:block motion-safe:block motion-reduce:hidden absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover opacity-40"
      />
      {/* scrim כהה - השומר על ניגודיות הטקסט מעל, גם בשמש חזקה */}
      <div className="absolute inset-0 bg-carbon/80" />
    </div>
  );
}
