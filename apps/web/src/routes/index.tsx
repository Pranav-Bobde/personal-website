import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute } from "@tanstack/react-router";

import { HomeContent } from "@/components/home-content";
import { HomeVideoLibrarySection } from "@/components/home-video-library-section";
import { siteConfig } from "@/lib/config";
import { homePageSeo } from "@/lib/seo";

const homeSeo = homePageSeo();

export const Route = createFileRoute("/")({
  head: () => homeSeo,
  component: Home,
});

function Home() {
  useHotkey("G", () => {
    window.open(siteConfig.social.github, "_blank", "noopener,noreferrer");
  });

  useHotkey("T", () => {
    window.open(siteConfig.social.twitter, "_blank", "noopener,noreferrer");
  });

  useHotkey("Y", () => {
    window.open(siteConfig.social.youtube, "_blank", "noopener,noreferrer");
  });

  useHotkey("L", () => {
    window.open(siteConfig.social.linkedin, "_blank", "noopener,noreferrer");
  });

  useHotkey("R", () => {
    window.open(siteConfig.social.resume, "_blank", "noopener,noreferrer");
  });

  useHotkey("E", () => {
    window.open(`mailto:${siteConfig.social.email}`, "_blank", "noopener,noreferrer");
  });

  return (
    <HomeContent
      showHiringSections={false}
      videoPlacement="after-hero"
      videoSection={<HomeVideoLibrarySection variant="feature-first" />}
    />
  );
}
