const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * FastAPI מחזיר שגיאות ולידציה כרשימה של אובייקטים (למשל [{loc, msg, type}]),
 * לא כטקסט בודד - בלי הפונקציה הזו זה מוצג כ-"[object Object]" למשתמש.
 */
function extractErrorMessage(errBody: any, fallback: string): string {
  const detail = errBody?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === "string") return d;
        const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : "";
        return d?.msg ? `${field ? field + ": " : ""}${d.msg}` : JSON.stringify(d);
      })
      .join(" · ");
  }
  return fallback;
}

export type Author = { id: string; display_name: string; avatar_url?: string; phone_number?: string };

export type StoryListItem = {
  id: string;
  title: string;
  vehicle_type: string;
  vehicle_type_other?: string;
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
  my_vote: number;
  comment_count: number;
};

export type Photo = { id: string; url: string; order_index: number };

export type StoryDetail = StoryListItem & {
  body: string;
  meeting_point_label?: string;
  parking_security?: string;
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

export type Bike = { id: string; model_name: string; vehicle_type?: string };

export type UserProfile = {
  id: string;
  display_name: string;
  username?: string;
  avatar_url?: string;
  home_region?: string;
  phone_number?: string;
  notifications_enabled?: boolean;
  bikes: Bike[];
};

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/users/${userId}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function updateProfile(
  data: { display_name?: string; username?: string; phone_number?: string; home_region?: string; notifications_enabled?: boolean },
  token: string
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "עדכון הפרופיל נכשל"));
  }
  return res.json();
}

export async function addBike(
  modelName: string,
  vehicleType: string | undefined,
  token: string
): Promise<Bike> {
  const res = await fetch(`${API_BASE}/auth/me/bikes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", },
    credentials: "include",
    body: JSON.stringify({ model_name: modelName, vehicle_type: vehicleType || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "הוספת האופנוע נכשלה"));
  }
  return res.json();
}

export async function deleteBike(bikeId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/me/bikes/${bikeId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("מחיקת האופנוע נכשלה");
}

export async function fetchStories(params?: {
  country?: string;
  region?: string;
  vehicle_type?: string;
  ride_style?: string;
  difficulty?: string;
  season?: string;
  search?: string;
  author_id?: string;
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

export async function countStories(params?: {
  country?: string;
  region?: string;
  vehicle_type?: string;
  ride_style?: string;
  difficulty?: string;
  season?: string;
  search?: string;
  author_id?: string;
}): Promise<number> {
  const qs = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${API_BASE}/stories/count?${qs.toString()}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || 0;
}

export type EventItem = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  time_is_approximate: boolean;
  approximate_period?: string;
  vehicle_type?: string;
  difficulty?: string;
  country: string;
  region: string;
  meeting_point_label?: string;
  meeting_point_lat?: number;
  meeting_point_lon?: number;
  contact_phone: string;
  created_at: string;
  organizer: Author;
  attendee_count: number;
  is_attending: boolean;
  my_guest_count: number;
};

export async function fetchEvents(params?: {
  country?: string;
  region?: string;
  include_past?: boolean;
}): Promise<EventItem[]> {
  const qs = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${API_BASE}/events?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchEvent(id: string): Promise<EventItem | null> {
  const res = await fetch(`${API_BASE}/events/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function createEvent(
  data: {
    title: string;
    description: string;
    event_date: string;
    end_date?: string;
    time_is_approximate: boolean;
    approximate_period?: string;
    vehicle_type?: string;
    difficulty?: string;
    country: string;
    region: string;
    meeting_point_label: string;
    meeting_point_lat?: number | null;
    meeting_point_lon?: number | null;
    contact_phone: string;
  },
  token: string
): Promise<EventItem> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "יצירת האירוע נכשלה"));
  }
  return res.json();
}

export async function deleteEvent(eventId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("מחיקת האירוע נכשלה");
}

export async function setEventRSVP(
  eventId: string,
  token: string,
  guestCount = 1
): Promise<{ attending: boolean; guest_count: number }> {
  const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", },
    credentials: "include",
    body: JSON.stringify({ guest_count: guestCount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "הפעולה נכשלה"));
  }
  return res.json();
}

export async function cancelEventRSVP(eventId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "ביטול ההגעה נכשל"));
  }
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "האימות נכשל"));
  }
}

export async function resendVerificationEmail(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "השליחה נכשלה"));
  }
}

export type Report = {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  note?: string;
  status: string;
  created_at: string;
  reporter: Author;
};

export async function createReport(
  contentType: "story" | "comment" | "event",
  contentId: string,
  reason: string,
  note: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content_type: contentType, content_id: contentId, reason, note: note || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "שליחת הדיווח נכשלה"));
  }
}

export async function fetchReports(statusFilter?: string): Promise<Report[]> {
  const qs = statusFilter ? `?status_filter=${statusFilter}` : "";
  const res = await fetch(`${API_BASE}/reports${qs}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function updateReportStatus(reportId: string, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/reports/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("עדכון הדיווח נכשל");
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "הבקשה נכשלה"));
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "האיפוס נכשל"));
  }
}

export async function fetchNearbyStories(
  lat: number,
  lon: number,
  radiusKm = 50
): Promise<StoryListItem[]> {
  const res = await fetch(
    `${API_BASE}/stories/nearby?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`,
    { cache: "no-store" }
  );
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
    },
    credentials: "include",
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "שליחת התגובה נכשלה"));
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
    },
    credentials: "include",
    body: JSON.stringify({ status, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "שליחת העדכון נכשלה"));
  }
  return res.json();
}

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export async function sendContactMessage(name: string, email: string, message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "שליחת ההודעה נכשלה"));
  }
}

export async function fetchContactMessages(token: string): Promise<ContactMessage[]> {
  const res = await fetch(`${API_BASE}/contact`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function addStoryPhotos(
  storyId: string,
  photos: File[],
  token: string
): Promise<StoryDetail> {
  const form = new FormData();
  photos.forEach((p) => form.append("photos", p));
  const res = await fetch(`${API_BASE}/stories/${storyId}/photos`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "הוספת התמונות נכשלה"));
  }
  return res.json();
}

export async function deleteStoryPhoto(
  storyId: string,
  photoId: string,
  token: string
): Promise<StoryDetail> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/photos/${photoId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "מחיקת התמונה נכשלה"));
  }
  return res.json();
}

export async function replaceStoryRoute(
  storyId: string,
  data: { gpxFile?: File | null; drawnRoutePoints?: [number, number][] },
  token: string
): Promise<StoryDetail> {
  const form = new FormData();
  if (data.gpxFile) {
    form.set("gpx_file", data.gpxFile);
  } else if (data.drawnRoutePoints && data.drawnRoutePoints.length >= 2) {
    form.set("drawn_route_json", JSON.stringify(data.drawnRoutePoints));
  }
  const res = await fetch(`${API_BASE}/stories/${storyId}/route`, {
    method: "PUT",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "עדכון המסלול נכשל"));
  }
  return res.json();
}

export async function updateStory(
  storyId: string,
  data: Partial<{
    title: string;
    body: string;
    vehicle_type: string;
    vehicle_type_other: string;
    ride_style: string;
    difficulty: string;
    season: string;
    country: string;
    region: string;
    meeting_point_label: string;
    meeting_point_lat: number | null;
    meeting_point_lon: number | null;
    parking_security: string;
  }>,
  token: string
): Promise<StoryDetail> {
  const res = await fetch(`${API_BASE}/stories/${storyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "עדכון הסיפור נכשל"));
  }
  return res.json();
}

export type Notification = {
  id: string;
  type: string;
  story_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export async function fetchNotifications(token: string): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/notifications`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUnreadCount(token: string): Promise<number> {
  const res = await fetch(`${API_BASE}/notifications/unread-count`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count || 0;
}

export async function markNotificationRead(id: string, token: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: "POST",
    credentials: "include",
  });
}

export async function deleteStory(storyId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/stories/${storyId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "מחיקת הסיפור נכשלה"));
  }
}

export async function checkIsAdmin(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/auth/is-admin`, {
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.is_admin;
}

export async function voteStory(storyId: string, value: 1 | -1): Promise<{ my_vote: number }> {
  const res = await fetch(`${API_BASE}/stories/${storyId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error("הפעולה נכשלה");
  return res.json();
}

export async function createStory(
  data: {
    title: string;
    body: string;
    vehicle_type: string;
    vehicleTypeOther?: string;
    ride_style: string;
    difficulty: string;
    season: string;
    country: string;
    region: string;
    meetingPointLabel?: string;
    meetingPointLat?: number | null;
    meetingPointLon?: number | null;
    parkingSecurity?: string;
    gpxFile?: File | null;
    drawnRoutePoints?: [number, number][];
    photos: File[];
  },
  token: string
): Promise<StoryDetail> {
  const form = new FormData();
  form.set("title", data.title);
  form.set("body", data.body);
  form.set("vehicle_type", data.vehicle_type);
  if (data.vehicleTypeOther) form.set("vehicle_type_other", data.vehicleTypeOther);
  form.set("ride_style", data.ride_style);
  form.set("difficulty", data.difficulty);
  form.set("season", data.season);
  form.set("country", data.country);
  form.set("region", data.region);
  if (data.meetingPointLabel) form.set("meeting_point_label", data.meetingPointLabel);
  if (data.meetingPointLat != null) form.set("meeting_point_lat", String(data.meetingPointLat));
  if (data.meetingPointLon != null) form.set("meeting_point_lon", String(data.meetingPointLon));
  if (data.parkingSecurity) form.set("parking_security", data.parkingSecurity);
  if (data.gpxFile) form.set("gpx_file", data.gpxFile);
  if (!data.gpxFile && data.drawnRoutePoints && data.drawnRoutePoints.length >= 2) {
    form.set("drawn_route_json", JSON.stringify(data.drawnRoutePoints));
  }
  data.photos.forEach((p) => form.append("photos", p));

  const res = await fetch(`${API_BASE}/stories`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "העלאת הסיפור נכשלה"));
  }
  return res.json();
}
