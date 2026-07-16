import { Link, createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { StageMark } from "@/components/video-stage-mark";
import { previewPageSeo } from "@/lib/seo";
import { previewVideos } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Videos preview — paired notes",
  description: "Blog and video paired publishing variant with per-topic revision notes.",
  pathname: "/preview/videos/paired",
});

export const Route = createFileRoute("/preview/videos/paired")({
  head: () => seo,
  component: VideosPairedPreview,
});

function VideosPairedPreview() {
  return (
    <PreviewFrame command="videos --paired --show-notes">
      <h1 className="section-title">paired notes</h1>

      <p className="text-muted-foreground mb-10 max-w-2xl text-sm leading-relaxed">
        One topic, published twice. The post carries the argument, the video carries the walkthrough,
        and the notes record what changed after either one went out.
      </p>

      <div className="space-y-12">
        {previewVideos.map((video) => (
          <article key={video.id} className="border-border border-t pt-6">
            <h2 className="mb-1 leading-snug font-bold">{video.shortTitle}</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl text-sm leading-relaxed">
              {video.summary}
            </p>

            <div className="bg-border border-border grid grid-cols-1 gap-px border sm:grid-cols-2">
              <div className="bg-background p-4">
                <div className="text-accent mb-2 text-xs tracking-widest">read</div>
                <Link
                  to="/blogs/$id"
                  params={{ id: video.blog.id }}
                  className="hover:text-accent text-sm leading-snug transition-colors"
                >
                  {video.blog.title}
                </Link>
                <div className="text-muted-foreground mt-2 text-xs">{video.blog.readingTime}</div>
              </div>

              <div className="bg-background p-4">
                <div className="text-accent mb-2 text-xs tracking-widest">watch</div>
                <div className="text-sm leading-snug">{video.title}</div>
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 text-xs">
                  <StageMark stage={video.stage} />
                  <span>{video.duration}</span>
                </div>
              </div>
            </div>

            <ol className="border-border mt-6 ml-1 space-y-4 border-l pl-5 text-sm">
              {video.notes.map((note) => (
                <li key={`${note.date}-${note.label}`} className="relative">
                  <span
                    className="bg-background border-accent absolute top-1.5 -left-[1.4rem] h-1.5 w-1.5 rounded-full border"
                    aria-hidden="true"
                  />
                  <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-3 text-xs">
                    <span>{note.date}</span>
                    <span className="text-foreground">{note.label}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{note.body}</p>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </PreviewFrame>
  );
}
