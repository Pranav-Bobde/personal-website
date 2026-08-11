import { createFileRoute } from "@tanstack/react-router";

import { Draft, ProjectPreviewFrame, ReservedMedia } from "@/components/project-preview-frame";
import type { PreviewProject } from "@/lib/project-preview-data";
import { previewProjects } from "@/lib/project-preview-data";
import { previewPageSeo } from "@/lib/seo";

const seo = previewPageSeo({
  title: "Projects preview — showcase",
  description: "Media-forward capture-plate variant for a projects section.",
  pathname: "/preview/projects/showcase",
});

export const Route = createFileRoute("/preview/projects/showcase")({
  head: () => seo,
  component: ProjectsShowcasePreview,
});

function ProjectsShowcasePreview() {
  return (
    <ProjectPreviewFrame command="projects --showcase">
      <h1 className="section-title">projects</h1>

      <p className="text-muted-foreground mb-4 max-w-2xl text-sm leading-relaxed">
        Two things I built. The capture comes first; the writeup sits underneath.
      </p>

      <p className="border-border text-muted-foreground mb-12 border border-dashed px-3 py-2 text-xs leading-relaxed">
        <span className="text-foreground">honest empty states</span> — every plate below is a
        reserved frame with a shot instruction. No screenshot has been faked or borrowed from
        another project.
      </p>

      {previewProjects.map((project, index) => (
        <Stage key={project.id} project={project} isFirst={index === 0} />
      ))}
    </ProjectPreviewFrame>
  );
}

function getChromeLabel(project: PreviewProject) {
  const primaryHost = project.links[0]?.host ?? project.id;
  return `${primaryHost} · capture`;
}

function Stage({ project, isFirst }: { project: PreviewProject; isFirst: boolean }) {
  return (
    <section
      className={isFirst ? undefined : "border-border mt-12 border-t pt-12"}
      aria-labelledby={`${project.id}-name`}
    >
      <CapturePlate chrome={getChromeLabel(project)}>
        <ReservedMedia intent={project.media.intent} />
      </CapturePlate>

      <h2 id={`${project.id}-name`} className="mt-5 text-xl leading-tight font-bold md:text-2xl">
        {project.name}
      </h2>

      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
        <Draft value={project.thesis} />
      </p>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {project.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent border-accent hover:text-foreground border-b transition-colors"
          >
            {link.label} →
          </a>
        ))}
      </div>

      <DemoEmbed project={project} />
    </section>
  );
}

/**
 * The signature element: a media frame with a monospace chrome bar welded to its top edge,
 * so a capture reads as an artifact in a terminal rather than a screenshot in a card. The
 * bar renders identically whether the frame holds an image or a reserved empty state.
 */
function CapturePlate({ chrome, children }: { chrome: string; children: React.ReactNode }) {
  return (
    <figure className="border-border border">
      <figcaption className="border-border text-muted-foreground flex items-baseline justify-between gap-3 border-b px-2 py-1 text-xs">
        <span className="min-w-0 truncate">{chrome}</span>
        <span className="text-foreground shrink-0">16:9</span>
      </figcaption>
      {children}
    </figure>
  );
}

/**
 * The one real media asset that exists today. Rendered below the plate rather than as the
 * hero: the X embed is a fixed ~460px box, so it cannot fill a 16:9 stage without cropping.
 * Uses the same script-free iframe as the blog renderer, and always keeps a visible link so
 * the section still works if the post or the embed host goes away.
 */
function DemoEmbed({ project }: { project: PreviewProject }) {
  const embed = project.media.embed;
  if (!embed) {
    return null;
  }

  return (
    <div className="border-border mt-8 border">
      <p className="border-border text-muted-foreground border-b px-3 py-2 text-xs">
        <span className="text-foreground">the demo that exists today</span> — embedded from X,
        loaded lazily, no tracking parameters.
      </p>

      <iframe
        src={embed.embedUrl}
        title={embed.title}
        loading="lazy"
        className="block min-h-[460px] w-full border-0"
        allowFullScreen
      />

      <p className="border-border border-t px-3 py-2 text-xs">
        <a
          href={embed.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:text-foreground transition-colors"
        >
          Open the demo on X ↗
        </a>
      </p>
    </div>
  );
}
