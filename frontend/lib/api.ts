const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Author = { id: string; display_name: string; avatar_url?: string };

export type StoryListItem = {
  id: string;
  title: string;
  vehicle_type: string;
  ride_style: string;
  difficulty: string;
  season: string;
  country: string;
  region: string;
  pin_lat?: number;
  pin_lon?: number;
  distance_km?: number;
  elevation_gain_m?: number;
  elevation_profile_json?: string;
  cover_photo_url?: string;
  created_at: string;
  author: Author;
  like_count: number;
  comment_count: number;
};

export type Photo = { id: string; url: string; order_index: number };

export type StoryDetail = StoryListItem & {
  body: string;
  meeting_point_label?: string;
  start_lat?: number;
  start_lon?: number;
  photos: Photo[];
};

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  author: Author;
};

export type TrailUpdate = {
  id: string;
  status: string;
  note?: string;
  created_at: string;
  author: Author;
};

export async function fetchStories(params?: {
  country?: string;
  region?: string;
  vehicle_type?: string;
  ride_style?: string;
  difficulty?: string;
  season?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<StoryListItem[]> {
  const qs = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${API_BASE}/stories?${qs.toString()}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStory(id: string): Promise<StoryDetail | null> {
  const res = await fetch(`${API_BASE}/stories/${id}`, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchComments(storyId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/comments`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function postComment(storyId: string, body: string, token: string): Promise<Comment> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "שליחת התגובה נכשלה");
  }
  return res.json();
}

export async function fetchTrailUpdates(storyId: string): Promise<TrailUpdate[]> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/trail-updates`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function postTrailUpdate(
  storyId: string,
  status: string,
  note: string,
  token: string
): Promise<TrailUpdate> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/trail-updates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "שליחת העדכון נכשלה");
  }
  return res.json();
}

export async function toggleLike(storyId: string, token: string): Promise<{ liked: boolean }> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("הפעולה נכשלה");
  return res.json();
}

export async function createStory(
  data: {
    title: string;
    body: string;
    vehicle_type: string;
    ride_style: string;
    difficulty: string;
    season: string;
    country: string;
    region: string;
    meetingPointLabel?: string;
    meetingPointLat?: number | null;
    meetingPointLon?: number | null;
    gpxFile?: File | null;
    photos: File[];
  },
  token: string
): Promise<StoryDetail> {
  const form = new FormData();
  form.set("title", data.title);
  form.set("body", data.body);
  form.set("vehicle_type", data.vehicle_type);
  form.set("ride_style", data.ride_style);
  form.set("difficulty", data.difficulty);
  form.set("season", data.season);
  form.set("country", data.country);
  form.set("region", data.region);
  if (data.meetingPointLabel) form.set("meeting_point_label", data.meetingPointLabel);
  if (data.meetingPointLat != null) form.set("meeting_point_lat", String(data.meetingPointLat));
  if (data.meetingPointLon != null) form.set("meeting_point_lon", String(data.meetingPointLon));
  if (data.gpxFile) form.set("gpx_file", data.gpxFile);
  data.photos.forEach((p) => form.append("photos", p));

  const res = await fetch(`${API_BASE}/stories`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "העלאת הסיפור נכשלה");
  }
  return res.json();
}
