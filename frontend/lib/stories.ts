import type { StoryListItem } from "./api";

export function getFeaturedStory(stories: StoryListItem[]): StoryListItem | undefined {
  return [...stories]
    .filter((s) => s.cover_photo_url)
    .sort((a, b) => b.like_count - a.like_count)[0];
}
