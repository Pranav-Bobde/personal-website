import type { ReactNode } from "react";
import { Briefcase, Clock, Globe, MapPin } from "lucide-react";

import { NewsletterCta } from "@/components/newsletter-cta";
import { siteConfig } from "@/lib/config";

type HomeVideoPlacement = "after-hero" | "after-values" | "before-links";

interface HomeContentProps {
  showHiringSections?: boolean;
  videoSection?: ReactNode;
  videoPlacement?: HomeVideoPlacement;
}

export function HomeContent({
  showHiringSections = true,
  videoSection,
  videoPlacement = "before-links",
}: HomeContentProps) {
  const BodyComponent = showHiringSections ? HomeWithHiringSections : HomeWithoutHiringSections;

  return (
    <div className="animate-fade-in">
      <HomeHeader />
      <BodyComponent videoPlacement={videoPlacement} videoSection={videoSection} />
    </div>
  );
}

export function HireMeContent() {
  return (
    <div className="animate-fade-in">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold">hire me</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          The condensed version of how I work, what I value, and what kind of team gets the best out
          of me.
        </p>
      </header>

      <CoreValuesSection />
      <NotOnResumeSection />
      <FitSection />
    </div>
  );
}

function HomeWithHiringSections({
  videoPlacement,
  videoSection,
}: Pick<HomeContentProps, "videoPlacement" | "videoSection">) {
  return (
    <div>
      <PlacedVideo current={videoPlacement} target="after-hero">
        {videoSection}
      </PlacedVideo>
      <CoreValuesSection />
      <PlacedVideo current={videoPlacement} target="after-values">
        {videoSection}
      </PlacedVideo>
      <NotOnResumeSection />
      <FitSection />
      <PlacedVideo current={videoPlacement} target="before-links">
        {videoSection}
      </PlacedVideo>
      <NewsletterCta />
      <LinksSection />
    </div>
  );
}

function HomeWithoutHiringSections({
  videoPlacement,
  videoSection,
}: Pick<HomeContentProps, "videoPlacement" | "videoSection">) {
  return (
    <div>
      <PlacedVideo current={videoPlacement} target="after-hero">
        {videoSection}
      </PlacedVideo>
      <PlacedVideo current={videoPlacement} target="before-links">
        {videoSection}
      </PlacedVideo>
      <NewsletterCta />
      <LinksSection />
    </div>
  );
}

function PlacedVideo({
  children,
  current,
  target,
}: {
  children: ReactNode;
  current: HomeVideoPlacement | undefined;
  target: HomeVideoPlacement;
}) {
  return current === target ? <>{children}</> : null;
}

function HomeHeader() {
  return (
    <header className="space-y-5">
      <h1 className="text-4xl font-bold">{siteConfig.name}</h1>

      <div className="text-muted-foreground space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="shrink-0" />
          <span>{siteConfig.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0" />
          <span>{siteConfig.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={15} className="shrink-0" />
          <span>{siteConfig.availability}</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={15} className="shrink-0" />
          <span>{siteConfig.openTo}</span>
        </div>
      </div>

      <p className="text-muted-foreground max-w-2xl leading-relaxed">{siteConfig.bio.main}</p>
    </header>
  );
}

function CoreValuesSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">my core values</h2>
      <p className="text-muted-foreground mb-7 max-w-2xl text-sm">
        Before we work together, you should know what I actually value and how I operate. These
        aren't posters on a wall — they're how I make decisions when nobody's watching.
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
  );
}

function NotOnResumeSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">not on my resume</h2>
      <p className="text-foreground max-w-2xl text-base leading-relaxed">
        The thing a resume can't show: I think a developer should{" "}
        <span className="text-accent">go deep with the tools they use every day</span> — and spend
        real time optimizing how they work.
      </p>
      <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed">
        It took me two attempts over almost a year to move fully from VS Code to a
        Neovim/Tmux/Wezterm setup I built by hand. I like being blazingly fast and I love minimal
        tools — so once Vim motions clicked, Neovim/Tmux was inevitable. The payoff was real (ssh
        into prod, right logs in seconds), but the point is the conviction: go deep, remove friction,
        invest unreasonable time in the tools you live in.
      </p>
      <div className="mt-5 flex flex-wrap gap-5 text-sm">
        <a
          href="https://github.com/Pranav-Bobde/mynvimconf"
          className="text-accent hover:text-foreground border-accent border-b"
          target="_blank"
          rel="noopener noreferrer"
        >
          neovim config →
        </a>
        <a
          href="https://x.com/PranavBobde/status/1829277683810779258"
          className="text-accent hover:text-foreground border-accent border-b"
          target="_blank"
          rel="noopener noreferrer"
        >
          watch the workflow →
        </a>
      </div>
    </section>
  );
}

function FitSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
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
            <strong className="text-foreground">open to new technology and better approaches</strong>
            , not locked into legacy habits.
          </>,
          <>
            You{" "}
            <strong className="text-foreground">hire for capability and give it real autonomy</strong>
            , rather than staffing a role to execute instructions.
          </>,
          <>
            You treat{" "}
            <strong className="text-foreground">tools, resources, and work-life flexibility</strong>{" "}
            as inputs to good engineering, not perks.
          </>,
          <>
            You value <strong className="text-foreground">first-principles engineering</strong> over
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
  );
}

function LinksSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
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
          href={siteConfig.social.youtube}
          className="hover:text-accent transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          [y] youtube
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
          href="/newsletter"
          className="hover:text-accent transition-colors"
        >
          [n] newsletter
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
    </section>
  );
}
