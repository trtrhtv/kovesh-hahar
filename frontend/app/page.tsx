import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import OverviewMap from "@/components/OverviewMap";
import AdBanner from "@/components/AdBanner";
import { fetchStories } from "@/lib/api";
import { RIDE_STYLE_LABELS } from "@/lib/labels";

export default async function HomePage() {
  const stories = await fetchStories();

  return (
    <main>
      {/* ניווט עליון */}
      <header className="border-b border-char/15">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-black text-lg tracking-tight">כובש ההר</span>
          <nav className="flex items-center gap-5 text-sm">
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
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12">
        <div className="font-mono text-xs text-trail tracking-widest mb-4">
          ROADBOOK · אנדורו · סינגלים · מוטוקרוס · אדוונצ'ר
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-[0.95] max-w-3xl">
          כל רכיבה משאירה
          <br />
          <span className="text-oxide">קו על המפה.</span>
        </h1>
        <p className="mt-6 text-lg text-char/80 max-w-xl leading-relaxed">
          מקום חינמי לרוכבים לתעד ולשתף מסלולים אמיתיים - עם קובץ GPX, תמונות,
          ועדכוני שטח בזמן אמת. בלי מנויים.
        </p>
        <div className="mt-8 flex gap-3">
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

      <section className="max-w-5xl mx-auto px-5 pb-4">
        <AdBanner variant="horizontal" />
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
