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
      <header className="border-b border-edge">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center flex-wrap gap-y-2 justify-between">
          <Logo />
          <nav className="flex items-center flex-wrap gap-3 sm:gap-5 text-sm">
            <Link href="/stories" className="hover:text-moto transition-colors">
              כל הסיפורים
            </Link>
            <Link
              href="/stories/new"
              className="moto-btn bg-moto text-carbon px-4 py-2 font-bold hover:bg-motoDark transition-colors"
            >
              העלה סיפור
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero - פאנל אלכסוני א-סימטרי, לא עוד קישוט עדין */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 right-0 w-[55%] sm:w-[42%] bg-surface/60 livery-stripe opacity-[0.06] pointer-events-none"
          style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-5 pt-14 pb-12">
          <div className="font-mono text-xs text-cyan tracking-[0.3em] mb-3">
            ROADBOOK // אנדורו · סינגלים · מוטוקרוס · אדוונצ'ר
          </div>
          <h1 className="leading-[0.85]">
            <span className="block text-7xl md:text-9xl font-black text-ink">כובשים.</span>
            <span className="block text-2xl md:text-4xl font-bold text-moto mt-2">
              כל רכיבה משאירה קו על המפה
            </span>
          </h1>
          <p className="mt-6 text-lg text-ink/70 max-w-lg leading-relaxed">
            מקום חינמי לרוכבים לתעד ולשתף מסלולים אמיתיים - עם קובץ GPX, תמונות,
            ועדכוני שטח בזמן אמת.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/stories/new"
              className="moto-btn bg-moto text-carbon px-6 py-3 font-bold hover:bg-motoDark transition-colors"
            >
              שתף סיפור נסיעה
            </Link>
            <Link
              href="/stories"
              className="border border-edge px-6 py-3 font-bold hover:border-moto transition-colors"
            >
              עיין במסלולים
            </Link>
          </div>
        </div>
      </section>

      <div className="contour-divider max-w-5xl mx-auto" />

      {/* תצוגה היברידית - מפה עם כל הנעצים + פילטרים צפים */}
      <section className="max-w-5xl mx-auto px-5 py-8">
        <div className="relative">
          <OverviewMap stories={stories} className="w-full h-80 border border-edge" />
          <div className="absolute top-3 right-3 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
            {Object.entries(RIDE_STYLE_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`/stories?ride_style=${key}`}
                className="switch-btn pointer-events-auto text-xs font-bold text-ink px-3.5 py-2.5 min-h-[40px] flex items-center"
              >
                {label}
              </Link>
            ))}
          </div>
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
