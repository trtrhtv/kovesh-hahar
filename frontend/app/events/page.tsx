import Link from "next/link";
import EventCard from "@/components/EventCard";
import { fetchEvents } from "@/lib/api";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <main>
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-black">אירועי רכיבה קרובים</h1>
          <Link
            href="/events/new"
            className="tactical-btn bg-moto text-onAccent hover:bg-motoDark !text-[11px] !py-2.5 !px-4 shrink-0"
          >
            אירוע חדש
          </Link>
        </div>
        <p className="text-textDim mb-8 text-sm">
          מארגנים רכיבה קבוצתית? תפרסמו כאן ותראו מי מגיע.
        </p>

        {events.length === 0 ? (
          <div className="border border-dashed border-edge p-12 text-center text-textDim">
            <p className="mb-4">אין עדיין אירועים קרובים.</p>
            <Link href="/events/new" className="text-moto font-bold hover:underline">
              תהיה הראשון לארגן ←
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
