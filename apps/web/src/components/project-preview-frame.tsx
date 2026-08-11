import { PreviewFrame } from "@/components/preview-frame";
import { projectPreviewVariants } from "@/lib/project-preview-data";
import type { PlaceholderText, PreviewProject } from "@/lib/project-preview-data";

/**
 * The projects previews reuse the videos preview scaffolding, pointed at their own index
 * and variant list, so both review surfaces stay visually identical at the frame level.
 */
export function ProjectPreviewFrame({
  command,
  children,
}: {
  command: string;
  children: React.ReactNode;
}) {
  return (
    <PreviewFrame
      command={command}
      indexLabel="index"
      indexTo="/preview/projects"
      variants={projectPreviewVariants}
    >
      {children}
    </PreviewFrame>
  );
}

/**
 * Renders unverified copy with a visible marker, so no reviewer can mistake placeholder
 * text for a real claim about a project.
 */
export function Draft({ value, className = "" }: { value: PlaceholderText; className?: string }) {
  if (!value.placeholder) {
    return <span className={className}>{value.text}</span>;
  }

  return (
    <span className={className}>
      <span
        className="border-border text-muted-foreground mr-2 border border-dashed px-1 text-[0.625rem] tracking-widest uppercase align-[0.15em]"
        title="Placeholder copy — not a verified claim"
      >
        draft
      </span>
      {value.text}
    </span>
  );
}

/**
 * A reserved media frame for a project with no local asset. It states what the real asset
 * should be rather than showing an invented image.
 */
export function ReservedMedia({ intent }: { intent: string }) {
  return (
    <div className="border-border text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-2 border border-dashed p-6 text-center">
      <span className="text-foreground text-xs tracking-widest uppercase">no asset yet</span>
      <span className="max-w-sm text-xs leading-relaxed">{intent}</span>
    </div>
  );
}

export function ProjectEvidenceRail({ project }: { project: PreviewProject }) {
  return (
    <div className="border-border mt-8 max-w-2xl border">
      <p className="border-border text-muted-foreground border-b px-4 py-2 text-xs tracking-widest">
        evidence
      </p>

      <dl className="bg-border grid gap-px">
        {project.links.map((link) => (
          <div key={link.href} className="bg-background grid grid-cols-[5rem_1fr] gap-3 px-4 py-2">
            <dt className="text-muted-foreground text-xs">{link.label}</dt>
            <dd className="min-w-0 text-xs break-all">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent border-accent hover:text-foreground border-b transition-colors"
              >
                {link.host}
                {new URL(link.href).pathname.replace(/\/$/, "")} ↗
              </a>
            </dd>
          </div>
        ))}

        {project.facts.map((fact) => (
          <div key={fact.key} className="bg-background grid grid-cols-[5rem_1fr] gap-3 px-4 py-2">
            <dt className="text-muted-foreground text-xs">{fact.key}</dt>
            <dd className="text-muted-foreground text-xs">
              <Draft value={fact.value} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
