import Link from "next/link";
import Logo from "@/components/Logo";
import StoryCard from "@/components/StoryCard";
import FilterSidebar from "@/components/FilterSidebar";
import OverviewMap from "@/components/OverviewMap";
import { fetchStories } from "@/lib/api";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: {
    country?: string;
    region?: string;
    vehicle_type?: string;
    ride_style?: string;
    difficulty?: string;
    season?: string;
    search?: string;
    offset?: string;
  };
}) {
  const offset = Number(searchParams.offset || 0);
  const limit = 20;
  const stories = await fetchStories({ ...searchParams, limit, offset });

  const activeFilters = Object.entries(searchParams).filter(
    ([k, v]) => k !== "offset" && !!v
  );

  return (
    <main>
      <header className="border-b border-edge">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center flex-wrap gap-y-2 justify-between">
          <Link href="/" className="font-black text-lg tracking-tight">
            <Logo />
          </Link>
          <Link
            href="/stories/new"
            className="bg-moto text-carbon px-4 py-2 font-bold hover:bg-motoDark transition-colors text-sm"
          >
            העלה סיפור
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
        <aside>
          <FilterSidebar defaults={searchParams} />
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black">כל הסיפורים</h1>
            {activeFilters.length > 0 && (
              <Link href="/stories" className="text-sm text-moto hover:underline">
                נקה סינון
              </Link>
            )}
          </div>

          <OverviewMap stories={stories} className="w-full h-72 mb-8 border border-edge" />

          <div className="grid gap-4">
            {stories.length === 0 ? (
              <div className="border border-dashed border-edge p-12 text-center text-textDim">
                לא נמצאו סיפורים שתואמים לסינון הזה.
              </div>
            ) : (
              stories.map((story) => <StoryCard key={story.id} story={story} />)
            )}
          </div>

          <div className="flex items-center justify-between mt-8 text-sm">
            {offset > 0 ? (
              <Link
                href={`/stories?${new URLSearchParams({
                  ...searchParams,
                  offset: String(Math.max(0, offset - limit)),
                }).toString()}`}
                className="border border-edge px-4 py-2 hover:border-moto"
              >
                ← הקודמים
              </Link>
            ) : (
              <span />
            )}
            {stories.length === limit && (
              <Link
                href={`/stories?${new URLSearchParams({
                  ...searchParams,
                  offset: String(offset + limit),
                }).toString()}`}
                className="border border-edge px-4 py-2 hover:border-moto"
              >
                הבאים →
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
