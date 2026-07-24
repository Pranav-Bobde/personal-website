import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { StageMark } from "@/components/video-stage-mark";
import { siteConfig } from "@/lib/config";
import type { PreviewVideo } from "@/lib/video-preview-data";
import { getPublishedVideos } from "@/lib/video-preview-data";
import { getVideoThumbnailSrcSet } from "@/lib/video-preview-data";

type HomeVideoLibraryVariant = "feature-first" | "shelf" | "compact";

interface HomeVideoLibrarySectionProps {
  variant: HomeVideoLibraryVariant;
}

export function HomeVideoLibrarySection({ variant }: HomeVideoLibrarySectionProps) {
  const videos = getPublishedVideos().slice(0, 3);
  const VariantComponent = variantComponents[variant];

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="border-border mt-12 border-t pt-12">
      <SectionHeader variant={variant} />
      <VariantComponent videos={videos} />
    </section>
  );
}

const variantComponents = {
  "feature-first": FeatureFirstVideos,
  shelf: ShelfVideos,
  compact: CompactVideos,
} satisfies Record<HomeVideoLibraryVariant, (props: { videos: PreviewVideo[] }) => ReactNode>;

const fullWidthThumbnailSizes = "(max-width: 768px) calc(100vw - 2rem), 768px";
const cardThumbnailSizes = "(max-width: 640px) calc(100vw - 4rem), 384px";

function FeatureFirstVideos({ videos }: { videos: PreviewVideo[] }) {
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
          data-video-layout="archive-row"
          className="mt-4 grid items-start gap-4 md:grid-cols-[20rem_minmax(0,1fr)] md:items-stretch"
        >
          <div data-video-layout="mini-grid" className="grid gap-4">
            {rest.map((video) => (
              <SmallCard key={video.id} video={video} standalone />
            ))}
          </div>
          <UpcomingChannelCta />
        </div>
      ) : null}
    </>
  );
}

function UpcomingChannelCta() {
  return (
    <aside className="border-border flex min-h-56 flex-col justify-between border p-5 md:h-full">
      <div>
        <div className="text-muted-foreground text-xs">
          <span className="text-accent">$</span> follow --signal-only
        </div>
        <h3 className="mt-3 text-lg font-bold">Next video is brewing</h3>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          Practical AI-agent workflows, dev-tool rabbit holes, and the parts that broke before they
          worked.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <a
          href={siteConfig.social.youtube}
          className="text-accent hover:text-foreground border-accent border-b"
          target="_blank"
          rel="noopener noreferrer"
        >
          youtube channel →
        </a>
        <Link
          to="/newsletter"
          className="text-accent hover:text-foreground border-accent border-b"
        >
          read the notes →
        </Link>
      </div>
    </aside>
  );
}

function ShelfVideos({ videos }: { videos: PreviewVideo[] }) {
  return (
    <div className="bg-border border-border grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <SmallCard key={video.id} video={video} />
      ))}
    </div>
  );
}

function CompactVideos({ videos }: { videos: PreviewVideo[] }) {
  const [lead, ...rest] = videos;

  if (!lead) {
    return null;
  }

  return (
    <div className="border-border border">
      <article className="border-border flex flex-col border-b sm:flex-row">
        <div className="sm:w-56 sm:shrink-0">
          <Thumbnail video={lead} priority sizes={cardThumbnailSizes} />
        </div>
        <div className="p-4">
          <VideoMeta video={lead} />
          <h3 className="mt-2 leading-tight font-bold">{lead.shortTitle}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{lead.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <WatchLink video={lead} />
            <PostLink video={lead} />
          </div>
        </div>
      </article>
      {rest.map((video) => (
        <article
          key={video.id}
          className="border-border flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
        >
          <span className="text-accent mt-0.5 text-xs">↳</span>
          <div className="min-w-0 flex-1">
            <VideoMeta video={video} compact />
            <Link
              to="/blogs/$id"
              params={{ id: video.blog.id }}
              className="hover:text-accent mt-1 block text-sm leading-snug font-bold transition-colors"
            >
              {video.shortTitle}
            </Link>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">{video.duration}</span>
        </article>
      ))}
    </div>
  );
}

function SectionHeader({ variant }: { variant: HomeVideoLibraryVariant }) {
  const copy = {
    "feature-first": "Recent uploads from the channel.",
    shelf: "A small shelf of published YouTube work, kept close to the existing blog-card rhythm.",
    compact: "A quieter video block, just enough to route people to the channel and companion posts.",
  } satisfies Record<HomeVideoLibraryVariant, string>;

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
        {copy[variant]}
      </p>
    </div>
  );
}

function SmallCard({ video, standalone = false }: { video: PreviewVideo; standalone?: boolean }) {
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
  video: PreviewVideo;
  priority?: boolean;
}) {
  const thumbnailContent = (
    <>
      <img
        src={video.thumbnail}
        srcSet={getVideoThumbnailSrcSet(video.thumbnail)}
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

  if (video.youtubeUrl) {
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

  return (
    <Link
      to="/blogs/$id"
      params={{ id: video.blog.id }}
      className="border-border relative block border"
    >
      {thumbnailContent}
    </Link>
  );
}

function VideoMeta({
  video,
  className,
  compact = false,
}: {
  video: PreviewVideo;
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

function WatchLink({ video }: { video: PreviewVideo }) {
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

function PostLink({ video }: { video: PreviewVideo }) {
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
