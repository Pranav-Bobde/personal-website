import youtubeVideos from "@/generated/youtube-videos.json";
import { generatedYoutubeVideosSchema } from "@/lib/youtube-video-schema";
import type { z } from "zod";

type GeneratedYoutubeVideo = z.infer<typeof generatedYoutubeVideosSchema>[number];

export interface HomepageVideo {
  id: string;
  title: string;
  shortTitle: string;
  stage: "published";
  date: string;
  duration: string;
  thumbnail: string;
  thumbnailAlt: string;
  youtubeUrl: string;
  summary: string;
  blog?: {
    id: string;
  };
}

function normalizeYoutubeVideos(videos: GeneratedYoutubeVideo[]): HomepageVideo[] {
  return [...videos]
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
    .slice(0, 3)
    .map((video) => ({
      id: video.id,
      title: video.title,
      shortTitle: video.title,
      stage: "published",
      date: video.publishedAt.slice(0, 10),
      duration: video.duration,
      thumbnail: video.thumbnail,
      thumbnailAlt: `Thumbnail for ${video.title}`,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      summary: video.summary,
      blog: video.companionBlogId ? { id: video.companionBlogId } : undefined,
    }));
}

export const homepageYoutubeVideos = normalizeYoutubeVideos(
  generatedYoutubeVideosSchema.parse(youtubeVideos),
);
