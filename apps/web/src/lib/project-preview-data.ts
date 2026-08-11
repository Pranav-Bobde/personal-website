/**
 * Project data for the /preview/projects review routes.
 *
 * Evidence rule: only `repoUrl`, `siteUrl` and `demoPostUrl` are verified — they were
 * supplied directly with the brief. Nothing else about these projects is discoverable in
 * this repo, so every descriptive field is placeholder copy and is marked as such via
 * `PlaceholderText`. Preview surfaces must render that marking, never hide it.
 */

/** Project copy with its verification state carried into the preview UI. */
export interface PlaceholderText {
  placeholder: boolean;
  text: string;
}

/** Wraps unverified copy so a preview can render it with a placeholder marker. */
function draft(text: string): PlaceholderText {
  return { placeholder: true, text };
}

/** Copy sourced from project-specific task context supplied by the user. */
function sourced(text: string): PlaceholderText {
  return { placeholder: false, text };
}

export type LinkKind = "repo" | "site" | "demo";

export interface ProjectLink {
  kind: LinkKind;
  /** Short label shown in dense layouts. */
  label: string;
  href: string;
  /** Host shown as the visible evidence of where the link goes. */
  host: string;
}

export interface ProjectFact {
  /** Left-column key in dense/spec layouts. */
  key: string;
  value: PlaceholderText;
}

export interface ProjectLogEntry {
  /** Kept deliberately non-numeric: no real dates are known. */
  marker: string;
  body: PlaceholderText;
}

export interface PreviewProject {
  id: string;
  name: string;
  /** One-line positioning statement. Unverified. */
  thesis: PlaceholderText;
  /** Longer context paragraph. Unverified. */
  context: PlaceholderText;
  /** Spec-sheet rows for dense layouts. Unverified. */
  facts: ProjectFact[];
  /** Changelog-style entries for the logbook layout. Unverified. */
  log: ProjectLogEntry[];
  /** Verified links only. */
  links: ProjectLink[];
  /** Describes the media slot a real asset would fill. No asset exists locally. */
  media: {
    /** What the eventual asset should show. */
    intent: string;
    /** Aspect ratio for the reserved frame. */
    aspect: "video" | "square";
    /** Present only when a real embeddable demo URL is known. */
    embed?: ProjectEmbed;
  };
}

export interface ProjectEmbed {
  kind: "tweet";
  /** Canonical link, always rendered as a visible fallback. */
  canonicalUrl: string;
  /** Script-free iframe URL, matching the blog tweet embed in lib/markdown.ts. */
  embedUrl: string;
  title: string;
}

/** Matches an x.com/twitter.com status URL, capturing the path and the status id. */
const tweetUrlPattern = /^https:\/\/(?:x|twitter)\.com(\/[^/]+\/status\/(\d+))/;

/**
 * Builds the same script-free tweet iframe the blog renderer uses, so the preview does not
 * introduce a second embed mechanism. Returns undefined for anything that is not a status URL.
 */
function getTweetEmbed(rawUrl: string, title: string): ProjectEmbed | undefined {
  const match = tweetUrlPattern.exec(rawUrl);
  if (!match) {
    return undefined;
  }

  return {
    kind: "tweet",
    canonicalUrl: `https://x.com${match[1]}`,
    embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${match[2]}&theme=dark&dnt=true`,
    title,
  };
}

const laterCartDemoUrl = "https://x.com/PranavBobde/status/2084167546740392077";

export const previewProjects: PreviewProject[] = [
  {
    id: "better-mail",
    name: "better mail",
    thesis: sourced("An AI-assisted Gmail client — and an experiment in how far AI-led implementation can go with the right feedback loops."),
    context: sourced(
      "The intentional part was the development loop: planning, TDD and tests, implementation, linting, type-checking, static analysis, review, and repeated verification. The goal was to give coding agents enough tooling to evaluate their own work, catch failures, and self-correct — producing more verified output, not pretending the result is perfectly refined architecture.",
    ),
    facts: [
      {
        key: "stack",
        value: sourced("Next.js, TypeScript, Gmail API, PostgreSQL, Prisma, oRPC, CopilotKit, LangSmith"),
      },
    ],
    log: [
      { marker: "—", body: draft("Placeholder entry: what problem started the project.") },
      { marker: "—", body: draft("Placeholder entry: the decision that shaped the build.") },
      { marker: "—", body: draft("Placeholder entry: what shipped, and what is still open.") },
    ],
    links: [
      {
        kind: "site",
        label: "live site",
        href: "https://better-mail.app/",
        host: "better-mail.app",
      },
      {
        kind: "repo",
        label: "source",
        href: "https://github.com/Pranav-Bobde/better-mail",
        host: "github.com",
      },
    ],
    media: {
      intent: "Screenshot of the Better Mail inbox — no asset exists in this repo yet.",
      aspect: "video",
    },
  },
  {
    id: "latercart",
    name: "latercart",
    thesis: sourced("A repeat-purchase agent in iMessage, with every order approved one at a time."),
    context: sourced(
      "LaterCart brings recurring purchases into one conversational flow: schedule a reorder, refresh the product and price, then approve that specific purchase. Coffee is the first fully developed and validated vertical; the broader direction is capability-gated support for more merchants and categories, without claiming universal coverage.",
    ),
    facts: [
      { key: "stack", value: sourced("TypeScript, iMessage via Linq, UCP, Prava") },
    ],
    log: [
      { marker: "—", body: draft("Placeholder entry: the habit the project is aimed at.") },
      { marker: "—", body: draft("Placeholder entry: how the demo came together.") },
      { marker: "—", body: draft("Placeholder entry: what is still unfinished.") },
    ],
    links: [
      {
        kind: "demo",
        label: "demo on X",
        href: laterCartDemoUrl,
        host: "x.com",
      },
      {
        kind: "repo",
        label: "source",
        href: "https://github.com/Pranav-Bobde/latercart",
        host: "github.com",
      },
    ],
    media: {
      intent: "The demo clip posted on X. Embedded live; no local poster image exists.",
      aspect: "video",
      embed: getTweetEmbed(laterCartDemoUrl, "LaterCart demo posted on X"),
    },
  },
];

export const projectPreviewVariants = [
  {
    to: "/preview/projects/case-study",
    name: "case study",
    tagline: "Editorial, text-forward index.",
    tradeoff:
      "Reads as a written body of work and needs no media to look finished — which is the point while no screenshots exist. Costs the most writing, and two entries look thin at this width.",
  },
  {
    to: "/preview/projects/showcase",
    name: "showcase",
    tagline: "Media leads, copy supports.",
    tradeoff:
      "Strongest if the demo does the selling, and the LaterCart clip is real today. Weakest right now too: Better Mail has no asset, so half the page is a reserved empty frame.",
  },
  {
    to: "/preview/projects/logbook",
    name: "logbook",
    tagline: "Compact rows, system-native.",
    tradeoff:
      "Closest to the existing blog and watch-log rhythm, and the only variant that scales past a handful of projects. Deliberately undersells any single project.",
  },
  {
    to: "/preview/projects/logbook-detail",
    name: "logbook + detail",
    tagline: "Compact index, case-study depth on demand.",
    tradeoff:
      "Keeps the fast logbook scan, then uses Space to open the selected project as a focused case study without leaving the index.",
  },
] as const;
