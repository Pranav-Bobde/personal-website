import { createFileRoute } from "@tanstack/react-router";

import { NewsletterSignupForm } from "@/components/newsletter-cta";
import { siteConfig } from "@/lib/config";
import { newsletterPageSeo } from "@/lib/seo";

const newsletterSeo = newsletterPageSeo();

export const Route = createFileRoute("/newsletter")({
  head: () => newsletterSeo,
  component: NewsletterPage,
});

function NewsletterPage() {
  const topics = [
    "new AI releases and tools worth trying",
    "important tech news without the daily noise",
    "technical deep-dives and genuinely useful reads",
    "projects, experiments, and things I'm learning",
  ];

  return (
    <div className="animate-fade-in">
      <section className="newsletter-signal-first py-4 sm:py-10">
        <p className="text-accent mb-5 text-sm font-bold">{siteConfig.newsletter.name}</p>
        <h1 className="max-w-4xl text-4xl leading-[1.08] font-bold text-balance sm:text-6xl">
          Stay ahead of AI and tech without living on every feed.
        </h1>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_20rem] md:items-end">
          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
            The launches, technical deep-dives, useful reads, and ideas I think are actually worth
            your time. Sent weekly-ish, whenever there is enough signal to share.
          </p>
          <div className="border-accent border-t-2 pt-5">
            <p className="text-sm font-bold">Get the next note.</p>
            <NewsletterSignupForm className="mt-4" />
          </div>
        </div>
      </section>

      <section className="border-border mt-12 border-t pt-12">
        <h2 className="mb-6 text-sm font-bold">what makes the cut</h2>
        <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <p key={topic} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="text-accent">[+]</span>
              <span>{topic}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
