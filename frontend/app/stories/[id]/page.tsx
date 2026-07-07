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
import DeleteStoryButton from "@/components/DeleteStoryButton";

function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const story = await fetchStory(params.id);
  if (!story) notFound();

  const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || "#FF6600";
  const locationLabel =
    story.country !== "ישראל" ? `${story.region}, ${story.country}` : story.region;
  const readingMinutes = estimateReadingMinutes(story.body);

  return (
    <main>
      <header className="border-b border-edge">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      {/* Hero טבול - תמונת רקע עם overlay כהה, כותרת וכרטיס יוצר */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden">
        {story.cover_photo_url ? (
          <Image
            src={story.cover_photo_url}
            alt={story.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/70 to-carbon/10" />

        <div className="relative h-full max-w-3xl mx-auto px-5 flex flex-col justify-end pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan mb-2">
            <span>{locationLabel}</span>
            <span>·</span>
            <span
              className="difficulty-stamp px-2 py-0.5 font-bold"
              style={{ color: difficultyColor }}
            >
              {DIFFICULTY_LABELS[story.difficulty] || story.difficulty}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white drop-shadow-lg">
            {story.title}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-full bg-moto/20 border border-moto/50 flex items-center justify-center text-moto font-black text-sm">
              {story.author.display_name.charAt(0)}
            </div>
            <span className="text-white/90 text-sm font-bold">{story.author.display_name}</span>
            <span className="text-textDim text-sm">
              · {new Date(story.created_at).toLocaleDateString("he-IL")}
            </span>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex justify-end mb-6">
          <DeleteStoryButton storyId={story.id} authorId={story.author.id} />
        </div>

        {/* דשבורד מטא-דאטה - 4 עמודות */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <MetaTile label="סוג אופנוע" value={VEHICLE_TYPE_LABELS[story.vehicle_type]} />
          <MetaTile label="עונה מומלצת" value={SEASON_LABELS[story.season]} />
          <MetaTile label="סגנון רכיבה" value={RIDE_STYLE_LABELS[story.ride_style]} />
          <MetaTile label="זמן קריאה" value={`~${readingMinutes} דק׳`} />
        </div>

        {(story.distance_km != null || story.elevation_gain_m != null) && (
          <div className="flex gap-8 font-mono border-y border-edge py-4 mb-8">
            {story.distance_km != null && (
              <div>
                <div className="stat-number text-3xl font-black leading-none text-white">
                  {story.distance_km}
                </div>
                <div className="text-xs text-textDim tracking-wider mt-1">ק״מ</div>
              </div>
            )}
            {story.elevation_gain_m != null && (
              <div>
                <div className="stat-number text-3xl font-black leading-none text-white">
                  {Math.round(story.elevation_gain_m)}
                </div>
                <div className="text-xs text-textDim tracking-wider mt-1">מ׳ טיפוס מצטבר</div>
              </div>
            )}
          </div>
        )}

        {/* תיבת הפעולה הראשית - ניווט לנקודת הכינוס */}
        <div className="mb-8">
          <NavigateButton
            lat={story.pin_lat}
            lon={story.pin_lon}
            label={story.meeting_point_label}
          />
        </div>

        <RouteMap profileJson={story.elevation_profile_json} className="w-full h-80 mb-8" />

        <div className="whitespace-pre-line leading-relaxed text-white/90 mb-8">{story.body}</div>

        {story.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-8">
            {story.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-[4/3] rounded-lg overflow-hidden">
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

function MetaTile({ label, value }: { label: string; value?: string }) {
  return (
    <div className="moto-card px-3 py-3">
      <div className="text-[10px] text-textDim tracking-wider mb-1">{label}</div>
      <div className="text-sm font-bold text-white leading-snug">{value || "—"}</div>
    </div>
  );
}
