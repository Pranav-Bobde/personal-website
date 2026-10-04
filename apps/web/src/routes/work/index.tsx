import { createFileRoute } from "@tanstack/react-router";

import { WorkOverviewContent } from "@/components/home-content";
import { workOverviewPageSeo } from "@/lib/seo";

export const Route = createFileRoute("/work/")({
  head: () => workOverviewPageSeo(),
  component: WorkOverviewPage,
});

function WorkOverviewPage() {
  return <WorkOverviewContent />;
}
