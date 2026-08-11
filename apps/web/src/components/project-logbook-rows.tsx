import { Draft } from "@/components/project-preview-frame";
import type { PreviewProject } from "@/lib/project-preview-data";

export function ProjectLogbookRows({
  projects,
  activeIndex,
  itemClassName = "project-log-item",
  onPreview,
}: {
  projects: PreviewProject[];
  activeIndex: number;
  itemClassName?: string;
  onPreview?: (project: PreviewProject) => void;
}) {
  return (
    <div className="space-y-1">
      {projects.map((project, index) => (
        <ProjectLogbookRow
          key={project.id}
          project={project}
          isActive={activeIndex === index}
          itemClassName={itemClassName}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}

function ProjectLogbookRow({
  project,
  isActive,
  itemClassName,
  onPreview,
}: {
  project: PreviewProject;
  isActive: boolean;
  itemClassName: string;
  onPreview?: (project: PreviewProject) => void;
}) {
  const repo = project.links.find((link) => link.kind === "repo");

  return (
    <div
      className={`${itemClassName} entry-item group ${isActive ? "is-active" : ""}`}
      tabIndex={0}
      data-href={repo?.href}
      onClick={() => onPreview?.(project)}
    >
      <div className="min-w-0">
        <h2 className="blog-item-title group-hover:text-foreground leading-relaxed font-medium">
          {project.name}
        </h2>

        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          <Draft value={project.thesis} />
        </p>

        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              onClick={(event) => event.stopPropagation()}
            >
              [{link.label}] ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
