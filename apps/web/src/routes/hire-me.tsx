import { createFileRoute } from "@tanstack/react-router";

import { HireMeContent } from "@/components/home-content";
import { hireMePageSeo } from "@/lib/seo";

const seo = hireMePageSeo();

export const Route = createFileRoute("/hire-me")({
  head: () => seo,
  component: HireMePage,
});

function HireMePage() {
  return <HireMeContent />;
}
