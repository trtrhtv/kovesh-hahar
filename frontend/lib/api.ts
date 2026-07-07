const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type StoryListItem = {
  id: string;
  title: string;
  ride_type: string;
  difficulty: string;
  region: string;
  distance_km?: number;
  elevation_gain_m?: number;
  elevation_profile_json?: string;
  cover_photo_url?: string;
  created_at: string;
  author: { id: string; display_name: string; avatar_url?: string };
  like_count: number;
};

export async function fetchStories(params?: {
  region?: string;
  ride_type?: string;
  difficulty?: string;
  search?: string;
}): Promise<StoryListItem[]> {
  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => !!v) as [string, string][]
  );
  const res = await fetch(`${API_BASE}/stories?${qs.toString()}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json();
}
