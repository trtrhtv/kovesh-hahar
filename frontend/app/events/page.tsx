import Link from "next/link";
import Logo from "@/components/Logo";
import EventCard from "@/components/EventCard";
import NotificationBell from "@/components/NotificationBell";
import AccountMenu from "@/components/AccountMenu";
import { fetchEvents } from "@/lib/api";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <main>
      <header className="border-b border-edge">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center flex-wrap gap-y-2 justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <AccountMenu />
            <Link
              href="/events/new"
              className="tactical-btn bg-moto text-carbon hover:bg-motoDark !text-[11px] !py-2.5 !px-4"
            >
              אירוע חדש
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-black mb-1">אירועי רכיבה קרובים</h1>
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
