import { Link, createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { StageMark } from "@/components/video-stage-mark";
import { previewPageSeo } from "@/lib/seo";
import type { PreviewVideo } from "@/lib/video-preview-data";
import { getVideoThumbnailSrcSet } from "@/lib/video-preview-data";
import { previewVideos } from "@/lib/video-preview-data";

const fullWidthThumbnailSizes = "(max-width: 768px) calc(100vw - 2rem), 768px";
const cardThumbnailSizes = "(max-width: 640px) calc(100vw - 4rem), 384px";

const seo = previewPageSeo({
  title: "Videos preview — library",
  description: "Thumbnail-first video library variant for a videos section.",
  pathname: "/preview/videos/library",
});

export const Route = createFileRoute("/preview/videos/library")({
  head: () => seo,
  component: VideosLibraryPreview,
});

function VideosLibraryPreview() {
  const [lead, ...rest] = previewVideos;

  return (
    <PreviewFrame command="videos --library">
      <h1 className="section-title">library</h1>

      {lead ? (
        <article className="mb-12">
          <Thumbnail video={lead} priority />
          <div className="mt-4">
            <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-3 text-xs">
              <StageMark stage={lead.stage} />
              <span>{lead.date}</span>
            </div>
            <h2 className="text-xl leading-tight font-bold md:text-2xl">{lead.title}</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
              {lead.summary}
            </p>
            <ol className="text-muted-foreground mt-4 space-y-1 text-xs">
              {lead.chapters.map((chapter, index) => (
                <li key={chapter}>
                  <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>{" "}
                  {chapter}
                </li>
              ))}
            </ol>
            <Link
              to="/blogs/$id"
              params={{ id: lead.blog.id }}
              className="text-accent hover:text-foreground border-accent mt-5 inline-block border-b text-sm"
            >
              read the post · {lead.blog.readingTime} →
            </Link>
          </div>
        </article>
      ) : null}

      <div className="bg-border border-border grid grid-cols-1 gap-px border sm:grid-cols-2">
        {rest.map((video) => (
          <article key={video.id} className="bg-background p-4">
            <Thumbnail video={video} />
            <div className="text-muted-foreground mt-3 mb-2 flex flex-wrap items-center gap-x-3 text-xs">
              <StageMark stage={video.stage} />
              <span>{video.date}</span>
            </div>
            <h2 className="text-sm leading-snug font-bold">{video.shortTitle}</h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{video.summary}</p>
            <Link
              to="/blogs/$id"
              params={{ id: video.blog.id }}
              className="hover:text-accent text-muted-foreground mt-3 inline-block text-xs transition-colors"
            >
              ↳ post · {video.blog.readingTime}
            </Link>
          </article>
        ))}
      </div>
    </PreviewFrame>
  );
}

function Thumbnail({ video, priority = false }: { video: PreviewVideo; priority?: boolean }) {
  return (
    <div className="border-border relative border">
      <img
        src={video.thumbnail}
        srcSet={getVideoThumbnailSrcSet(video.thumbnail)}
        sizes={priority ? fullWidthThumbnailSizes : cardThumbnailSizes}
        alt={video.thumbnailAlt}
        width={1280}
        height={720}
        loading={priority ? "eager" : "lazy"}
        className="block aspect-video w-full object-cover"
      />
      <span className="bg-background/90 text-foreground absolute right-2 bottom-2 px-1.5 py-0.5 text-xs">
        {video.duration}
      </span>
    </div>
  );
}
