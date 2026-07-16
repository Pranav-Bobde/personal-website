import { createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { PreviewVariantList } from "@/components/preview-variant-list";
import { previewPageSeo } from "@/lib/seo";
import { previewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Videos preview index",
  description: "Three layout variants for a videos section, for review.",
  pathname: "/preview/videos",
});

export const Route = createFileRoute("/preview/videos/")({
  head: () => seo,
  component: VideosPreviewIndex,
});

function VideosPreviewIndex() {
  return (
    <PreviewFrame command="videos --preview --list-variants">
      <h1 className="section-title">videos preview</h1>

      <p className="text-muted-foreground mb-10 max-w-2xl text-sm leading-relaxed">
        Three ways a videos section could work. The first row is the real token-cost video
        direction; the other rows reuse real blog topics as filler until the YouTube list is locked.
        Each variant answers a different question: is a video another line in the publishing log, is
        it the thumbnail, or is it the second half of a post?
      </p>

      <PreviewVariantList variants={previewVariants} />

      <section className="border-border mt-12 border-t pt-12">
        <h2 className="section-title">what stays the same</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            <span className="text-accent">·</span> The <kbd className="text-foreground">h</kbd> and{" "}
            <kbd className="text-foreground">b</kbd> hotkeys are untouched. No preview route adds a
            global key.
          </li>
          <li>
            <span className="text-accent">·</span> Nothing is linked from the real nav or the
            homepage.
          </li>
          <li>
            <span className="text-accent">·</span> Watch links are deliberately absent until the
            videos are live, so no placeholder URL can ship.
          </li>
        </ul>
      </section>
    </PreviewFrame>
  );
}
