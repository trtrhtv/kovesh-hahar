import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import HeroCarousel from "@/components/HeroCarousel";
import BreakoutRiderImage from "@/components/BreakoutRiderImage";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import OverviewMap from "@/components/OverviewMap";
import { fetchStories } from "@/lib/api";
import { RIDE_STYLE_LABELS } from "@/lib/labels";
import { ISRAEL_REGIONS } from "@/lib/locations";

export default async function HomePage() {
  const stories = await fetchStories();

  return (
    <main>
      {/* רקע אופנוע רציף לכל אורך העמוד - fixed, כך שגם המקטעים שמתחת ל-hero
          (מפה, פיד) ממשיכים את תחושת התנועה במקום רקע שטוח לבן/שחור. שכבת כיסוי
          מבוססת bg-main (theme-aware) שומרת על קריאוּת הטקסט מעל התנועה. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <HeroCarousel />
        <div
          className="absolute inset-0"
          style={{ background: "rgb(var(--bg-main-rgb))", opacity: 0.35 }}
        />
      </div>

      {/* Hero - 3 שכבות עומק: רשת סורק → אופנוע מרחף → ליבת הממשק */}
      <section className="relative overflow-hidden">
        <CinematicVideoBackground />

        {/* שכבה 1 - הכי עמוקה: רשת טכנית + וינייטה - קבועה, לא מותנית בתוכן.
            האופנוע עצמו מגיע מהרקע הרציף (fixed) של כל העמוד - מקור אחד, בלי כפילות. */}
        <div className="absolute inset-0 z-0 scanline-grid opacity-20 pointer-events-none" aria-hidden="true" />

        <div
          className="absolute top-0 bottom-0 right-0 w-[55%] sm:w-[42%] bg-surface/60 livery-stripe opacity-[0.06] pointer-events-none z-0"
          style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
          aria-hidden="true"
        />

        {/* שכבה 3 - ליבת הממשק, זכוכית קפואה מעל התנועה */}
        <div className="relative z-20 max-w-5xl mx-auto px-5 py-20">
          <div className="corner-frame relative overflow-hidden backdrop-blur-md bg-surfaceHi/10 border border-edge p-6 sm:p-10">
            {/* טלמטריית פינות - מדמה מחשב ניווט פיזי */}
            <span className="hidden sm:block absolute top-2 left-2 font-mono text-[10px] text-cyan/70 tracking-wider">
              [SYS.LOC // 31.7683°N 35.2137°E]
            </span>
            <span className="hidden sm:block absolute bottom-2 right-2 font-mono text-[10px] text-cyan/70 tracking-wider">
              [RALLY.ENG // ACTIVE]
            </span>

            <div className="font-mono text-xs text-cyan tracking-[0.25em]">
              [ROADBOOK] // [אנדורו] · [סינגלים] · [מוטוקרוס] · [אדוונצ'ר]
            </div>

            <h1 className="leading-[0.85] mt-3">
              <span className="block text-7xl md:text-9xl font-black text-ink">כובשים.</span>
              <span className="block text-2xl md:text-4xl font-bold text-moto mt-2">
                כל רכיבה משאירה קו על המפה
              </span>
            </h1>

            {/* אשכול טלמטריה דיגיטלי - מד מקוטע + משואת סכנה מהבהבת */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex gap-[3px]">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="w-1.5 h-4 bg-moto" style={{ opacity: 1 - i * 0.02 }} />
                ))}
              </div>
              <span className="font-mono text-xs font-bold text-moto tracking-widest">READY 100%</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            </div>

            <div className="border-t border-dashed border-edge mt-4 pt-6 px-1 sm:px-4">
              <p className="text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
                הפלטפורמה החברתית לרוכבי שטח בישראל - שתפו סיפורי דרך, ארגנו רכיבות,
                ותהיו חלק מהקהילה, עם עדכוני שטח בזמן אמת.
              </p>

              <form action="/stories" method="get" className="mt-6 flex gap-2 max-w-md">
                <input
                  type="text"
                  name="search"
                  placeholder="חיפוש מסלול לפי שם..."
                  className="flex-1 border border-edge bg-surface px-4 py-3 min-h-[48px] focus:border-moto outline-none"
                />
                <button
                  type="submit"
                  className="tactical-btn bg-moto text-carbon hover:bg-motoDark !px-5"
                  aria-label="חפש"
                >
                  🔍
                </button>
              </form>

              <Link
                href="/stories/nearby"
                className="inline-block mt-3 text-sm text-cyan hover:underline"
              >
                📍 מסלולים בקרבתי ←
              </Link>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/stories/new"
                  className="tactical-btn bg-moto text-carbon hover:bg-motoDark"
                >
                  שתף סיפור נסיעה
                </Link>
                <Link
                  href="/stories"
                  className="tactical-btn border-2 border-ink text-ink font-black hover:bg-ink hover:text-carbon"
                >
                  עיין במסלולים
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="contour-divider max-w-5xl mx-auto" />

      {/* תצוגה היברידית - מפה עם כל הנעצים + פילטרים צפים */}
      <section className="max-w-5xl mx-auto px-5 py-8">
        <div className="relative">
          <BreakoutRiderImage stories={stories} />
          <OverviewMap stories={stories} className="w-full h-80 border border-edge" />
          <div className="absolute top-3 right-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
            {Object.entries(RIDE_STYLE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/stories?ride_style=${key}`}
                className="switch-btn pointer-events-auto text-xs font-bold text-ink px-3.5 py-2.5 min-h-[44px] flex items-center border border-edge border-b-[3px] border-b-edge hover:border-b-moto focus:border-b-moto"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ניווט קטגורי לפי אזור בארץ */}
      <section className="max-w-5xl mx-auto px-5 pb-8">
        <h2 className="font-bold text-sm tracking-wider text-textDim mb-3">עיון לפי אזור</h2>
        <div className="flex flex-wrap gap-2">
          {ISRAEL_REGIONS.map((region) => (
            <Link
              key={region}
              href={`/stories?country=${encodeURIComponent("ישראל")}&region=${encodeURIComponent(region)}`}
              className="switch-btn text-xs font-bold text-ink px-3.5 py-2.5 min-h-[44px] flex items-center"
            >
              {region}
            </Link>
          ))}
        </div>
      </section>

      {/* פיד סיפורים */}
      <section className="max-w-5xl mx-auto px-5 pb-24">
        <h2 className="font-bold text-sm tracking-wider text-textDim mb-4">
          הסיפורים האחרונים
        </h2>
        {stories.length === 0 ? (
          <div className="border border-dashed border-edge p-12 text-center text-textDim">
            <p className="mb-4">עוד אין כאן סיפורים - תהיה הראשון לסמן מסלול.</p>
            <Link href="/stories/new" className="text-moto font-bold hover:underline">
              העלה את הסיפור הראשון ←
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
