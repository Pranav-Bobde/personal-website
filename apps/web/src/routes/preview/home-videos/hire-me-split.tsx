import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/home-content";
import { HomeVideoLibrarySection } from "@/components/home-video-library-section";
import { PreviewFrame } from "@/components/preview-frame";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview — hire me split",
  description: "Homepage preview with hiring sections moved into a top-level hire me route.",
  pathname: "/preview/home-videos/hire-me-split",
});

export const Route = createFileRoute("/preview/home-videos/hire-me-split")({
  head: () => seo,
  component: HomeVideosHireMeSplitPreview,
});

function HomeVideosHireMeSplitPreview() {
  return (
    <PreviewFrame
      command="home --videos --after-hero --hire-me-nav"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <HomeContent
        showHiringSections={false}
        videoPlacement="after-hero"
        videoSection={<HomeVideoLibrarySection variant="feature-first" />}
      />
    </PreviewFrame>
  );
}
