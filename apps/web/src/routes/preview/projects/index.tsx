import { createFileRoute } from "@tanstack/react-router";

import { PreviewFrame } from "@/components/preview-frame";
import { PreviewVariantList } from "@/components/preview-variant-list";
import { projectPreviewVariants } from "@/lib/project-preview-data";
import { previewPageSeo } from "@/lib/seo";

const seo = previewPageSeo({
  title: "Projects preview index",
  description: "Three layout variants for a projects section, for review.",
  pathname: "/preview/projects",
});

export const Route = createFileRoute("/preview/projects/")({
  head: () => seo,
  component: ProjectsPreviewIndex,
});

function ProjectsPreviewIndex() {
  return (
    <PreviewFrame
      command="projects --preview --list-variants"
      indexTo="/preview/projects"
      variants={projectPreviewVariants}
    >
      <h1 className="section-title">projects preview</h1>

      <p className="text-muted-foreground mb-10 max-w-2xl text-sm leading-relaxed">
        Three ways a projects section could work, using Better Mail and LaterCart. Each variant
        answers a different question: is a project something you read, something you watch, or
        another line in the build log?
      </p>

      <PreviewVariantList variants={projectPreviewVariants} />

      <section className="border-border mt-12 border-t pt-12">
        <h2 className="section-title">what is actually known</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            <span className="text-accent">·</span> Only four facts are verified, all from the brief:
            both GitHub repos, <span className="text-foreground">better-mail.app</span>, and the
            LaterCart demo post on X.
          </li>
          <li>
            <span className="text-accent">·</span> Every description, stack, status, and date is
            placeholder copy and is labelled{" "}
            <span className="border-border text-muted-foreground border border-dashed px-1 text-[0.625rem] tracking-widest uppercase">
              draft
            </span>{" "}
            on screen. Nothing here is a claim.
          </li>
          <li>
            <span className="text-accent">·</span> No screenshots exist in this repo, so media
            frames are reserved and state what the real asset should be. None is faked.
          </li>
          <li>
            <span className="text-accent">·</span> No LaterCart YouTube URL exists anywhere in this
            repo, so no YouTube treatment is built. The X post is the only real demo asset.
          </li>
        </ul>
      </section>

      <section className="border-border mt-12 border-t pt-12">
        <h2 className="section-title">what stays the same</h2>
        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>
            <span className="text-accent">·</span> Nothing is linked from the real nav or the
            homepage, and no preview route adds a global hotkey.
          </li>
          <li>
            <span className="text-accent">·</span> The dormant{" "}
            <span className="text-foreground">ProjectsPage</span> and{" "}
            <span className="text-foreground">project-data.ts</span> are untouched, and{" "}
            <span className="text-foreground">sections.projects</span> stays false.
          </li>
          <li>
            <span className="text-accent">·</span> These routes are noindex and stay out of the
            sitemap.
          </li>
        </ul>
      </section>
    </PreviewFrame>
  );
}
