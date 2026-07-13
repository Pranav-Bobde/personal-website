import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, MapPin } from "lucide-react";

import { siteConfig } from "@/lib/config";
import { homePageSeo } from "@/lib/seo";

const homeSeo = homePageSeo();

export const Route = createFileRoute("/")({
  head: () => homeSeo,
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

  useHotkey("R", () => {
    window.open(siteConfig.social.resume, "_blank", "noopener,noreferrer");
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
        </div>

        <div className="space-y-16 pt-8" style={{ animationDelay: "500ms" }}>
          <section>
            <h2 className="section-title">my core values</h2>
            <p className="text-muted-foreground mb-7 max-w-2xl text-sm">
              Before we work together, you should know what I actually value and how I operate.
              These aren't posters on a wall — they're how I make decisions when nobody's watching.
            </p>
            <div className="bg-border border-border grid grid-cols-1 gap-px border sm:grid-cols-2">
              {siteConfig.coreValues.map((value, index) => (
                <div key={value.title} className="bg-background p-5 sm:p-6">
                  <div className="text-accent text-xs tracking-widest">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-2 mb-2 font-bold">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-title">we'd be a fit if…</h2>
            <p className="text-muted-foreground mb-7 max-w-2xl text-sm">
              The kind of team where I do my best work.
            </p>
            <div className="border-border border">
              {[
                <>
                  You're a <strong className="text-foreground">lean team that ships fast</strong> —
                  ownership over process, quality over bureaucracy.
                </>,
                <>
                  You're{" "}
                  <strong className="text-foreground">
                    open to new technology and better approaches
                  </strong>
                  , not locked into legacy habits.
                </>,
                <>
                  You{" "}
                  <strong className="text-foreground">
                    hire for capability and give it real autonomy
                  </strong>
                  , rather than staffing a role to execute instructions.
                </>,
                <>
                  You treat{" "}
                  <strong className="text-foreground">
                    tools, resources, and work-life flexibility
                  </strong>{" "}
                  as inputs to good engineering, not perks.
                </>,
                <>
                  You value{" "}
                  <strong className="text-foreground">first-principles engineering</strong> over
                  resume-driven hype.
                </>,
              ].map((item, index) => (
                <div
                  key={index}
                  className="border-border text-muted-foreground flex items-start gap-3 border-b px-5 py-3.5 text-sm last:border-b-0"
                >
                  <span className="text-accent font-bold">[✓]</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-7 text-sm">
              If that sounds like your team,{" "}
              <a
                href={`mailto:${siteConfig.social.email}?subject=Work%20with%20Pranav`}
                className="text-accent hover:text-foreground border-accent border-b"
                target="_blank"
                rel="noopener noreferrer"
              >
                let's talk [e]
              </a>
              .
            </p>
          </section>
        </div>

        <div className="pt-8" style={{ animationDelay: "600ms" }}>
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
              href={siteConfig.social.resume}
              className="hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              [r] resume
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
