import { createFileRoute } from "@tanstack/react-router";

import { ProjectLogbookRows } from "@/components/project-logbook-rows";
import { ProjectPreviewFrame } from "@/components/project-preview-frame";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { previewProjects } from "@/lib/project-preview-data";
import { previewPageSeo } from "@/lib/seo";

const seo = previewPageSeo({
  title: "Projects preview — logbook",
  description: "Compact terminal build-log variant for a projects section.",
  pathname: "/preview/projects/logbook",
});

export const Route = createFileRoute("/preview/projects/logbook")({
  head: () => seo,
  component: ProjectsLogbookPreview,
});

function ProjectsLogbookPreview() {
  const { activeIndex } = useKeyboardNavigation({
    itemSelector: ".project-log-item",
    onEnter: (element) => {
      const href = element.getAttribute("data-href");
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    },
    searchEnabled: false,
  });

  return (
    <ProjectPreviewFrame command="projects --log">
      <h1 className="section-title">build log</h1>

      <p className="text-muted-foreground mb-8 text-sm">
        use <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">j/k</kbd> or{" "}
        <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">↑/↓</kbd> for entries •{" "}
        <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">enter</kbd> opens the source
      </p>

      <ProjectLogbookRows projects={previewProjects} activeIndex={activeIndex} />

      <p className="border-border text-muted-foreground mt-8 border-t pt-4 text-xs">
        {previewProjects.length} entries · dates and stack pending
      </p>
    </ProjectPreviewFrame>
  );
}
