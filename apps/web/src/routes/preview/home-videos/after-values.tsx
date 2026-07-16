import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/home-content";
import { HomeVideoLibrarySection } from "@/components/home-video-library-section";
import { PreviewFrame } from "@/components/preview-frame";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview — after values",
  description: "Homepage preview with the video shelf after the core values section.",
  pathname: "/preview/home-videos/after-values",
});

export const Route = createFileRoute("/preview/home-videos/after-values")({
  head: () => seo,
  component: HomeVideosAfterValuesPreview,
});

function HomeVideosAfterValuesPreview() {
  return (
    <PreviewFrame
      command="home --videos --after-values"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <HomeContent
        videoPlacement="after-values"
        videoSection={<HomeVideoLibrarySection variant="shelf" />}
      />
    </PreviewFrame>
  );
}
