import { Link, createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { StageMark } from "@/components/video-stage-mark";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { previewPageSeo } from "@/lib/seo";
import { previewVideos } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Videos preview — watch log",
  description: "Compact terminal watch log variant for a videos section.",
  pathname: "/preview/videos/log",
});

export const Route = createFileRoute("/preview/videos/log")({
  head: () => seo,
  component: VideosLogPreview,
});

function VideosLogPreview() {
  const { activeIndex } = useKeyboardNavigation({
    itemSelector: ".video-log-item",
    onEnter: (element) => {
      const href = element.getAttribute("data-href");
      if (href) {
        window.location.href = href;
      }
    },
    searchEnabled: false,
  });

  return (
    <PreviewFrame command="videos --log">
      <h1 className="section-title">watch log</h1>

      <p className="text-muted-foreground mb-8 text-sm">
        use <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">j/k</kbd> or{" "}
        <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">↑/↓</kbd> for entries •{" "}
        <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">enter</kbd> opens the paired post
      </p>

      <div className="space-y-1">
        {previewVideos.map((video, index) => (
          <div
            key={video.id}
            className={`video-log-item entry-item group ${activeIndex === index ? "is-active" : ""}`}
            tabIndex={0}
            data-href={`/blogs/${video.blog.id}`}
          >
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[6rem_3.5rem_1fr] sm:items-baseline">
              <span className="text-muted-foreground text-sm">{video.date}</span>
              <span className="text-muted-foreground hidden text-sm sm:block">
                {video.duration}
              </span>
              <div className="min-w-0">
                <h2 className="blog-item-title group-hover:text-foreground leading-relaxed font-medium">
                  {video.shortTitle}
                </h2>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <StageMark stage={video.stage} />
                  <span className="sm:hidden">{video.duration}</span>
                  <Link
                    to="/blogs/$id"
                    params={{ id: video.blog.id }}
                    className="hover:text-accent transition-colors"
                  >
                    ↳ post · {video.blog.readingTime}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="border-border text-muted-foreground mt-8 border-t pt-4 text-xs">
        {previewVideos.length} entries · watch URLs pending
      </p>
    </PreviewFrame>
  );
}
