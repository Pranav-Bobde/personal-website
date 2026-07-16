import { createFileRoute } from "@tanstack/react-router";

import { HireMeContent } from "@/components/home-content";
import { PreviewFrame } from "@/components/preview-frame";
import { previewPageSeo } from "@/lib/seo";
import { homeVideoPreviewVariants } from "@/lib/video-preview-data";

const seo = previewPageSeo({
  title: "Home videos preview — hire me page",
  description: "Preview of the hiring page split out from the homepage.",
  pathname: "/preview/home-videos/hire-me",
});

export const Route = createFileRoute("/preview/home-videos/hire-me")({
  head: () => seo,
  component: HireMePreview,
});

function HireMePreview() {
  return (
    <PreviewFrame
      command="hire-me --values --resume --fit"
      indexTo="/preview/home-videos"
      variants={homeVideoPreviewVariants}
    >
      <HireMeContent />
    </PreviewFrame>
  );
}
