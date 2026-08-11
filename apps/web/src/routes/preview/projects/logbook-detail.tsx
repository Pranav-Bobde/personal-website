import { createFileRoute } from "@tanstack/react-router";

import { ProjectPreviewFrame } from "@/components/project-preview-frame";
import { ProjectsPage } from "@/components/projects-page";
import { previewPageSeo } from "@/lib/seo";

const seo = previewPageSeo({
  title: "Projects preview — logbook with detail",
  description: "Compact project logbook with case-study details in a keyboard modal.",
  pathname: "/preview/projects/logbook-detail",
});

export const Route = createFileRoute("/preview/projects/logbook-detail")({
  head: () => seo,
  component: ProjectsLogbookDetailPreview,
});

function ProjectsLogbookDetailPreview() {
  return (
    <ProjectPreviewFrame command="projects --log --detail-on-space">
      <ProjectsPage />
    </ProjectPreviewFrame>
  );
}
