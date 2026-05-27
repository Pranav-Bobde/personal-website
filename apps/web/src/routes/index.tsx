import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, MapPin } from "lucide-react";

import { siteConfig } from "@/lib/config";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  useHotkey("G", () => {
    window.open(siteConfig.social.github, "_blank", "noopener,noreferrer");
  });

  useHotkey("T", () => {
    window.open(siteConfig.social.twitter, "_blank", "noopener,noreferrer");
  });

  useHotkey("L", () => {
    window.open(siteConfig.social.linkedin, "_blank", "noopener,noreferrer");
  });

  useHotkey("E", () => {
    window.open(`mailto:${siteConfig.social.email}`, "_blank", "noopener,noreferrer");
  });

  return (
    <div className="animate-fade-in">
      <div className="space-y-8">
        <h1 className="text-4xl font-bold">{siteConfig.name}</h1>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground"
          style={{ animationDelay: "100ms" }}
        >
          <MapPin size={16} />
          <span>{siteConfig.location}</span>
        </div>

        <div
          className="flex items-center space-x-2 text-sm text-muted-foreground"
          style={{ animationDelay: "200ms" }}
        >
          <Briefcase size={16} />
          <span>{siteConfig.title}</span>
        </div>

        <div className="space-y-4" style={{ animationDelay: "300ms" }}>
          <p className="text-muted-foreground">{siteConfig.bio.main}</p>

          <div className="mt-6">
            <h3 className="mb-2 text-lg font-semibold">{siteConfig.bio.secondaryTitle}</h3>
            <p className="text-muted-foreground">{siteConfig.bio.secondary}</p>
          </div>
        </div>

        <div className="pt-8" style={{ animationDelay: "400ms" }}>
          <h2 className="section-title">links</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href={siteConfig.social.github}
              className="hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              [g] github
            </a>
            <a
              href={siteConfig.social.twitter}
              className="hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              [t] twitter
            </a>
            <a
              href={siteConfig.social.linkedin}
              className="hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              [l] linkedin
            </a>
            <a
              href={`mailto:${siteConfig.social.email}`}
              className="hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              [e] email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
