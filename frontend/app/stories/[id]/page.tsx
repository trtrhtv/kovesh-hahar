import Link from "next/link";
import Logo from "@/components/Logo";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchStory } from "@/lib/api";
import {
  VEHICLE_TYPE_LABELS,
  RIDE_STYLE_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  SEASON_LABELS,
} from "@/lib/labels";
import RouteMap from "@/components/RouteMap";
import LikeButton from "@/components/LikeButton";
import CommentsSection from "@/components/CommentsSection";
import NavigateButton from "@/components/NavigateButton";
import TrailUpdatesSection from "@/components/TrailUpdatesSection";

export default async function StoryPage({ params }: { params: { id: string } }) {
  const story = await fetchStory(params.id);
  if (!story) notFound();

  const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || "#23201B";
  const locationLabel =
    story.country !== "ישראל" ? `${story.region}, ${story.country}` : story.region;

  return (
    <main>
      <header className="border-b border-char/15">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <Link href="/" className="font-black text-lg tracking-tight">
            <Logo />
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-trail mb-3">
          <span>{locationLabel}</span>
          <span>·</span>
          <span>{VEHICLE_TYPE_LABELS[story.vehicle_type] || story.vehicle_type}</span>
          <span>·</span>
          <span>{RIDE_STYLE_LABELS[story.ride_style] || story.ride_style}</span>
          <span>·</span>
          <span>{SEASON_LABELS[story.season] || story.season}</span>
          <span>·</span>
          <span
            className="difficulty-stamp px-2 py-0.5 font-bold"
            style={{ color: difficultyColor }}
          >
            {DIFFICULTY_LABELS[story.difficulty] || story.difficulty}
          </span>
        </div>

        <h1 className="text-4xl font-black leading-tight mb-2">{story.title}</h1>
        <p className="text-char/60 text-sm mb-8">
          {story.author.display_name} ·{" "}
          {new Date(story.created_at).toLocaleDateString("he-IL")}
        </p>

        {(story.distance_km != null || story.elevation_gain_m != null) && (
          <div className="flex gap-8 font-mono border-y border-char/15 py-4 mb-8">
            {story.distance_km != null && (
              <div>
                <div className="text-3xl font-bold leading-none">{story.distance_km}</div>
                <div className="text-xs text-char/60 tracking-wider mt-1">ק״מ</div>
              </div>
            )}
            {story.elevation_gain_m != null && (
              <div>
                <div className="text-3xl font-bold leading-none">
                  {Math.round(story.elevation_gain_m)}
                </div>
                <div className="text-xs text-char/60 tracking-wider mt-1">מ׳ טיפוס מצטבר</div>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <NavigateButton
            lat={story.pin_lat}
            lon={story.pin_lon}
            label={story.meeting_point_label}
          />
        </div>

        <RouteMap profileJson={story.elevation_profile_json} className="w-full h-80 mb-8" />

        <div className="prose-content whitespace-pre-line leading-relaxed text-char/90 mb-8">
          {story.body}
        </div>

        {story.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-8">
            {story.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[4/3]">
                <Image
                  src={photo.url}
                  alt={story.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 400px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <LikeButton storyId={story.id} initialCount={story.like_count} />
        </div>

        <div className="mb-8">
          <TrailUpdatesSection storyId={story.id} />
        </div>

        <div className="contour-divider mb-8" />

        <CommentsSection storyId={story.id} />
      </article>
    </main>
  );
}
