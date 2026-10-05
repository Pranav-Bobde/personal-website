import type { ReactNode } from "react";
import { Briefcase, Clock, Globe, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { NewsletterCta } from "@/components/newsletter-cta";
import { siteConfig } from "@/lib/config";
import { workStudies } from "@/lib/work-studies";

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
          Mostly small teams and hands-on engineering. In a previous technology leadership role, I
          handled APIs, databases, integrations, deployments and mentoring.
        </p>
        <p>I'm looking for a hands-on TypeScript backend/full-stack role.</p>
      </div>
    </section>
  );
}

function HowIWorkSection() {
  return (
    <section className="border-border mt-12 border-t pt-12">
      <h2 className="section-title">how I work</h2>
      <p className="text-muted-foreground max-w-2xl leading-relaxed">
        I learn through real problems and carry those lessons into the next project. I use coding
        agents heavily, with repository rules and checks to give them useful feedback. When
        mentoring, I work through the reasoning with teammates so they can handle similar problems
        themselves.
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
          <article key={study.path} className="space-y-3">
            <h3 className="text-lg font-bold">{study.title}</h3>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {study.preview}
            </p>
            <Link
              to={study.path}
              className="text-accent hover:text-foreground border-accent border-b text-sm"
            >
              Read case study →
            </Link>
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
