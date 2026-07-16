import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/home-content";
import { HomeVideoLibrarySection } from "@/components/home-video-library-section";
import { PreviewFrame } from "@/components/preview-frame";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview — before links",
  description: "Homepage preview with a compact videos block before the social links.",
  pathname: "/preview/home-videos/before-links",
});

export const Route = createFileRoute("/preview/home-videos/before-links")({
  head: () => seo,
  component: HomeVideosBeforeLinksPreview,
});

function HomeVideosBeforeLinksPreview() {
  return (
    <PreviewFrame
      command="home --videos --before-links"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <HomeContent
        videoPlacement="before-links"
        videoSection={<HomeVideoLibrarySection variant="compact" />}
      />
    </PreviewFrame>
  );
}
