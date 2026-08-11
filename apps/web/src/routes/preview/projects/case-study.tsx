import { createFileRoute } from "@tanstack/react-router";

import {
  Draft,
  ProjectEvidenceRail,
  ProjectPreviewFrame,
} from "@/components/project-preview-frame";
import type { PreviewProject } from "@/lib/project-preview-data";
import { previewProjects } from "@/lib/project-preview-data";
import { previewPageSeo } from "@/lib/seo";

const seo = previewPageSeo({
  title: "Projects preview — case study",
  description: "Editorial case-study index variant for a projects section.",
  pathname: "/preview/projects/case-study",
});

export const Route = createFileRoute("/preview/projects/case-study")({
  head: () => seo,
  component: ProjectsCaseStudyPreview,
});

function ProjectsCaseStudyPreview() {
  return (
    <ProjectPreviewFrame command="projects --index --editorial">
      <h1 className="section-title">projects</h1>

      <p className="text-muted-foreground mb-12 max-w-2xl text-sm leading-relaxed">
        Two I built and still use. Each entry opens with the sentence that made it worth building;
        the rail at the bottom is the part you can check yourself.
      </p>

      <div>
        {previewProjects.map((project, index) => (
          <Entry key={project.id} project={project} index={index} />
        ))}
      </div>

      <p className="border-border text-muted-foreground mt-12 border-t pt-6 text-xs">
        The rest is on{" "}
        <a
          href="https://github.com/Pranav-Bobde"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-foreground transition-colors"
        >
          github ↗
        </a>
      </p>
    </ProjectPreviewFrame>
  );
}

function Entry({ project, index }: { project: PreviewProject; index: number }) {
  return (
    <article className="border-border border-t py-10 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-accent text-xs tracking-widest">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h2 className="text-xl leading-tight font-bold md:text-2xl">{project.name}</h2>
      </div>

      <p className="text-foreground max-w-[52ch] text-lg leading-snug">
        <Draft value={project.thesis} />
      </p>

      <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-relaxed">
        <Draft value={project.context} />
      </p>

      <ProjectEvidenceRail project={project} />
    </article>
  );
}
