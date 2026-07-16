import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/home-content";
import { HomeVideoLibrarySection } from "@/components/home-video-library-section";
import { PreviewFrame } from "@/components/preview-frame";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview — after hero",
  description: "Homepage preview with the video library directly after the intro.",
  pathname: "/preview/home-videos/after-hero",
});

export const Route = createFileRoute("/preview/home-videos/after-hero")({
  head: () => seo,
  component: HomeVideosAfterHeroPreview,
});

function HomeVideosAfterHeroPreview() {
  return (
    <PreviewFrame
      command="home --videos --after-hero"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <HomeContent
        videoPlacement="after-hero"
        videoSection={<HomeVideoLibrarySection variant="feature-first" />}
      />
    </PreviewFrame>
  );
}
