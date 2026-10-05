import { Link } from "@tanstack/react-router";

import { StageMark } from "@/components/video-stage-mark";
import { siteConfig } from "@/lib/config";
import type { HomepageVideo } from "@/lib/youtube-video-data";
import { homepageYoutubeVideos } from "@/lib/youtube-video-data";

export function HomeVideoLibrarySection() {
  const videos = homepageYoutubeVideos;

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="border-border mt-12 border-t pt-12">
      <SectionHeader />
      <FeatureFirstVideos videos={videos} />
    </section>
  );
}

const fullWidthThumbnailSizes = "(max-width: 768px) calc(100vw - 2rem), 768px";
const cardThumbnailSizes = "(max-width: 640px) calc(100vw - 4rem), 384px";

function FeatureFirstVideos({ videos }: { videos: HomepageVideo[] }) {
  const [lead, ...rest] = videos;

  if (!lead) {
    return null;
  }

  return (
    <>
      <article data-video-layout="featured" className="border-border border">
        <Thumbnail video={lead} priority sizes={fullWidthThumbnailSizes} />
        <div className="p-4 sm:p-5">
          <VideoMeta video={lead} />
          <h3 className="mt-3 text-lg leading-tight font-bold">{lead.shortTitle}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{lead.summary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <WatchLink video={lead} />
            <PostLink video={lead} />
          </div>
        </div>
      </article>

      {rest.length > 0 ? (
        <div
          data-video-layout="archive-grid"
          className="mt-4 grid items-stretch gap-4 sm:grid-cols-2"
        >
          {rest.map((video) => (
            <SmallCard key={video.id} video={video} standalone />
          ))}
        </div>
      ) : null}
    </>
  );
}

function SectionHeader() {
  return (
    <div className="mb-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="section-title">videos</h2>
        <a
          href={siteConfig.social.youtube}
          className="text-accent hover:text-foreground border-accent border-b text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          youtube channel [y] →
        </a>
      </div>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
        Recent uploads from the channel.
      </p>
    </div>
  );
}

function SmallCard({ video, standalone = false }: { video: HomepageVideo; standalone?: boolean }) {
  return (
    <article className={`bg-background p-4 ${standalone ? "border-border border" : ""}`}>
      <Thumbnail video={video} sizes={cardThumbnailSizes} />
      <VideoMeta video={video} className="mt-3" />
      <h3 className="mt-2 text-sm leading-snug font-bold">{video.shortTitle}</h3>
      <p className="text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed">
        {video.summary}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <WatchLink video={video} />
        <PostLink video={video} />
      </div>
    </article>
  );
}

function Thumbnail({
  sizes,
  video,
  priority = false,
}: {
  sizes: string;
  video: HomepageVideo;
  priority?: boolean;
}) {
  const thumbnailContent = (
    <>
      <img
        src={video.thumbnail}
        sizes={sizes}
        alt={video.thumbnailAlt}
        width={1280}
        height={720}
        loading={priority ? "eager" : "lazy"}
        className="block aspect-video w-full object-cover"
      />
      <span className="bg-background/90 text-foreground absolute right-2 bottom-2 px-1.5 py-0.5 text-xs">
        {video.duration}
      </span>
    </>
  );

  return (
    <a
      href={video.youtubeUrl}
      className="border-border relative block border"
      target="_blank"
      rel="noopener noreferrer"
    >
      {thumbnailContent}
    </a>
  );
}

function VideoMeta({
  video,
  className,
  compact = false,
}: {
  video: HomepageVideo;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs ${className ?? ""}`}
    >
      <StageMark stage={video.stage} />
      <span>{video.date}</span>
      {compact ? null : <span>{video.duration}</span>}
    </div>
  );
}

function WatchLink({ video }: { video: HomepageVideo }) {
  if (!video.youtubeUrl) {
    return null;
  }

  return (
    <a
      href={video.youtubeUrl}
      className="text-accent hover:text-foreground border-accent border-b text-xs"
      target="_blank"
      rel="noopener noreferrer"
    >
      watch video →
    </a>
  );
}

function PostLink({ video }: { video: HomepageVideo }) {
  if (!video.blog) {
    return null;
  }

  return (
    <Link
      to="/blogs/$id"
      params={{ id: video.blog.id }}
      className="text-accent hover:text-foreground border-accent border-b text-xs"
    >
      companion post →
    </Link>
  );
}
