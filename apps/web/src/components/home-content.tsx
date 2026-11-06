import type { ReactNode } from "react";
import { Briefcase, Building2, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { NewsletterCta } from "@/components/newsletter-cta";
import { siteConfig } from "@/lib/config";
import { persistentStudy, workStudies } from "@/lib/work-studies";

interface HomeContentProps {
  videoSection: ReactNode;
}

export function HomeContent({ videoSection }: HomeContentProps) {
  return (
    <div className="animate-fade-in">
      <HomeHeader />
      <BackgroundSection />
      <HowIWorkSection />
      <SelectedWorkSection />
      {videoSection}
      <NewsletterCta />
      <LinksSection />
    </div>
  );
}

function BackgroundSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">background</h2>
      <div className="text-muted-foreground max-w-2xl space-y-4 leading-relaxed">
        <p>
          I was Head of Technology at Senslyze from July 2024 to July 2026, so every technical
          decision came down to me. I led 8-10 developers across 2-4 projects at a time, handled
          hiring, scoped solutions with clients, wrote SOWs, ran demos and owned delivery, and I
          still wrote backend code every day.
        </p>
        <p>
          Before that, at Persistent Systems, I prototyped a COBOL-to-Java migration with a
          multi-agent AutoGen setup. That work helped the company pursue multi-million-dollar deals,
          and I documented it in a{" "}
          <a
            href={persistentStudy.href}
            className="text-accent hover:text-foreground border-accent border-b"
            target="_blank"
            rel="noopener noreferrer"
          >
            company-published article
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function HowIWorkSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">how I work</h2>
      <p className="text-muted-foreground max-w-2xl leading-relaxed">
        I use coding agents every day, but I don't just trust what they write. I wrote specs for how
        each part of the codebase should look, and ESLint import boundaries and Fallow checks enforce
        them. Then I check the finished work myself in a browser.
      </p>
    </section>
  );
}

function SelectedWorkSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">selected work</h2>
      <div className="space-y-8">
        {workStudies.map((study) => (
          <article key={study.title} className="space-y-3">
            <h3 className="text-lg font-bold">{study.title}</h3>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {study.preview}
            </p>
            {"href" in study ? (
              <a
                href={study.href}
                className="text-accent hover:text-foreground border-accent border-b text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the article →
              </a>
            ) : (
              <Link
                to={study.path}
                className="text-accent hover:text-foreground border-accent border-b text-sm"
              >
                Read case study →
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
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
          <Building2 size={15} className="shrink-0" />
          <span>{siteConfig.current}</span>
        </div>
      </div>

      <p className="text-muted-foreground max-w-2xl leading-relaxed">{siteConfig.bio.main}</p>
    </header>
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
