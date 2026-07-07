import Link from "next/link";
import type { EventItem } from "@/lib/api";
import { VEHICLE_TYPE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_COLORS, TIME_PERIOD_LABELS } from "@/lib/labels";

export default function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.event_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const difficultyColor = event.difficulty ? DIFFICULTY_COLORS[event.difficulty] : "#00E5FF";
  const timeLabel = event.time_is_approximate
    ? TIME_PERIOD_LABELS[event.approximate_period || ""] || ""
    : date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={`/events/${event.id}`} className="moto-card grid grid-cols-[auto_1fr] gap-4 p-4 sm:p-5">
      <div className="text-center border-l border-edge pl-4 flex flex-col justify-center min-w-[64px]">
        <div className="stat-number text-2xl font-black text-moto leading-none">
          {date.getDate()}
          {endDate && <span className="text-sm">-{endDate.getDate()}</span>}
        </div>
        <div className="text-[10px] text-textDim tracking-wider mt-1">
          {date.toLocaleDateString("he-IL", { month: "short" })}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-textDim mb-1">
          <span>{event.country !== "ישראל" ? `${event.region}, ${event.country}` : event.region}</span>
          <span>·</span>
          <span>{timeLabel}</span>
          {endDate && (
            <>
              <span>·</span>
              <span>טיול {Math.round((endDate.getTime() - date.getTime()) / 86400000) + 1} ימים</span>
            </>
          )}
          {event.vehicle_type && (
            <>
              <span>·</span>
              <span>{VEHICLE_TYPE_LABELS[event.vehicle_type] || event.vehicle_type}</span>
            </>
          )}
          {event.difficulty && (
            <span
              className="difficulty-stamp px-1.5 py-0.5 font-bold text-[10px]"
              style={{ color: difficultyColor }}
            >
              {DIFFICULTY_LABELS[event.difficulty]}
            </span>
          )}
        </div>
        <h3 className="text-lg font-black text-ink leading-snug">{event.title}</h3>
        <div className="flex items-center justify-between mt-2 text-xs text-textDim">
          <span>מארגן: {event.organizer.display_name}</span>
          <span>👥 {event.attendee_count} מגיעים</span>
        </div>
      </div>
    </Link>
  );
}
