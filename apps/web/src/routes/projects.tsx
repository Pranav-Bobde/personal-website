import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "@/components/projects-page";
import { projectsPageSeo } from "@/lib/seo";

const seo = projectsPageSeo();

export const Route = createFileRoute("/projects")({
  head: () => seo,
  component: ProjectsRoute,
});

function ProjectsRoute() {
  return <ProjectsPage />;
}
