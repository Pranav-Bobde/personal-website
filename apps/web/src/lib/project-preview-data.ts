/** Project data for the /projects page. */

/** Project copy with its verification state carried into the preview UI. */
export interface PlaceholderText {
  placeholder: boolean;
  text: string;
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

export interface PreviewProject {
  id: string;
  name: string;
  /** One-line positioning statement. Unverified. */
  thesis: PlaceholderText;
  /** Longer context paragraph. Unverified. */
  context: PlaceholderText;
  /** Spec-sheet rows for dense layouts. Unverified. */
  facts: ProjectFact[];
  /** Verified links only. */
  links: ProjectLink[];
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
  },
];
