import Image from "next/image";
import Link from "next/link";
import ElevationSignature from "./ElevationSignature";
import { RIDE_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from "@/lib/labels";
import type { StoryListItem } from "@/lib/api";

/**
 * כרטיס סיפור בסגנון "עמוד roadbook" - עמודת נתונים משמאל (בעברית: מימין
 * ויזואלית כי הכל RTL), תמונה ראשית, וקו החתימה הטופוגרפי בתחתית.
 */
export default function StoryCard({ story }: { story: StoryListItem }) {
  const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || "#23201B";

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group grid grid-cols-[1fr_auto] gap-0 bg-sand border border-char/15 hover:border-char/30 transition-colors"
    >
      {/* תוכן */}
      <div className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-trail mb-2">
            <span>
              {story.country !== "ישראל" ? `${story.region}, ${story.country}` : story.region}
            </span>
            <span>·</span>
            <span>{RIDE_TYPE_LABELS[story.ride_type] || story.ride_type}</span>
          </div>
          <h3 className="text-xl font-bold leading-snug group-hover:text-oxide transition-colors">
            {story.title}
          </h3>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex gap-4 font-mono text-sm">
            {story.distance_km != null && (
              <div>
                <div className="text-2xl font-bold leading-none">{story.distance_km}</div>
                <div className="text-[10px] text-char/60 tracking-wider">ק״מ</div>
              </div>
            )}
            {story.elevation_gain_m != null && (
              <div>
                <div className="text-2xl font-bold leading-none">
                  {Math.round(story.elevation_gain_m)}
                </div>
                <div className="text-[10px] text-char/60 tracking-wider">מ׳ טיפוס</div>
              </div>
            )}
          </div>

          <span
            className="difficulty-stamp text-[10px] font-bold px-2 py-0.5 shrink-0"
            style={{ color: difficultyColor }}
          >
            {DIFFICULTY_LABELS[story.difficulty] || story.difficulty}
          </span>
        </div>

        <ElevationSignature
          profileJson={story.elevation_profile_json}
          className="w-full h-8 mt-3"
          color={difficultyColor}
        />

        <div className="mt-3 flex items-center justify-between text-xs text-char/60">
          <span>{story.author.display_name}</span>
          <span>
            {story.like_count} לייקים · {story.comment_count} תגובות
          </span>
        </div>
      </div>

      {/* תמונה */}
      {story.cover_photo_url && (
        <div className="relative w-40 md:w-56 shrink-0">
          <Image
            src={story.cover_photo_url}
            alt={story.title}
            fill
            sizes="224px"
            className="object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
          />
        </div>
      )}
    </Link>
  );
}
