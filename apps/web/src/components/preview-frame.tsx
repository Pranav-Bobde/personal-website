import { useLocation } from "@tanstack/react-router";

import { previewVariants } from "@/lib/video-preview-data";

interface PreviewVariantNavItem {
  name: string;
  to: string;
}

interface PreviewFrameProps {
  command: string;
  children: React.ReactNode;
  indexLabel?: string;
  indexTo?: string;
  variants?: readonly PreviewVariantNavItem[];
}

/**
 * Wraps the /preview/videos routes with the review scaffolding: a marker saying this is
 * not a shipped surface, and a switcher for comparing the variants side by side.
 */
export function PreviewFrame({
  command,
  children,
  indexLabel = "index",
  indexTo = "/preview/videos",
  variants = previewVariants,
}: PreviewFrameProps) {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <div className="animate-fade-in">
      <div className="border-border text-muted-foreground mb-6 border border-dashed px-3 py-2 text-xs leading-relaxed">
        <span className="text-foreground">preview</span> — not in nav, not in the sitemap, noindex.
        Sample data.
      </div>

      <nav className="border-border mb-8 flex flex-wrap gap-x-5 gap-y-2 border-b pb-4 text-sm">
        <a
          href={indexTo}
          className={`nav-item ${isCurrentPath(pathname, indexTo) ? "active" : ""}`}
        >
          {indexLabel}
        </a>
        {variants.map((variant) => (
          <a
            key={variant.to}
            href={variant.to}
            className={`nav-item ${isCurrentPath(pathname, variant.to) ? "active" : ""}`}
          >
            {variant.name}
          </a>
        ))}
      </nav>

      <p className="text-muted-foreground mb-8 text-sm">
        <span className="text-accent">$</span> {command}
      </p>

      {children}
    </div>
  );
}

function isCurrentPath(pathname: string, target: string) {
  return pathname === target || pathname === `${target}/`;
}
