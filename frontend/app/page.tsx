import Logo from "@/components/Logo";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import OverviewMap from "@/components/OverviewMap";
import { fetchStories } from "@/lib/api";
import { RIDE_STYLE_LABELS } from "@/lib/labels";

export default async function HomePage() {
  const stories = await fetchStories();

  return (
    <main>
      {/* ניווט עליון */}
      <header className="border-b border-char/15">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center flex-wrap gap-y-2 justify-between">
          <Logo />
          <nav className="flex items-center flex-wrap gap-3 sm:gap-5 text-sm">
            <Link href="/stories" className="hover:text-oxide transition-colors">
              כל הסיפורים
            </Link>
            <Link
              href="/stories/new"
              className="bg-oxide text-sand px-4 py-2 font-bold hover:bg-oxideDark transition-colors"
            >
              העלה סיפור
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden max-w-5xl mx-auto px-5 pt-16 pb-12">
        <svg
          className="absolute -left-24 -top-16 w-[520px] h-[520px] opacity-[0.12] pointer-events-none"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          {[60, 95, 130, 165, 200, 235].map((r, i) => (
            <ellipse
              key={r}
              cx="200"
              cy="220"
              rx={r * 1.3}
              ry={r}
              fill="none"
              stroke={i % 2 === 0 ? "#A8462E" : "#23201B"}
              strokeWidth="1.5"
              transform={`rotate(${i * 3} 200 220)`}
            />
          ))}
        </svg>

        <div className="relative font-mono text-xs text-trail tracking-widest mb-4">
          ROADBOOK · אנדורו · סינגלים · מוטוקרוס · אדוונצ'ר
        </div>
        <h1 className="relative text-5xl md:text-7xl font-black leading-[0.95] max-w-3xl">
          כל רכיבה משאירה
          <br />
          <span className="text-oxide">קו על המפה.</span>
        </h1>
        <p className="relative mt-6 text-lg text-char/80 max-w-xl leading-relaxed">
          מקום חינמי לרוכבים לתעד ולשתף מסלולים אמיתיים - עם קובץ GPX, תמונות,
          ועדכוני שטח בזמן אמת. בלי מנויים.
        </p>
        <div className="relative mt-8 flex gap-3">
          <Link
            href="/stories/new"
            className="bg-oxide text-sand px-6 py-3 font-bold hover:bg-oxideDark transition-colors"
          >
            שתף סיפור נסיעה
          </Link>
          <Link
            href="/stories"
            className="border border-char/30 px-6 py-3 font-bold hover:border-char transition-colors"
          >
            עיין במסלולים
          </Link>
        </div>
      </section>

      <div className="contour-divider max-w-5xl mx-auto" />

      {/* תצוגה היברידית - מפה עם כל הנעצים */}
      <section className="max-w-5xl mx-auto px-5 py-8">
        <OverviewMap stories={stories} className="w-full h-72 border border-char/15" />
      </section>

      {/* פילטרים מהירים לפי סגנון רכיבה */}
      <section className="max-w-5xl mx-auto px-5 pb-8">
        <div className="flex flex-wrap gap-2">
          {Object.entries(RIDE_STYLE_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/stories?ride_style=${key}`}
              className="text-sm border border-char/20 px-3 py-1.5 hover:border-oxide hover:text-oxide transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* פיד סיפורים */}
      <section className="max-w-5xl mx-auto px-5 pb-24">
        <h2 className="font-bold text-sm tracking-wider text-char/60 mb-4">
          הסיפורים האחרונים
        </h2>
        {stories.length === 0 ? (
          <div className="border border-dashed border-char/30 p-12 text-center text-char/60">
            <p className="mb-4">עוד אין כאן סיפורים - תהיה הראשון לסמן מסלול.</p>
            <Link href="/stories/new" className="text-oxide font-bold hover:underline">
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
