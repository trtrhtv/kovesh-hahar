import Image from "next/image";
import Link from "next/link";
import ElevationSignature from "./ElevationSignature";
import { VEHICLE_TYPE_LABELS, RIDE_STYLE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/labels";
import type { StoryListItem } from "@/lib/api";

/**
 * כרטיס סיפור - דשבורד כהה בהשראת ממשקי רכבי מרוץ. הכרטיס "מרחף" ב-hover
 * וזוהר בצבע האקצנט, בלי להיות עמוס - הריחוף הוא הרמז היחיד לאינטראקטיביות.
 */
export default function StoryCard({ story }: { story: StoryListItem }) {
  const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || "#FF6600";

  return (
    <Link
      href={`/stories/${story.id}`}
      className="moto-card group grid grid-cols-[1fr_auto] gap-0 overflow-hidden"
    >
      {/* תוכן */}
      <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-textDim mb-2 tracking-wide">
            <span>
              {story.country !== "ישראל" ? `${story.region}, ${story.country}` : story.region}
            </span>
            <span>·</span>
            <span>{VEHICLE_TYPE_LABELS[story.vehicle_type] || story.vehicle_type}</span>
            <span>·</span>
            <span>{RIDE_STYLE_LABELS[story.ride_style] || story.ride_style}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black leading-snug text-white group-hover:text-moto transition-colors">
            {story.title}
          </h3>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex gap-4 font-mono text-sm">
            {story.distance_km != null && (
              <div>
                <div className="stat-number text-2xl font-black leading-none text-white">
                  {story.distance_km}
                </div>
                <div className="text-[10px] text-textDim tracking-wider">ק״מ</div>
              </div>
            )}
            {story.elevation_gain_m != null && (
              <div>
                <div className="stat-number text-2xl font-black leading-none text-white">
                  {Math.round(story.elevation_gain_m)}
                </div>
                <div className="text-[10px] text-textDim tracking-wider">מ׳ טיפוס</div>
              </div>
            )}
          </div>

          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-md border shrink-0 tracking-wide"
            style={{ color: difficultyColor, borderColor: difficultyColor }}
          >
            {DIFFICULTY_LABELS[story.difficulty] || story.difficulty}
          </span>
        </div>

        <ElevationSignature
          profileJson={story.elevation_profile_json}
          className="w-full h-8 mt-3"
          color={difficultyColor}
        />

        <div className="mt-3 flex items-center justify-between text-xs text-textDim">
          <span>{story.author.display_name}</span>
          <span>
            {story.like_count} לייקים · {story.comment_count} תגובות
          </span>
        </div>
      </div>

      {/* תמונה */}
      {story.cover_photo_url && (
        <div className="relative w-24 sm:w-40 md:w-56 shrink-0">
          <Image
            src={story.cover_photo_url}
            alt={story.title}
            fill
            sizes="224px"
            className="object-cover brightness-[0.75] group-hover:brightness-100 transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface/40" />
        </div>
      )}
    </Link>
  );
}
