import { createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { PreviewVariantList } from "@/components/preview-variant-list";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview index",
  description: "Three placement variants for adding videos to the homepage.",
  pathname: "/preview/home-videos",
});

export const Route = createFileRoute("/preview/home-videos/")({
  head: () => seo,
  component: HomeVideosPreviewIndex,
});

function HomeVideosPreviewIndex() {
  return (
    <PreviewFrame
      command="home --videos --list-placements"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <h1 className="section-title">home videos preview</h1>

      <p className="text-muted-foreground mb-10 max-w-2xl text-sm leading-relaxed">
        Same library-style video block, three homepage placements. The real homepage is unchanged
        except for the new YouTube social link; these routes are only for choosing where the section
        should land.
      </p>

      <PreviewVariantList variants={homeVideoPreviewVariants} />
    </PreviewFrame>
  );
}
