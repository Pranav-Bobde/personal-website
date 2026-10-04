import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function WorkCaseStudy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
      </header>
      <div className="space-y-6 text-muted-foreground leading-relaxed">{children}</div>
      <nav
        aria-label="Case study navigation"
        className="border-border mt-12 flex flex-wrap gap-6 border-t pt-8 text-sm"
      >
        <Link to="/" className="text-accent hover:text-foreground border-accent border-b">
          Back to home
        </Link>
        <Link to="/work" className="text-accent hover:text-foreground border-accent border-b">
          Work &amp; background
        </Link>
      </nav>
    </article>
  );
}
