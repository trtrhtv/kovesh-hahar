import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import NavigateButton from "@/components/NavigateButton";
import RSVPButton from "@/components/RSVPButton";
import WhatsAppButton from "@/components/WhatsAppButton";
import WeatherWidget from "@/components/WeatherWidget";
import ReportButton from "@/components/ReportButton";
import DeleteEventButton from "@/components/DeleteEventButton";
import { fetchEvent } from "@/lib/api";
import { VEHICLE_TYPE_LABELS, DIFFICULTY_LABELS, TIME_PERIOD_LABELS } from "@/lib/labels";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id);
  if (!event) notFound();

  const date = new Date(event.event_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const locationLabel = event.country !== "ישראל" ? `${event.region}, ${event.country}` : event.region;

  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
        <Link href="/">
          <Logo />
        </Link>
        <BackNav />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-cyan mb-2">
        <span>{locationLabel}</span>
        {event.vehicle_type && (
          <>
            <span>·</span>
            <span>{VEHICLE_TYPE_LABELS[event.vehicle_type] || event.vehicle_type}</span>
          </>
        )}
        {event.difficulty && (
          <>
            <span>·</span>
            <span>{DIFFICULTY_LABELS[event.difficulty] || event.difficulty}</span>
          </>
        )}
      </div>

      <h1 className="text-4xl font-black leading-tight mb-3">{event.title}</h1>

      <div className="moto-card p-4 mb-6 flex items-center gap-4">
        <div className="text-center border-l border-edge pl-4 min-w-[64px]">
          <div className="stat-number text-3xl font-black text-moto leading-none">{date.getDate()}</div>
          <div className="text-[10px] text-textDim tracking-wider mt-1">
            {date.toLocaleDateString("he-IL", { month: "short" })}
          </div>
        </div>
        <div>
          <div className="text-ink font-bold">
            {date.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {endDate && (
              <>
                {" "}
                עד{" "}
                {endDate.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </>
            )}
          </div>
          <div className="text-textDim text-sm">
            {event.time_is_approximate
              ? TIME_PERIOD_LABELS[event.approximate_period || ""] || "זמן משוער"
              : date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
            {endDate && ` · טיול ${Math.round((new Date(endDate).setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000) + 1} ימים`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <RSVPButton
          eventId={event.id}
          initialAttending={event.is_attending}
          initialCount={event.attendee_count}
          initialGuestCount={event.my_guest_count}
        />
        <Link href={`/users/${event.organizer.id}`} className="text-sm text-textDim hover:text-moto hover:underline">
          מארגן: {event.organizer.display_name}
        </Link>
        <ReportButton contentType="event" contentId={event.id} />
      </div>

      <div className="mb-6">
        <WhatsAppButton phoneNumber={event.contact_phone} routeName={`האירוע "${event.title}"`} />
      </div>

      {event.meeting_point_lat != null ? (
        <div className="mb-6">
          <NavigateButton
            lat={event.meeting_point_lat}
            lon={event.meeting_point_lon}
            label={event.meeting_point_label}
          />
        </div>
      ) : (
        <div className="moto-card p-4 mb-6">
          <div className="text-xs font-bold text-cyan tracking-widest mb-1">🧭 נקודת כינוס</div>
          <div className="text-ink font-bold">{event.meeting_point_label}</div>
        </div>
      )}

      {event.meeting_point_lat != null && (
        <div className="mb-6">
          <WeatherWidget lat={event.meeting_point_lat} lon={event.meeting_point_lon} />
        </div>
      )}

      <div className="whitespace-pre-line leading-relaxed text-ink/90 mb-8">{event.description}</div>

      <div className="contour-divider mb-4" />
      <DeleteEventButton eventId={event.id} organizerId={event.organizer.id} />
    </main>
  );
}
