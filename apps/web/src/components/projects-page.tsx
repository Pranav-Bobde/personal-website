import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";

import { ProjectLogbookRows } from "@/components/project-logbook-rows";
import { Draft, ProjectEvidenceRail } from "@/components/project-preview-frame";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import type { PreviewProject } from "@/lib/project-preview-data";
import { previewProjects } from "@/lib/project-preview-data";

const hotkeyOptions = {
  preventDefault: true,
  stopPropagation: true,
  ignoreInputs: true,
};

export function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<PreviewProject | null>(null);
  const { activeIndex, setActiveIndex } = useKeyboardNavigation({
    itemSelector: ".project-log-detail-item",
    enabled: !selectedProject,
    onEnter: (element) => {
      const href = element.getAttribute("data-href");
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    },
    searchEnabled: false,
  });

  const openProjectPreview = (project: PreviewProject) => {
    const projectIndex = previewProjects.findIndex(({ id }) => id === project.id);
    if (projectIndex >= 0) {
      setActiveIndex(projectIndex);
    }
    setSelectedProject(project);
  };

  useHotkey(
    "Space",
    () => {
      if (activeIndex >= 0) {
        setSelectedProject(previewProjects[activeIndex] ?? null);
      }
    },
    { ...hotkeyOptions, enabled: !selectedProject && activeIndex >= 0 },
  );

  useHotkey("Escape", () => setSelectedProject(null), {
    ...hotkeyOptions,
    enabled: Boolean(selectedProject),
  });

  return (
    <div className="animate-fade-in">
      <h1 className="section-title">projects</h1>

      <p className="text-muted-foreground mb-8 text-sm">
        <span className="hidden sm:inline">
          <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">j/k</kbd> selects •{" "}
          <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">space</kbd> preview-details •{" "}
          <kbd className="bg-secondary rounded px-1 py-0.5 text-xs">enter</kbd> opens source
        </span>
        <span className="sm:hidden">tap a project to preview</span>
      </p>

      <ProjectLogbookRows
        projects={previewProjects}
        activeIndex={activeIndex}
        itemClassName="project-log-detail-item"
        onPreview={openProjectPreview}
      />

      <p className="border-border text-muted-foreground mt-8 border-t pt-4 text-xs">
        {previewProjects.length} projects · details on demand
      </p>

      {selectedProject ? (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      ) : null}
    </div>
  );
}

function ProjectDetailModal({
  project,
  onClose,
}: {
  project: PreviewProject;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
      className="bg-background/85 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm md:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <article className="border-border bg-background max-h-[min(48rem,calc(100dvh-2rem))] w-full max-w-2xl overflow-y-auto border p-5 shadow-2xl md:p-8">
        <header className="border-border mb-8 flex items-start justify-between gap-6 border-b pb-5">
          <div>
            <p className="text-accent mb-2 text-xs tracking-widest">case study</p>
            <h2 id="project-detail-title" className="text-2xl leading-tight font-bold">
              {project.name}
            </h2>
          </div>
          <button
            type="button"
            aria-label={`Close ${project.name} details`}
            onClick={onClose}
            className="text-muted-foreground hover:text-accent shrink-0 text-xs transition-colors"
          >
            [esc] close
          </button>
        </header>

        <p className="text-foreground text-lg leading-snug">
          <Draft value={project.thesis} />
        </p>
        <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
          <Draft value={project.context} />
        </p>

        <ProjectEvidenceRail project={project} />

        <p className="text-muted-foreground mt-6 text-xs">Press Esc or click outside to close.</p>
      </article>
    </div>
  );
}
