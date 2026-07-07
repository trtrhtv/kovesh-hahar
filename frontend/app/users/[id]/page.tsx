import Link from "next/link";
import Logo from "@/components/Logo";
import BackNav from "@/components/BackNav";
import PageBackdrop from "@/components/PageBackdrop";
import StoryCard from "@/components/StoryCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProfileOwnerActions from "@/components/ProfileOwnerActions";
import { fetchUserProfile, fetchStories } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const profile = await fetchUserProfile(params.id);
  if (!profile) notFound();

  const stories = await fetchStories({ author_id: params.id, limit: 50 });

  return (
    <PageBackdrop>
      <main>
        <header className="border-b border-edge">
          <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between flex-wrap gap-2">
            <Link href="/">
              <Logo />
            </Link>
            <BackNav />
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 py-10">
          <div className="moto-card p-6 mb-8 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-moto/20 border border-moto/50 flex items-center justify-center text-moto font-black text-2xl shrink-0">
              {profile.display_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-ink truncate">{profile.display_name}</h1>
                <ProfileOwnerActions profileUserId={profile.id} />
              </div>
              <div className="text-sm text-textDim mt-1 flex flex-wrap gap-x-3">
                {profile.home_region && <span>📍 {profile.home_region}</span>}
                <span>{stories.length} סיפורים</span>
              </div>
              {profile.bikes && profile.bikes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.bikes.map((bike) => (
                    <span
                      key={bike.id}
                      className="text-[11px] border border-edge px-2 py-1 text-textDim"
                    >
                      🏍️ {bike.model_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.phone_number && (
            <div className="mb-8">
              <WhatsAppButton phoneNumber={profile.phone_number} routeName="הרכיבות שלך" />
            </div>
          )}

          <h2 className="font-bold text-sm tracking-wider text-textDim mb-4">
            סיפורים שהעלה {profile.display_name}
          </h2>

          {stories.length === 0 ? (
            <div className="border border-dashed border-edge p-12 text-center text-textDim">
              עדיין לא העלה סיפורים.
            </div>
          ) : (
            <div className="grid gap-4">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      </main>
    </PageBackdrop>
  );
}
